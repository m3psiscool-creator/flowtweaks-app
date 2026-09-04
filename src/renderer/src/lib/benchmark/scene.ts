import { buildTransform } from './mat'

/**
 * Fixed-complexity scene, deliberately: this is a controlled, comparable proxy workload run
 * identically on every machine, not an attempt to imitate any specific game (see the free-scan
 * baseline design discussion — Section 5 of CLAUDE-free-scan.md). A grid of independently
 * transformed quads gives real per-draw-call CPU submission overhead (competitive shooters are
 * often CPU-bound per data/gameProfiles.ts's sourcing notes), and the fragment shader's unrolled
 * trig sum gives real per-pixel GPU ALU load — together a reasonable stand-in for "how hard can
 * this machine's CPU+GPU pair actually work," without needing any textures or model assets.
 */
export const GRID_SIZE = 24 // 576 draw calls/frame
const OCTAVES = 10

const VERTEX_SRC = `
attribute vec2 aPosition;
uniform mat4 uTransform;
varying vec2 vUv;
void main() {
  vUv = aPosition;
  // Size is controlled entirely by uTransform's own scale (buildTransform in mat.ts already
  // factors in cellSpan) — an earlier extra *0.055 shrink here compounded with that and rendered
  // every quad as a 2-3px dot instead of filling its grid cell, starving the fragment shader of
  // the per-pixel work it was designed to add (caught by actually looking at a screenshot, not
  // just checking the code compiled).
  gl_Position = uTransform * vec4(aPosition, 0.0, 1.0);
}
`

// The nested sin/cos sum is arbitrary by design — it exists purely to burn a fixed, unrolled amount
// of per-pixel ALU work every frame, not to look like anything in particular. The loop is unrolled
// (not a GLSL for-loop over a uniform) because old WebGL1 GLSL ES 1.00 compilers require constant
// loop bounds to unroll reliably across vendors.
const FRAGMENT_SRC = `
precision mediump float;
varying vec2 vUv;
uniform float uTime;
uniform vec2 uSeed;

void main() {
  float x = vUv.x + uSeed.x;
  float y = vUv.y + uSeed.y;
  float v = 0.0;
  float freq = 3.0;
  float amp = 0.5;
  ${Array.from({ length: OCTAVES })
    .map(
      () => `
  v += sin(x * freq + uTime) * cos(y * freq - uTime) * amp;
  freq *= 1.7;
  amp *= 0.82;`
    )
    .join('')}
  // A single scalar driving a black->orange->white ramp, not three independently-phased channels
  // cycling through the full hue wheel — the earlier version looked like a glitching rainbow
  // kaleidoscope, which reads as "something is wrong with my PC" for a tool whose entire job is
  // building trust (see CLAUDE-free-scan.md section 2). Same octave sum feeding it, so the actual
  // GPU workload this measures is unchanged — only the final color mapping is different.
  float intensity = clamp(0.5 + 0.5 * sin(v * 2.0 + uTime), 0.0, 1.0);
  vec3 base = vec3(0.05, 0.05, 0.06);
  vec3 orange = vec3(1.0, 0.333, 0.0);
  vec3 hot = vec3(1.0, 0.85, 0.7);
  vec3 color = mix(base, orange, smoothstep(0.15, 0.75, intensity));
  color = mix(color, hot, smoothstep(0.9, 1.0, intensity));
  gl_FragColor = vec4(color, 1.0);
}
`

function compileShader(gl: WebGLRenderingContext, type: number, source: string): WebGLShader {
  const shader = gl.createShader(type)
  if (!shader) throw new Error('Failed to create shader')
  gl.shaderSource(shader, source)
  gl.compileShader(shader)
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const info = gl.getShaderInfoLog(shader)
    gl.deleteShader(shader)
    throw new Error(`Shader compile failed: ${info}`)
  }
  return shader
}

export interface BenchmarkScene {
  draw(timeSeconds: number): void
  dispose(): void
}

export function createScene(gl: WebGLRenderingContext): BenchmarkScene {
  const vertexShader = compileShader(gl, gl.VERTEX_SHADER, VERTEX_SRC)
  const fragmentShader = compileShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SRC)

  const program = gl.createProgram()
  if (!program) throw new Error('Failed to create program')
  gl.attachShader(program, vertexShader)
  gl.attachShader(program, fragmentShader)
  gl.linkProgram(program)
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const info = gl.getProgramInfoLog(program)
    throw new Error(`Program link failed: ${info}`)
  }

  // prettier-ignore
  const quadVerts = new Float32Array([
    -1, -1,  1, -1,  -1, 1,
    -1, 1,   1, -1,   1, 1
  ])
  const vbo = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, vbo)
  gl.bufferData(gl.ARRAY_BUFFER, quadVerts, gl.STATIC_DRAW)

  const aPosition = gl.getAttribLocation(program, 'aPosition')
  const uTransform = gl.getUniformLocation(program, 'uTransform')
  const uTime = gl.getUniformLocation(program, 'uTime')
  const uSeed = gl.getUniformLocation(program, 'uSeed')

  gl.useProgram(program)
  gl.enableVertexAttribArray(aPosition)
  gl.bindBuffer(gl.ARRAY_BUFFER, vbo)
  gl.vertexAttribPointer(aPosition, 2, gl.FLOAT, false, 0, 0)

  const cellSpan = 2 / GRID_SIZE
  const cells: { x: number; y: number; seed: number }[] = []
  for (let row = 0; row < GRID_SIZE; row++) {
    for (let col = 0; col < GRID_SIZE; col++) {
      cells.push({
        x: -1 + cellSpan * (col + 0.5),
        y: -1 + cellSpan * (row + 0.5),
        seed: (row * GRID_SIZE + col) * 0.618
      })
    }
  }

  function draw(timeSeconds: number): void {
    gl.clearColor(0.02, 0.02, 0.03, 1)
    gl.clear(gl.COLOR_BUFFER_BIT)
    gl.uniform1f(uTime, timeSeconds)

    for (const cell of cells) {
      const angle = timeSeconds * 0.6 + cell.seed
      const scale = cellSpan * 0.48 * (1 + 0.15 * Math.sin(timeSeconds * 2 + cell.seed))
      const transform = buildTransform(cell.x, cell.y, angle, scale)
      gl.uniformMatrix4fv(uTransform, false, transform)
      gl.uniform2f(uSeed, cell.seed, cell.seed * 1.31)
      gl.drawArrays(gl.TRIANGLES, 0, 6)
    }
  }

  function dispose(): void {
    gl.deleteBuffer(vbo)
    gl.deleteProgram(program)
    gl.deleteShader(vertexShader)
    gl.deleteShader(fragmentShader)
  }

  return { draw, dispose }
}
