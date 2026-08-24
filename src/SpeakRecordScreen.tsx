import { useCallback, useEffect, useRef, useState } from 'react'
import type { SttStatus } from './scoreSpeech'

function fmtTime(secs: number) {
  const m = String(Math.floor(secs / 60)).padStart(2, '0')
  const s = String(secs % 60).padStart(2, '0')
  return `${m}:${s}`
}

type SpeechRec = {
  continuous: boolean
  interimResults: boolean
  lang: string
  start: () => void
  stop: () => void
  abort: () => void
  onresult: ((ev: SpeechRecognitionEventLike) => void) | null
  onerror: ((ev: { error: string }) => void) | null
  onend: (() => void) | null
}

type SpeechRecognitionEventLike = {
  resultIndex: number
  results: { length: number; [i: number]: { isFinal: boolean; 0: { transcript: string } } }
}

function getSpeechRecognitionCtor(): (new () => SpeechRec) | null {
  const w = window as Window & {
    SpeechRecognition?: new () => SpeechRec
    webkitSpeechRecognition?: new () => SpeechRec
  }
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null
}

export default function SpeakRecordScreen({
  prompt,
  speechMins,
  notes,
  onFinish,
  onBack,
}: {
  prompt: string
  speechMins: number
  notes: string
  onFinish: (result: { transcript: string; sttStatus: SttStatus }) => void
  onBack: () => void
}) {
  const [secsLeft, setSecsLeft] = useState(speechMins * 60)
  const [recording, setRecording] = useState(false)
  const [started, setStarted] = useState(false)
  const [showNotes, setShowNotes] = useState(false)
  const [showLeave, setShowLeave] = useState(false)
  const [liveText, setLiveText] = useState('')
  const [sttStatus, setSttStatus] = useState<SttStatus>(() => (getSpeechRecognitionCtor() ? 'ok' : 'unsupported'))
  const [waveHeights, setWaveHeights] = useState<number[]>(
    Array.from({ length: 28 }, () => 0.15 + Math.random() * 0.2),
  )

  const finalsRef = useRef('')
  const liveRef = useRef('')
  const statusRef = useRef<SttStatus>(getSpeechRecognitionCtor() ? 'ok' : 'unsupported')
  const recRef = useRef<SpeechRec | null>(null)
  const wantListenRef = useRef(false)
  const finishedRef = useRef(false)
  const hideBtnRef = useRef<HTMLButtonElement>(null)

  const hasNotes = notes.trim().length > 0

  const setStatus = (s: SttStatus) => {
    statusRef.current = s
    setSttStatus(s)
  }

  const stopRec = useCallback(() => {
    wantListenRef.current = false
    const live = liveRef.current.trim()
    if (live) {
      finalsRef.current = `${live} `.replace(/\s+/g, ' ')
    }
    const rec = recRef.current
    recRef.current = null
    if (!rec) return
    rec.onresult = null
    rec.onerror = null
    rec.onend = null
    try {
      rec.stop()
    } catch {
      try {
        rec.abort()
      } catch {
        /* ignore */
      }
    }
  }, [])

  const startRec = useCallback(() => {
    const Ctor = getSpeechRecognitionCtor()
    if (!Ctor) {
      setStatus('unsupported')
      return
    }
    stopRec()
    wantListenRef.current = true
    const rec = new Ctor()
    rec.continuous = true
    rec.interimResults = true
    rec.lang = 'en-US'
    rec.onresult = ev => {
      let interim = ''
      for (let i = ev.resultIndex; i < ev.results.length; i++) {
        const piece = ev.results[i][0].transcript
        if (ev.results[i].isFinal) {
          finalsRef.current = `${finalsRef.current}${piece} `.replace(/\s+/g, ' ')
        } else {
          interim += piece
        }
      }
      const next = `${finalsRef.current}${interim}`.trim()
      liveRef.current = next
      setLiveText(next)
      if (statusRef.current !== 'denied') setStatus('ok')
    }
    rec.onerror = ev => {
      if (ev.error === 'not-allowed' || ev.error === 'service-not-allowed') {
        setStatus('denied')
        wantListenRef.current = false
      } else if (ev.error === 'no-speech') {
        // keep listening; Chrome fires this on pauses
      } else if (ev.error === 'aborted') {
        // pause / restart
      } else {
        setStatus('error')
      }
    }
    rec.onend = () => {
      if (wantListenRef.current && !finishedRef.current) {
        try {
          rec.start()
        } catch {
          wantListenRef.current = false
          setStatus('error')
          setRecording(false)
        }
      }
    }
    recRef.current = rec
    try {
      rec.start()
    } catch {
      wantListenRef.current = false
      recRef.current = null
      setStatus('error')
      setRecording(false)
    }
  }, [stopRec])

  const finish = useCallback(() => {
    if (finishedRef.current) return
    finishedRef.current = true
    wantListenRef.current = false
    stopRec()
    const transcript = (liveRef.current || finalsRef.current).trim()
    let status = statusRef.current
    if (!transcript && status === 'ok') status = 'empty'
    onFinish({ transcript, sttStatus: status })
  }, [onFinish, stopRec])

  const finishRef = useRef(finish)
  finishRef.current = finish

  useEffect(() => {
    if (!started) return
    const id = setInterval(() => {
      setSecsLeft(s => {
        if (s <= 1) {
          clearInterval(id)
          return 0
        }
        return s - 1
      })
    }, 1000)
    return () => clearInterval(id)
  }, [started])

  useEffect(() => {
    if (started && secsLeft <= 0) finishRef.current()
  }, [started, secsLeft])

  useEffect(() => {
    if (!recording) return
    const id = setInterval(() => {
      setWaveHeights(Array.from({ length: 28 }, () => 0.1 + Math.random() * 0.9))
    }, 110)
    return () => clearInterval(id)
  }, [recording])

  useEffect(() => () => stopRec(), [stopRec])

  useEffect(() => {
    if (!showNotes) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowNotes(false)
    }
    window.addEventListener('keydown', onKey)
    hideBtnRef.current?.focus()
    return () => window.removeEventListener('keydown', onKey)
  }, [showNotes])

  const toggleMic = () => {
    if (!started) {
      setStarted(true)
      setRecording(true)
      startRec()
      return
    }
    if (recording) {
      setRecording(false)
      stopRec()
    } else {
      setRecording(true)
      startRec()
    }
  }

  const requestBack = () => {
    if (started) setShowLeave(true)
    else onBack()
  }

  const sttHint =
    sttStatus === 'unsupported'
      ? 'This browser cannot transcribe speech. Try Chrome or Edge — we will not invent a score.'
      : sttStatus === 'denied'
        ? 'Microphone access was blocked. Allow it to score from what you actually say.'
        : sttStatus === 'error'
          ? 'Listening hit a snag. You can still finish, but scoring needs a transcript.'
          : null

  return (
    <div className="flex flex-col min-h-screen relative" style={{ backgroundColor: '#1C1C2E' }}>
      <header className="flex items-center justify-between px-6 py-4 z-30">
        <button
          type="button"
          onClick={requestBack}
          className="text-sm text-cream/60 hover:text-cream transition-colors cursor-pointer"
        >
          ← Back
        </button>
        <button
          type="button"
          onClick={() => setShowNotes(open => !open)}
          className="text-sm text-cream/80 hover:text-cream border border-cream/20 rounded-lg px-3 py-1.5 cursor-pointer"
          aria-haspopup="dialog"
          aria-expanded={showNotes}
        >
          See notes
        </button>
      </header>

      <main className="flex-1 px-6 flex flex-col items-center pb-10 max-w-lg mx-auto w-full fade-up">
        <p className="text-blue/50 text-sm text-center mt-2 mb-6 leading-relaxed max-w-xs">{prompt}</p>
        <div className="font-serif text-8xl text-cream tabular-nums mb-8">{fmtTime(secsLeft)}</div>

        <div className="flex items-end gap-[3px] h-14 mb-8" aria-hidden>
          {waveHeights.map((h, i) => (
            <div
              key={i}
              className="w-1 rounded-full transition-all duration-100"
              style={{ height: `${Math.round(h * 56)}px`, backgroundColor: '#95B1EE', opacity: recording ? 0.5 + h * 0.5 : 0.18 }}
            />
          ))}
        </div>

        <div className="relative mb-8 flex flex-col items-center">
          <div className="h-5 mb-2 flex items-center gap-1.5" aria-live="polite">
            {recording && <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse inline-block" />}
            <span className={`text-xs font-medium ${recording ? 'text-red-400' : 'text-cream/40'}`}>
              {recording ? 'Rec' : started ? 'Paused' : '\u00a0'}
            </span>
          </div>
          <div className="relative">
            {recording && (
              <div className="absolute inset-0 rounded-full pulse-ring" style={{ backgroundColor: '#95B1EE', opacity: 0.25 }} />
            )}
            <button
              onClick={toggleMic}
              aria-label={recording ? 'Pause recording' : 'Start recording'}
              className="relative w-20 h-20 rounded-full flex items-center justify-center text-3xl transition-all duration-200 cursor-pointer"
              style={{
                backgroundColor: recording ? 'rgba(239,68,68,0.15)' : '#364C84',
                border: `2px solid ${recording ? '#ef4444' : '#95B1EE40'}`,
                boxShadow: recording ? '0 0 28px rgba(239,68,68,0.2)' : 'none',
              }}
            >
              🎤
            </button>
          </div>
        </div>

        {sttHint && (
          <p className="text-xs text-lime/90 text-center max-w-sm mb-4 leading-relaxed">{sttHint}</p>
        )}

        {liveText && (
          <p className="text-xs text-cream/45 text-center max-w-sm mb-6 line-clamp-3 leading-relaxed">
            {liveText}
          </p>
        )}

        <button
          onClick={finish}
          className="text-sm text-cream/50 hover:text-cream transition-colors cursor-pointer"
        >
          Finish
        </button>
      </main>

      {showNotes && (
        <div className="absolute inset-0 top-[60px] z-40 flex items-end sm:items-stretch sm:justify-end pointer-events-none">
          <div
            className="absolute inset-0 pointer-events-auto"
            style={{ backgroundColor: 'rgba(28,28,46,0.35)' }}
            onClick={() => setShowNotes(false)}
            aria-hidden
          />
          <aside
            role="dialog"
            aria-label="Your notes"
            className="pointer-events-auto relative w-full sm:w-[22rem] sm:max-w-[42%] max-h-[42%] sm:max-h-full sm:h-full min-h-0 bg-cream border-t sm:border-t-0 sm:border-l border-border rounded-t-2xl sm:rounded-none p-5 flex flex-col shadow-lg overflow-hidden"
          >
            <div className="flex items-center justify-between mb-3 flex-shrink-0">
              <p className="text-xs font-semibold tracking-widest text-muted uppercase">Your notes</p>
              <button
                ref={hideBtnRef}
                type="button"
                onClick={() => setShowNotes(false)}
                className="text-sm text-navy font-medium cursor-pointer"
              >
                Hide notes
              </button>
            </div>
            {hasNotes ? (
              <p className="text-sm text-ink leading-relaxed whitespace-pre-wrap overflow-y-auto flex-1 min-h-0">{notes}</p>
            ) : (
              <p className="text-sm text-muted leading-relaxed flex-1 min-h-0 overflow-y-auto">
                No notes yet.
              </p>
            )}
            <p className="text-xs text-muted mt-3 flex-shrink-0">Recording keeps going. Read these out if you want.</p>
          </aside>
        </div>
      )}

      {showLeave && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-6"
          style={{ backgroundColor: 'rgba(28,28,30,0.5)' }}
        >
          <div
            role="alertdialog"
            aria-labelledby="leave-rec-title"
            className="bg-cream rounded-2xl p-6 max-w-sm w-full"
          >
            <h2 id="leave-rec-title" className="font-serif text-2xl text-ink mb-2">
              Leave recording?
            </h2>
            <p className="text-sm text-muted mb-6 leading-relaxed">Your take will be discarded.</p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowLeave(false)}
                className="flex-1 border border-navy/30 text-navy rounded-xl py-3 text-sm cursor-pointer"
              >
                Keep recording
              </button>
              <button
                type="button"
                onClick={() => {
                  finishedRef.current = true
                  stopRec()
                  onBack()
                }}
                className="flex-1 bg-navy text-cream rounded-xl py-3 text-sm cursor-pointer"
              >
                Discard
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
