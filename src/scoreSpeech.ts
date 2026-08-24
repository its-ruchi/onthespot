export type SttStatus = 'ok' | 'unsupported' | 'denied' | 'error' | 'empty'

export interface FeedbackData {
  headline: string
  score: number
  metrics: { label: string; score: number }[]
  wentWell: string
  improve: string
  wellQuote: string | null
  improveQuote: string | null
  transcript: string
  sttStatus: SttStatus
}

const FILLER_RE =
  /\b(um+|uh+|er+|ah+|hmm+|like|you know|i mean|kind of|kinda|sort of|sorta|basically|actually|literally|right|so yeah|yeah so)\b/gi

const CLAIM_RE =
  /\b(i (think|believe|feel|argue|would say)|my (view|take|point|opinion)|the point is|here is the thing|what matters is)\b/i
const SOFT_CLAIM_RE = /\bshould(n't)?\b/i

const EXAMPLE_RE =
  /\b(for example|for instance|such as|like when|i (saw|heard|worked|tried|noticed)|last (year|month|week)|in practice)\b/i

const CLOSE_RE =
  /\b((so |and )?(overall|in conclusion|to wrap up|to sum up|the bottom line)|that's why|that is why|so i would|in short|all in all|the takeaway)\b/i

function wordsOf(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9'\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
}

function contentWords(words: string[]): string[] {
  const stop = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'is', 'it',
    'that', 'this', 'with', 'as', 'be', 'are', 'was', 'were', 'been', 'i', 'we', 'you',
    'they', 'he', 'she', 'my', 'our', 'your', 'their', 'not', 'so', 'if', 'then', 'than',
    'just', 'about', 'from', 'have', 'has', 'had', 'do', 'does', 'did', 'can', 'could',
    'would', 'should', 'will', 'there', 'what', 'when', 'which', 'who', 'how', 'why',
  ])
  return words.filter(w => w.length > 2 && !stop.has(w))
}

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n))
}

function round1(n: number) {
  return Math.round(clamp(n, 0, 10))
}

function clipPhrase(text: string, max = 132) {
  const t = text.replace(/\s+/g, ' ').trim()
  if (!t) return ''
  if (t.length <= max) return t
  return `${t.slice(0, max).trim()}…`
}

function spanAround(transcript: string, index: number, matchLen: number, left = 8, right = 10): string {
  const before = transcript.slice(0, index).split(/\s+/).filter(Boolean)
  const after = transcript.slice(index + matchLen).split(/\s+/).filter(Boolean)
  const mid = transcript.slice(index, index + matchLen)
  return clipPhrase(`${before.slice(-left).join(' ')} ${mid} ${after.slice(0, right).join(' ')}`)
}

function firstMatchSpan(transcript: string, re: RegExp): string | null {
  const copy = new RegExp(re.source, re.flags.includes('g') ? re.flags : `${re.flags}g`)
  copy.lastIndex = 0
  const m = copy.exec(transcript)
  if (!m || m.index === undefined) return null
  return spanAround(transcript, m.index, m[0].length)
}

function chunks(transcript: string): string[] {
  const cleaned = transcript.replace(/\s+/g, ' ').trim()
  if (!cleaned) return []
  const punct = cleaned.split(/(?<=[.!?])\s+/).map(s => s.trim()).filter(s => s.split(/\s+/).length >= 4)
  if (punct.length >= 2) return punct.map(p => clipPhrase(p, 160))
  const w = cleaned.split(/\s+/)
  if (w.length <= 18) return [cleaned]
  const out: string[] = []
  for (let i = 0; i < w.length; i += 9) {
    out.push(w.slice(i, i + 14).join(' '))
  }
  return out.filter(p => p.split(/\s+/).length >= 4)
}

function densestFillerSpan(transcript: string): string | null {
  const w = transcript.split(/\s+/).filter(Boolean)
  if (w.length < 6) return null
  const win = Math.min(14, w.length)
  let best = { i: 0, n: 0 }
  for (let i = 0; i <= w.length - win; i++) {
    const slice = w.slice(i, i + win).join(' ')
    const n = (slice.match(FILLER_RE) ?? []).length
    if (n > best.n) best = { i, n }
  }
  if (best.n < 2) return null
  return clipPhrase(w.slice(best.i, best.i + win).join(' '))
}

function topicSpan(transcript: string, tokens: string[]): string | null {
  const lower = transcript.toLowerCase()
  for (const t of tokens) {
    const idx = lower.indexOf(t)
    if (idx >= 0) return spanAround(transcript, idx, t.length, 6, 8)
  }
  return null
}

