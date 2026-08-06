import { useState } from 'react'
import type { WheelState } from '@shared/ipc-types'

// Decorative segments give the wheel something to spin through — the actual prize is always
// fixed server-side (see FREE_TWEAK_ID in wheelStore.ts). This list must include that tweak's id
// so the landing animation has a real segment to land on; the rest are just for visual variety.
const SEGMENTS = [
  { id: 'dark-mode', label: 'Dark Mode' },
  { id: 'game-mode', label: 'Game Mode' },
  { id: 'fullscreen-optimizations', label: 'Fullscreen Opts' },
  { id: 'visual-effects', label: 'Visual Effects' },
  { id: 'dns-cloudflare', label: 'DNS Boost' },
  { id: 'scheduling-registry-tweaks', label: 'CPU Scheduling' }
]
const SEGMENT_DEG = 360 / SEGMENTS.length
const SEGMENT_COLORS = ['#FF5500', '#1a1a1a', '#FF5500', '#1a1a1a', '#FF5500', '#1a1a1a']

interface WheelSpinModalProps {
  onClose: () => void
  onWon: (tweakId: string) => void
  onSpin: () => Promise<WheelState>
}

export default function WheelSpinModal({ onClose, onWon, onSpin }: WheelSpinModalProps): React.JSX.Element {
  const [rotation, setRotation] = useState(0)
  const [phase, setPhase] = useState<'idle' | 'spinning' | 'done'>('idle')
  const [wonLabel, setWonLabel] = useState<string | null>(null)

  async function handleSpin(): Promise<void> {
    if (phase !== 'idle') return
    setPhase('spinning')
    const result = await onSpin()
    const wonId = result.unlockedTweakId ?? SEGMENTS[0].id
    const index = Math.max(0, SEGMENTS.findIndex((s) => s.id === wonId))
    const segmentCenter = index * SEGMENT_DEG + SEGMENT_DEG / 2
    const fullSpins = 5 * 360
    setRotation(fullSpins + (360 - segmentCenter))

    window.setTimeout(() => {
      setWonLabel(SEGMENTS[index]?.label ?? 'a free tweak')
      setPhase('done')
      onWon(wonId)
    }, 4200)
  }

  const gradient = `conic-gradient(${SEGMENTS.map(
    (_, i) => `${SEGMENT_COLORS[i % SEGMENT_COLORS.length]} ${i * SEGMENT_DEG}deg ${(i + 1) * SEGMENT_DEG}deg`
  ).join(', ')})`

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <div className="w-full max-w-md rounded-lg border border-white/10 bg-ft-black p-6 text-center">
        <h2 className="ft-heading text-2xl text-ft-orange">Spin For A Free Tweak</h2>
        <p className="mt-2 text-sm text-white/60">
          One free spin, on the house — unlock one optimization at no cost, no account required.
        </p>

        <div className="relative mx-auto mt-6 h-64 w-64">
          <div
            className="absolute left-1/2 top-[-4px] z-10 -translate-x-1/2"
            style={{
              width: 0,
              height: 0,
              borderLeft: '10px solid transparent',
              borderRight: '10px solid transparent',
              borderTop: '18px solid #FF5500'
            }}
          />
          <div
            className="h-64 w-64 rounded-full border-4 border-white/20"
            style={{
              background: gradient,
              transform: `rotate(${rotation}deg)`,
              transition: phase === 'spinning' ? 'transform 4s cubic-bezier(0.12, 0.67, 0.18, 1)' : 'none'
            }}
          >
            {SEGMENTS.map((seg, i) => {
              // Positioned by trig, not rotate+translate — a rotated label reads upside-down past
              // 90°/270°, and the wheel's own rotation (on the parent) already spins these labels
              // along with their segments, so they only need to sit at the right point, upright.
              const angle = i * SEGMENT_DEG + SEGMENT_DEG / 2
              const radians = (angle * Math.PI) / 180
              const radius = 78 // px from center — mid-way into each wedge, well clear of the rim
              const x = radius * Math.sin(radians)
              const y = -radius * Math.cos(radians)
              return (
                <div
                  key={seg.id}
                  className="absolute w-20 -translate-x-1/2 -translate-y-1/2 text-center text-[10px] font-semibold text-white"
                  style={{ left: `calc(50% + ${x}px)`, top: `calc(50% + ${y}px)` }}
                >
                  {seg.label}
                </div>
              )
            })}
          </div>
          <div className="absolute left-1/2 top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-ft-orange" />
        </div>

        {phase === 'done' && wonLabel && (
          <div className="mt-6 rounded border border-ft-orange/30 bg-ft-orange/10 p-3">
            <p className="ft-heading text-lg text-ft-orange">You won: {wonLabel}!</p>
            <p className="mt-1 text-xs text-white/50">
              Unlocked for free — apply it any time from Optimizations.
            </p>
          </div>
        )}

        <div className="mt-6 flex justify-center gap-3">
          {phase !== 'done' && (
            <button
              type="button"
              onClick={handleSpin}
              disabled={phase === 'spinning'}
              className="ft-heading ft-btn-glow rounded bg-ft-orange px-6 py-2 text-lg tracking-wide text-ft-black transition-opacity hover:opacity-90 disabled:opacity-40"
            >
              {phase === 'spinning' ? 'Spinning…' : 'Spin'}
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="rounded px-4 py-2 text-sm text-white/60 hover:text-white"
          >
            {phase === 'done' ? 'Close' : 'Cancel'}
          </button>
        </div>
      </div>
    </div>
  )
}
