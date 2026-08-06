import { IconSparkle, IconClock, IconShield, IconInfo } from '@renderer/components/icons'

interface StepProps {
  n: number
  title: string
  children: React.ReactNode
}

function Step({ n, title, children }: StepProps): React.JSX.Element {
  return (
    <div className="flex gap-4">
      <div className="ft-heading flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-ft-orange text-sm text-ft-black">
        {n}
      </div>
      <div>
        <h3 className="font-semibold text-white">{title}</h3>
        <p className="mt-1 text-sm text-white/60">{children}</p>
      </div>
    </div>
  )
}

export default function About(): React.JSX.Element {
  return (
    <div className="max-w-2xl">
      <h1 className="flex items-center gap-3 text-4xl text-ft-orange">
        <IconSparkle className="h-8 w-8" /> About Flow Tweaks
      </h1>
      <p className="mt-3 text-white/60">
        Flow Tweaks applies the same PC optimizations we&apos;d normally apply by hand over a
        remote session — registry changes, debloating, power settings, and network tuning — but it
        runs locally on your own machine. Nothing is ever remotely accessed; the app does the work
        itself.
      </p>

      <section className="ft-glass mt-8 p-5">
        <h2 className="ft-heading text-xl text-white/80">How it works</h2>
        <div className="mt-4 flex flex-col gap-5">
          <Step n={1} title="Scan">
            Optimizations reads your PC&apos;s current settings first. Nothing is changed by
            scanning — it just tells you what&apos;s already good, what could be improved, and
            what needs administrator rights.
          </Step>
          <Step n={2} title="Choose">
            Click a card to select it, or use Run All to select everything eligible at once.
          </Step>
          <Step n={3} title="Apply">
            Before anything changes, Flow Tweaks creates a Windows restore point and saves the
            exact previous value of every setting it&apos;s about to touch. Then it applies your
            selection and shows a results report: applied, already enabled, skipped, or needs
            manual review.
          </Step>
          <Step n={4} title="Restore, any time">
            The Restore tab lets you undo a single change, a whole session, or everything at once
            — back to the exact value it was before, not a guessed default.
          </Step>
        </div>
      </section>

      <section className="ft-glass mt-6 p-5">
        <h2 className="ft-heading flex items-center gap-2 text-xl text-white/80">
          <IconClock className="h-5 w-5" /> Diagnostics &amp; support
        </h2>
        <p className="mt-2 text-sm text-white/60">
          If something needs a second pair of eyes, Diagnostics can generate a support code from
          your real change history — send it to us on Discord and we can see exactly what was
          applied, skipped, or failed without any guesswork.
        </p>
      </section>

      <section className="ft-glass mt-6 p-5">
        <h2 className="ft-heading flex items-center gap-2 text-xl text-white/80">
          <IconShield className="h-5 w-5" /> One honest note
        </h2>
        <p className="mt-2 flex items-start gap-2 text-sm text-white/60">
          <IconInfo className="mt-0.5 h-4 w-4 shrink-0 text-white/30" />
          Flow Tweaks won&apos;t promise a specific FPS number — results depend on your exact
          hardware and existing setup. It automates the majority of what we&apos;d do by hand,
          safely. Unusual problems — driver issues, BIOS settings, overheating, corrupted Windows
          files — still need a human. That&apos;s what Discord support is for.
        </p>
      </section>
    </div>
  )
}
