import { useEffect, useRef, useState } from 'react'
import { runBenchmark, type BenchmarkOutcome, type BenchmarkProgress } from '@renderer/lib/benchmark/runBenchmark'
import { IconBolt } from '@renderer/components/icons'

interface BenchmarkOverlayProps {
  onComplete: (outcome: BenchmarkOutcome) => void
  onCancel: () => void
}

/**
 * A fixed, full-viewport overlay rather than a change to App.tsx's layout — it covers the sidebar
 * and titlebar area just by sitting at a high z-index, so the benchmark takeover (confirmed with
 * the user in Phase 1) doesn't require threading a "hide chrome" flag through the shared shell.
 */
export default function BenchmarkOverlay({ onComplete, onCancel }: BenchmarkOverlayProps): React.JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [progress, setProgress] = useState<BenchmarkProgress>({ phase: 'warmup', elapsedMs: 0, totalMs: 2000 })

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const resize = (): void => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)

    const run = runBenchmark(canvas, setProgress)
    run.result.then(onComplete)

    return () => {
      window.removeEventListener('resize', resize)
      run.cancel()
    }
    // Runs exactly once per mount — BenchmarkOverlay is unmounted/remounted by its parent to start a fresh run.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const pct = Math.min(100, Math.round((progress.elapsedMs / progress.totalMs) * 100))

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-ft-black">
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
      <div className="relative z-10 flex w-full max-w-md flex-col items-center gap-4 rounded-lg bg-black/60 p-8 backdrop-blur-sm">
        <IconBolt className="h-8 w-8 text-ft-orange" />
        <p className="ft-heading text-xl tracking-wide text-white">
          {progress.phase === 'warmup' ? 'WARMING UP' : 'MEASURING YOUR BASELINE'}
        </p>
        <p className="text-center text-sm text-white/50">
          Running a fixed benchmark scene to measure this PC&apos;s real average FPS and 1% lows.
          This takes about 25 seconds.
        </p>
        <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-ft-orange transition-[width] duration-150"
            style={{ width: `${pct}%` }}
          />
        </div>
        <button
          type="button"
          onClick={onCancel}
          className="mt-2 text-xs text-white/40 underline hover:text-white/70"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}