function strongestChunk(parts: string[], tokens: string[]): string {
  if (parts.length === 0) return ''
  let best = parts[0]
  let score = -1
  for (const p of parts) {
    const c = contentWords(wordsOf(p))
    const hits = tokens.filter(t => p.toLowerCase().includes(t)).length
    const s = c.length + hits * 4 - (p.match(FILLER_RE) ?? []).length * 3
    if (s > score) {
      score = s
      best = p
    }
  }
  return clipPhrase(best)
}

function weakestChunk(parts: string[], tokens: string[]): string {
  if (parts.length === 0) return ''
  let worst = parts[parts.length - 1]
  let score = Infinity
  for (const p of parts) {
    const c = contentWords(wordsOf(p))
    const hits = tokens.filter(t => p.toLowerCase().includes(t)).length
    const fillers = (p.match(FILLER_RE) ?? []).length
    const s = c.length + hits * 3 - fillers * 4
    if (s < score) {
      score = s
      worst = p
    }
  }
  return clipPhrase(worst)
}

function overlap(a: string, b: string) {
  const A = new Set(contentWords(wordsOf(a)))
  const B = contentWords(wordsOf(b))
  if (A.size === 0 || B.length === 0) return 0
  return B.filter(w => A.has(w)).length / Math.max(A.size, new Set(B).size)
}

function repeatedPair(parts: string[]): { a: string; b: string } | null {
  for (let i = 0; i < parts.length; i++) {
    for (let j = i + 1; j < parts.length; j++) {
      if (overlap(parts[i], parts[j]) >= 0.45 && parts[i].split(/\s+/).length >= 6) {
        return { a: clipPhrase(parts[i], 110), b: clipPhrase(parts[j], 110) }
      }
    }
  }
  return null
}

function topicTokens(name: string, teaser?: string): string[] {
  const raw = `${name} ${teaser ?? ''}`
  return [...new Set(contentWords(wordsOf(raw)))].filter(w => w.length > 3)
}

function hasAny(text: string, patterns: RegExp[]) {
  return patterns.some(p => p.test(text))
}

function headlineFor(score: number, wordCount: number): string {
  if (wordCount === 0) return 'Silence is not a speech.'
  if (wordCount < 12) return 'Too thin to score well.'
  if (score < 35) return 'A start, not a speech.'
  if (score < 50) return 'You showed up.'
  if (score < 65) return "There's a real point in there."
  if (score < 78) return 'Clear and considered.'
  if (score < 88) return "That's a real take."
  return 'Sharp. You owned it.'
}

function emptyFeedback(sttStatus: SttStatus, copy: { headline: string; wentWell: string; improve: string }, transcript: string): FeedbackData {
  return {
    headline: copy.headline,
    score: 0,
    metrics: [
      { label: 'Clarity', score: 0 },
      { label: 'Fluency', score: 0 },
      { label: 'Structure', score: 0 },
      { label: 'Vocabulary', score: 0 },
    ],
    wentWell: copy.wentWell,
    improve: copy.improve,
    wellQuote: null,
    improveQuote: null,
    transcript,
    sttStatus,
  }
}

