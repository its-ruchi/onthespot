import { useEffect, useRef } from 'react'

function Btn({
  children,
  onClick,
  variant = 'primary',
  className = '',
}: {
  children: React.ReactNode
  onClick?: () => void
  variant?: 'primary' | 'outline' | 'ghost'
  className?: string
}) {
  const base =
    'inline-flex items-center justify-center rounded-xl font-medium transition-all duration-150 cursor-pointer select-none'
  const vars = {
    primary: 'bg-navy text-cream px-7 py-3.5 text-sm tracking-wide hover:opacity-90 active:scale-[0.98]',
    outline: 'border border-navy/30 text-navy px-6 py-3 text-sm hover:border-navy hover:bg-navy/5 active:scale-[0.97]',
    ghost: 'text-muted text-sm px-3 py-2 hover:text-ink transition-colors',
  }
  return (
    <button onClick={onClick} className={`${base} ${vars[variant]} ${className}`}>
      {children}
    </button>
  )
}

export default function SpeakNotesScreen({
  prompt,
  notes,
  onNotesChange,
  onStartSpeaking,
  onBack,
  onSkip,
}: {
  prompt: string
  notes: string
  onNotesChange: (value: string) => void
  onStartSpeaking: () => void
  onBack: () => void
  onSkip: () => void
}) {
  const areaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    areaRef.current?.focus()
  }, [])

  const placeholder = `Optional cheat sheet for “${prompt}” — a claim, one example, a close. Not a script.`

  return (
    <div className="flex flex-col min-h-screen bg-cream">
      <header className="flex items-center justify-between px-6 py-4 border-b border-border/40">
        <button
          onClick={onBack}
          className="text-sm text-muted hover:text-ink transition-colors flex items-center gap-1 cursor-pointer"
        >
          ← Back
        </button>
        <span className="text-xs font-semibold tracking-widest text-muted uppercase">SPEAK</span>
        <span className="w-14" aria-hidden />
      </header>

      <main className="flex-1 px-6 py-8 max-w-lg mx-auto w-full flex flex-col fade-up">
        <p className="text-xs font-semibold tracking-widest text-muted uppercase mb-2">Optional — your cheat sheet</p>
        <h1 className="font-serif text-3xl text-ink mb-2 leading-tight">Jot a few notes</h1>
        <p className="text-muted text-sm mb-2 leading-relaxed">
          Keywords only. You can peek at these while you talk.
        </p>
        <p className="text-sm text-navy font-medium mb-6">{prompt}</p>

        <label htmlFor="speak-notes" className="sr-only">
          Speaking notes
        </label>
        <textarea
          id="speak-notes"
          ref={areaRef}
          value={notes}
          onChange={e => onNotesChange(e.target.value)}
          placeholder={placeholder}
          className="flex-1 min-h-[240px] w-full bg-white border border-border rounded-xl p-4 text-sm text-ink placeholder-border resize-none focus:border-blue transition-colors mb-6 leading-relaxed"
        />

        <Btn onClick={onStartSpeaking} className="w-full mb-3">
          Start speaking
        </Btn>
        <div className="flex items-center justify-between">
          <Btn variant="ghost" onClick={onBack}>
            ← Back to prep
          </Btn>
          <button
            type="button"
            onClick={onSkip}
            className="text-sm text-muted hover:text-navy underline-offset-2 hover:underline cursor-pointer"
          >
            Skip notes
          </button>
        </div>
      </main>
    </div>
  )
}
