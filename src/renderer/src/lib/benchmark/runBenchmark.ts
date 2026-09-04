import { createScene, type BenchmarkScene } from './scene'

export const WARMUP_MS = 2000
export const MEASURE_MS = 23000
const MIN_SAMPLES = 10

export interface BenchmarkProgress {
  phase: 'warmup' | 'measuring'
  elapsedMs: number
  totalMs: number
}

export interface BenchmarkStats {
  avgFps: number
  onePercentLowFps: number
  sampleCount: number
}

export type BenchmarkOutcome = { ok: true; stats: BenchmarkStats } | { ok: false; reason: string }

export interface BenchmarkRun {
  result: Promise<BenchmarkOutcome>
  cancel: () => void
}

function computeStats(frameTimesMs: number[]): BenchmarkStats {
  const fpsSamples = frameTimesMs.map((t) => 1000 / t)
  const avgFps = fpsSamples.reduce((a, b) => a + b, 0) / fpsSamples.length
  // 1% low: the slowest 1% of frames by instantaneous FPS, averaged — standard convention (see
  // data/gameProfiles.ts's own references to "1% lows"), not a made-up formula.
  const sortedAsc = [...fpsSamples].sort((a, b) => a - b)
  const onePercentCount = Math.max(1, Math.ceil(sortedAsc.length * 0.01))
  const onePercentLowFps =
    sortedAsc.slice(0, onePercentCount).reduce((a, b) => a + b, 0) / onePercentCount

  return {
    avgFps: Math.round(avgFps * 10) / 10,
    onePercentLowFps: Math.round(onePercentLowFps * 10) / 10,
    sampleCount: fpsSamples.length
  }
}

/**
 * Runs the fixed-complexity scene for WARMUP_MS + MEASURE_MS, driven by a plain setTimeout loop
 * rather than requestAnimationFrame — see scene.ts / the Phase 1 design discussion for why rAF's
 * vsync tie would cap every machine's reported FPS at its monitor's refresh rate. gl.finish() each
 * frame forces the measured elapsed time to reflect real GPU completion, not just submission.
 * setTimeout(fn, 0) between frames yields back to the event loop so the UI (progress bar, cancel
 * button) stays responsive instead of freezing on one long synchronous loop.
 */
export function runBenchmark(
  canvas: HTMLCanvasElement,
  onProgress: (progress: BenchmarkProgress) => void
): BenchmarkRun {
  let cancelled = false
  let timer: ReturnType<typeof setTimeout> | null = null

  const resultPromise = new Promise<BenchmarkOutcome>((resolve) => {
    let gl: WebGLRenderingContext | null = null
    try {
      gl = (canvas.getContext('webgl', { antialias: false, powerPreference: 'high-performance' }) ??
        canvas.getContext('experimental-webgl', {
          antialias: false,
          powerPreference: 'high-performance'
        })) as WebGLRenderingContext | null
    } catch {
      gl = null
    }
    if (!gl) {
      resolve({ ok: false, reason: 'This PC could not create a WebGL context.' })
      return
    }

    let scene: BenchmarkScene
    try {
      scene = createScene(gl)
    } catch (err) {
      resolve({
        ok: false,
        reason: err instanceof Error ? err.message : 'Failed to initialize the benchmark scene.'
      })
      return
    }

    const frameTimesMs: number[] = []
    const start = performance.now()
    let lastTimestamp = start

    function finish(outcome: BenchmarkOutcome): void {
      scene.dispose()
      resolve(outcome)
    }

    function tick(): void {
      if (cancelled) {
        finish({ ok: false, reason: 'Benchmark cancelled.' })
        return
      }

      const now0 = performance.now()
      const elapsedSinceStart = now0 - start
      scene.draw((now0 - start) / 1000)
      gl!.finish()
      const now1 = performance.now()
      const frameTime = now1 - lastTimestamp
      lastTimestamp = now1

      const inWarmup = elapsedSinceStart < WARMUP_MS
      if (!inWarmup) frameTimesMs.push(frameTime)

      onProgress({
        phase: inWarmup ? 'warmup' : 'measuring',
        elapsedMs: inWarmup ? elapsedSinceStart : elapsedSinceStart - WARMUP_MS,
        totalMs: inWarmup ? WARMUP_MS : MEASURE_MS
      })

      if (elapsedSinceStart >= WARMUP_MS + MEASURE_MS) {
        if (frameTimesMs.length < MIN_SAMPLES) {
          finish({ ok: false, reason: 'Not enough frames were sampled to produce a reliable measurement.' })
          return
        }
        finish({ ok: true, stats: computeStats(frameTimesMs) })
        return
      }

      timer = setTimeout(tick, 0)
    }

    timer = setTimeout(tick, 0)
  })

  return {
    result: resultPromise,
    cancel: () => {
      cancelled = true
      if (timer) clearTimeout(timer)
    }
  }
}