export function scoreFromTranscript(input: {
  transcript: string
  topicName: string
  teaser?: string
  speechMins: number
  sttStatus: SttStatus
}): FeedbackData {
  const transcript = input.transcript.replace(/\s+/g, ' ').trim()
  const sttStatus = transcript ? 'ok' : input.sttStatus === 'ok' ? 'empty' : input.sttStatus

  if (sttStatus === 'unsupported' || sttStatus === 'denied' || sttStatus === 'error') {
    const copy = {
      unsupported: {
        headline: "We couldn't transcribe this take.",
        wentWell: 'Speech-to-text is not available in this browser. Chrome or Edge on a computer usually works. There is no transcript to quote.',
        improve: 'Allow the microphone and try again. Scoring needs the words you actually said — we will not invent quotes or a score.',
      },
      denied: {
        headline: 'Microphone access was blocked.',
        wentWell: 'Nothing was captured, so there is no phrase to praise and no honest score to give.',
        improve: 'Allow microphone access, then record again. We only quote and score from your transcript.',
      },
      error: {
        headline: 'Listening failed this time.',
        wentWell: 'The recorder hit an error before we had a usable transcript, so there are no lines to quote.',
        improve: 'Try again in a quieter place, check the mic, and stay on this tab while you speak.',
      },
    }[sttStatus]
    return emptyFeedback(sttStatus, copy, transcript)
  }

  const words = wordsOf(transcript)
  const wordCount = words.length
  const content = contentWords(words)
  const lower = transcript.toLowerCase()

  const fillerMatches = transcript.match(FILLER_RE) ?? []
  const fillerCount = fillerMatches.length
  const fillerRatio = wordCount === 0 ? 1 : fillerCount / wordCount

  const topicBits = topicTokens(input.topicName, input.teaser)
  const hit = topicBits.filter(t => lower.includes(t))
  const topicCover = topicBits.length === 0 ? 0.4 : hit.length / topicBits.length

  const hasClaim = hasAny(lower, [CLAIM_RE, SOFT_CLAIM_RE])
  const hasExample = hasAny(lower, [EXAMPLE_RE])
  const hasClose = hasAny(lower, [CLOSE_RE])
  const structureHits = Number(hasClaim) + Number(hasExample) + Number(hasClose)

  const unique = new Set(content)
  const ttr = content.length === 0 ? 0 : unique.size / content.length
  const freq = new Map<string, number>()
  for (const w of content) freq.set(w, (freq.get(w) ?? 0) + 1)
  const mostRepeated = [...freq.entries()].sort((a, b) => b[1] - a[1])[0]
  const repeatHeavy = mostRepeated ? mostRepeated[1] >= 5 && mostRepeated[1] / Math.max(content.length, 1) > 0.12 : false

  const expected = Math.max(80, input.speechMins * 110)
  const lengthRatio = wordCount / expected

  let lengthCap = 100
  if (wordCount < 8) lengthCap = 16
  else if (wordCount < 18) lengthCap = 34
  else if (wordCount < 35) lengthCap = 48
  else if (wordCount < 60) lengthCap = 62
  else if (wordCount < 90) lengthCap = 74
  else if (wordCount < 130) lengthCap = 84
  else lengthCap = 94

  if (lengthRatio < 0.18 && wordCount < 90) {
    lengthCap = Math.min(lengthCap, 58)
  }

  let clarity = 0
  if (wordCount >= 8) clarity += 2
  if (wordCount >= 25) clarity += 1.5
  if (wordCount >= 50) clarity += 1
  clarity += topicCover * 4
  if (hasClaim) clarity += 1.2
  if (fillerRatio > 0.08) clarity -= 1.5
  if (fillerRatio > 0.14) clarity -= 1.5
  if (repeatHeavy) clarity -= 1
  if (topicCover < 0.12 && wordCount >= 20) clarity -= 2.5

  let fluency = 0
  if (wordCount >= 12) fluency += 3
  if (wordCount >= 40) fluency += 1.5
  fluency += clamp(3.5 - fillerRatio * 22, 0, 3.5)
  if (fillerCount === 0 && wordCount >= 25) fluency += 1.5
  else if (fillerCount <= 2 && wordCount >= 40) fluency += 0.8
  if (fillerCount >= 8) fluency -= 2
  const avgLen = wordCount === 0 ? 0 : transcript.length / wordCount
  if (avgLen < 3.2 && wordCount >= 15) fluency -= 1.5

  let structure = structureHits * 2.6
  if (wordCount >= 40) structure += 1
  if (wordCount < 20) structure = Math.min(structure, 2)
  if (!hasClaim && wordCount >= 25) structure -= 0.5
  if (hasClaim && hasExample && hasClose) structure += 1.5

  let vocabulary = ttr * 8
  if (content.length >= 25) vocabulary += 1
  if (repeatHeavy) vocabulary -= 2.5
  const longWords = content.filter(w => w.length >= 7).length
  if (longWords >= 4 && wordCount >= 30) vocabulary += 1.2
  if (ttr > 0.85 && wordCount > 80) vocabulary -= 0.8

  const clarityS = round1(clarity)
  const fluencyS = round1(fluency)
  const structureS = round1(structure)
  const vocabS = round1(vocabulary)

  let overall = Math.round(
    (clarityS * 2.6 + fluencyS * 2.4 + structureS * 2.6 + vocabS * 2.4) * 1.05,
  )
  overall = clamp(overall, 0, lengthCap)
  if (wordCount === 0) overall = 0
  if (topicCover < 0.08 && wordCount >= 25) overall = Math.min(overall, 46)

  const parts = chunks(transcript)
  const claimSpan = firstMatchSpan(transcript, CLAIM_RE) ?? firstMatchSpan(transcript, SOFT_CLAIM_RE)
  const exampleSpan = firstMatchSpan(transcript, EXAMPLE_RE)
  const closeSpan = firstMatchSpan(transcript, CLOSE_RE)
  const topicHitSpan = topicSpan(transcript, hit)
  const fillerSpan = densestFillerSpan(transcript)
  const pair = repeatedPair(parts)
  const strong = strongestChunk(parts, topicBits)
  const weak = weakestChunk(parts, topicBits)
  const lastBit = clipPhrase(transcript.split(/\s+/).slice(-12).join(' '))
  const topic = input.topicName

  let wellQuote: string | null = null
  let wentWell = ''
  let improveQuote: string | null = null
  let improve = ''

  if (wordCount === 0) {
    wentWell = 'No words were captured, so there is nothing to quote or praise yet.'
    improve = 'Speak a full thought out loud, then submit again. We will quote your actual lines — we will not invent them.'
  } else if (wordCount < 12) {
    wellQuote = transcript
    wentWell = `This is everything we heard — ${wordCount} words. That is too thin to call a strong opening or a developed point.`
    improveQuote = transcript
    improve = `Say this again, then keep going: add one reason and one concrete example (a person, a number, or a moment) about ${topic}. Do not restart the same sentence twice.`
  } else {
    if (claimSpan) {
      wellQuote = claimSpan
      wentWell = `When you said that, the point landed because you took a side instead of only describing the topic.`
    } else if (exampleSpan) {
      wellQuote = exampleSpan
      wentWell = `When you said that, it made the argument easy to picture — a listener can hold an example, not a fog of adjectives.`
    } else if (topicHitSpan) {
      wellQuote = topicHitSpan
      wentWell = `When you said that, you actually touched ${topic} instead of floating next to it.`
    } else if (strong) {
      wellQuote = strong
      wentWell = `This was the clearest stretch we heard. It still needs a sharper claim to earn a high score.`
    }

    if (!hasExample && claimSpan) {
      improveQuote = claimSpan
      improve = `You stated a view, then did not prove it. Next time, after that line, add one concrete beat: a person, a number, or a moment — not another abstract pass at ${topic}.`
    } else if (fillerSpan && fillerCount >= 4) {
      improveQuote = fillerSpan
      improve = `This stretch repeated the same stall (${fillerCount} filler hits in the take). Cut the padding and land the next sentence: “So the point on ${topic} is ___.”`
    } else if (pair) {
      improveQuote = pair.b
      improve = `This stretch — and the earlier “${pair.a}” — restated the same idea. Replace the second pass with one example, then stop.`
    } else if (!hasClose && wordCount >= 20) {
      improveQuote = lastBit
      improve = `You ended while still mid-thought. Use that last line as a runway, then close: “That's why ${topic} ${hasClaim ? 'holds' : 'matters'}.” One sentence. Then silence.`
    } else if (topicCover < 0.2) {
      improveQuote = weak || strong
      improve = `That stretch barely names ${topic}. Open the next take with the prompt in the first breath: “I think ${topic} is ___ because ___.”`
    } else if (repeatHeavy && mostRepeated) {
      improveQuote = strong || transcript.split(/\s+/).slice(0, 16).join(' ')
      improve = `“${mostRepeated[0]}” showed up ${mostRepeated[1]} times. After you use it once, switch to a more precise word instead of looping the same noun.`
    } else if (!hasClaim) {
      improveQuote = weak || strong
      improve = `That stretch describes without deciding. Rewrite it as a claim: “I think ${topic} [verb] because [one reason].” Then give the example you already almost reached.`
    } else {
      improveQuote = weak
      improve = `This was the mushiest stretch. Swap it for one specific: who did what, what it cost, or what changed — then go back to your close.`
    }

    if (hasExample && exampleSpan && wellQuote && wellQuote !== exampleSpan && wentWell.length < 220) {
      wentWell = `${wentWell} You also grounded it here: “${exampleSpan}.”`
    }
  }

  return {
    headline: headlineFor(overall, wordCount),
    score: overall,
    metrics: [
      { label: 'Clarity', score: wordCount === 0 ? 0 : clarityS },
      { label: 'Fluency', score: wordCount === 0 ? 0 : fluencyS },
      { label: 'Structure', score: wordCount === 0 ? 0 : structureS },
      { label: 'Vocabulary', score: wordCount === 0 ? 0 : vocabS },
    ],
    wentWell,
    improve,
    wellQuote,
    improveQuote,
    transcript,
    sttStatus,
  }
}
