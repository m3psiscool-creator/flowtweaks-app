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
      <h1 className="text-4xl text-ft-orange">About Flow Tweaks</h1>
      <p className="mt-3 text-white/60">
        Flow Tweaks applies the same PC optimizations we&apos;d normally apply by hand over a
        remote session — registry changes, debloating, power settings, and network tuning — but it
        runs locally on your own machine. Nothing is ever remotely accessed; the app does the work
        itself.
      </p>

      <section className="mt-8">
        <h2 className="ft-heading text-xl text-white/80">How it works</h2>
        <div className="mt-4 flex flex-col gap-5">
          <Step n={1} title="Scan">
            Optimizations reads your PC&apos;s current settings first. Nothing is changed by
            scanning — it just tells you what&apos;s already good, what could be improved, and
            what needs administrator rights.
          </Step>
          <Step n={2} title="Choose">
            Click a card to select it, or use Run All to select everything eligible at once. One
            tweak is unlocked free through the spin-the-wheel offer; the rest are part of the paid
            package.
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

      <section className="mt-8">
        <h2 className="ft-heading text-xl text-white/80">Boost Mode</h2>
        <p className="mt-2 text-sm text-white/60">
          An optional background watcher. Pick a game and the background programs you want paused
          while it runs — Flow Tweaks applies a couple of temporary, instantly-reversible settings
          when the game launches and puts everything back exactly as it was the moment it closes.
        </p>
      </section>

      <section className="mt-8">
        <h2 className="ft-heading text-xl text-white/80">Diagnostics &amp; support</h2>
        <p className="mt-2 text-sm text-white/60">
          If something needs a second pair of eyes, Diagnostics can generate a support code from
          your real change history — send it to us on Discord and we can see exactly what was
          applied, skipped, or failed without any guesswork.
        </p>
      </section>

      <section className="mt-8">
        <h2 className="ft-heading text-xl text-white/80">One honest note</h2>
        <p className="mt-2 text-sm text-white/60">
          Flow Tweaks won&apos;t promise a specific FPS number — results depend on your exact
          hardware and existing setup. It automates the majority of what we&apos;d do by hand,
          safely. Unusual problems — driver issues, BIOS settings, overheating, corrupted Windows
          files — still need a human. That&apos;s what Discord support is for.
        </p>
      </section>
    </div>
  )
}
