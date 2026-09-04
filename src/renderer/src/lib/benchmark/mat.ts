/**
 * Hand-rolled instead of pulling in gl-matrix/three — the benchmark scene only ever needs a 2D
 * affine transform (translate + rotate + scale) embedded in a 4x4 for the vertex shader's
 * gl_Position math, not real 3D projection. Keeps the installer free of a rendering dependency for
 * one small feature (see the Phase 1 discussion on why raw WebGL was chosen over three.js).
 */
export type Mat4 = Float32Array

export function buildTransform(tx: number, ty: number, angle: number, scale: number): Mat4 {
  const c = Math.cos(angle) * scale
  const s = Math.sin(angle) * scale
  // Column-major, matching WebGL's expected uniformMatrix4fv layout.
  // prettier-ignore
  return new Float32Array([
    c,  s,  0, 0,
    -s, c,  0, 0,
    0,  0,  1, 0,
    tx, ty, 0, 1
  ])
}
