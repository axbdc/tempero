import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { normalize } from '../data'

export type VoiceCommand = 'next' | 'prev' | 'repeat' | 'timer' | 'pause' | 'stop' | 'ingredients'

/* ------------------------------------------------------------------ */
/* Leitura em voz alta                                                 */
/* ------------------------------------------------------------------ */

const VOICE_KEY = 'tempero:voz'
const RATE_KEY = 'tempero:voz-ritmo'

const synth = () => (typeof window !== 'undefined' ? window.speechSynthesis : undefined)

function read(key: string) {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}
function write(key: string, v: string) {
  try {
    localStorage.setItem(key, v)
  } catch {
    /* sem armazenamento */
  }
}

/** Pontua uma voz: vozes neurais/naturais e português de Portugal primeiro. */
function voiceScore(v: SpeechSynthesisVoice) {
  const lang = v.lang.replace('_', '-').toLowerCase()
  const name = v.name.toLowerCase()
  let s = 0
  if (lang === 'pt-pt') s += 50
  else if (lang === 'pt-br') s += 20
  else if (lang.startsWith('pt')) s += 10
  if (/natural|neural|online/.test(name)) s += 40
  if (/premium|enhanced|melhorad|aperfei/.test(name)) s += 35
  if (/google/.test(name)) s += 25
  if (/joana|catarina|raquel|duarte|fernanda/.test(name)) s += 5
  if (/compact|eloquence|espeak/.test(name)) s -= 30
  return s
}

let voiceCache: SpeechSynthesisVoice[] = []
const voiceListeners = new Set<() => void>()

function refreshVoices() {
  const s = synth()
  if (!s) return
  voiceCache = s
    .getVoices()
    .filter((v) => v.lang.toLowerCase().startsWith('pt'))
    .sort((a, b) => voiceScore(b) - voiceScore(a))
  voiceListeners.forEach((l) => l())
}

if (typeof window !== 'undefined' && window.speechSynthesis) {
  refreshVoices()
  window.speechSynthesis.addEventListener?.('voiceschanged', refreshVoices)
}

/** Vozes em português disponíveis neste dispositivo, da mais natural para a menos natural. */
export function useVoices() {
  return useSyncExternalStore(
    (cb) => {
      voiceListeners.add(cb)
      return () => voiceListeners.delete(cb)
    },
    () => voiceCache,
    () => voiceCache,
  )
}

export function voiceLabel(v: SpeechSynthesisVoice) {
  const lang = v.lang.replace('_', '-').toLowerCase()
  const where = lang === 'pt-pt' ? 'Portugal' : lang === 'pt-br' ? 'Brasil' : v.lang
  const name = v.name
    .replace(/^Microsoft\s+/i, '')
    .replace(/\s*-\s*Portuguese.*$/i, '')
    .replace(/\s*\(Portuguese.*?\)/i, '')
  const natural = voiceScore(v) >= 60 ? ' · natural' : ''
  return `${name} (${where})${natural}`
}

export function getVoiceName() {
  return read(VOICE_KEY) ?? ''
}
export function setVoiceName(name: string) {
  write(VOICE_KEY, name)
}
/** Ritmo da leitura: 1 = normal, 0.85 = mais devagar */
export function getRate() {
  const r = Number(read(RATE_KEY))
  return r > 0.5 && r < 1.5 ? r : 1
}
export function setRate(r: number) {
  write(RATE_KEY, String(r))
}

function pickVoice() {
  if (!voiceCache.length) refreshVoices()
  const wanted = getVoiceName()
  return voiceCache.find((v) => v.name === wanted) ?? voiceCache[0]
}

/** Parte o texto em frases curtas: soa mais natural e evita o corte do Chrome em textos longos. */
function chunks(text: string) {
  const parts = text
    .replace(/\s+/g, ' ')
    .split(/(?<=[.!?:;])\s+/)
    .map((p) => p.trim())
    .filter(Boolean)
  const out: string[] = []
  for (const p of parts) {
    if (p.length <= 180) out.push(p)
    else out.push(...p.split(/(?<=,)\s+/))
  }
  return out
}

let speaking = false
let spokeUntil = 0
let speakToken = 0
let keepAlive: ReturnType<typeof setInterval> | undefined

export const isSpeaking = () => speaking
/** Ainda a falar ou acabou há muito pouco (o microfone pode apanhar o fim da frase). */
const recentlySpoke = () => speaking || Date.now() - spokeUntil < 800

export function speak(text: string, onDone?: () => void) {
  const s = synth()
  if (!s) return
  try {
    s.cancel()
    const token = ++speakToken
    const voice = pickVoice()
    const natural = voice ? voiceScore(voice) >= 60 : false
    // Vozes "robóticas" soam melhor um pouco mais lentas; as naturais ficam no ritmo delas
    const rate = getRate() * (natural ? 1 : 0.93)
    const list = chunks(text)
    speaking = true
    list.forEach((part, i) => {
      const u = new SpeechSynthesisUtterance(part)
      u.lang = voice?.lang ?? 'pt-PT'
      if (voice) u.voice = voice
      u.rate = rate
      u.pitch = 1
      if (i === list.length - 1) {
        u.onend = () => {
          if (token !== speakToken) return
          speaking = false
          spokeUntil = Date.now()
          clearInterval(keepAlive)
          onDone?.()
        }
      }
      u.onerror = () => {
        if (token !== speakToken) return
        speaking = false
        clearInterval(keepAlive)
      }
      s.speak(u)
    })
    // O Chrome em desktop pára a leitura ao fim de ~15 s se não for "acordado"
    clearInterval(keepAlive)
    keepAlive = setInterval(() => {
      if (!s.speaking) return clearInterval(keepAlive)
      s.pause()
      s.resume()
    }, 10000)
  } catch {
    speaking = false
  }
}

export function stopSpeaking() {
  speakToken++
  speaking = false
  clearInterval(keepAlive)
  try {
    synth()?.cancel()
  } catch {
    /* ignorar */
  }
}

/* ------------------------------------------------------------------ */
/* Comandos de voz                                                     */
/* ------------------------------------------------------------------ */

interface ResultList {
  length: number
  [i: number]: { isFinal: boolean; 0: { transcript: string } }
}

interface RecognitionLike {
  lang: string
  continuous: boolean
  interimResults: boolean
  maxAlternatives: number
  start: () => void
  stop: () => void
  abort: () => void
  onstart: (() => void) | null
  onresult: ((e: { resultIndex: number; results: ResultList }) => void) | null
  onend: (() => void) | null
  onerror: ((e: { error: string }) => void) | null
}

type RecognitionCtor = new () => RecognitionLike

function getCtor(): RecognitionCtor | undefined {
  if (typeof window === 'undefined') return undefined
  const w = window as unknown as { SpeechRecognition?: RecognitionCtor; webkitSpeechRecognition?: RecognitionCtor }
  return w.SpeechRecognition ?? w.webkitSpeechRecognition
}

// Ordem importa: "parar alarme" tem de ganhar a "parar"
const RULES: [VoiceCommand, string[]][] = [
  ['stop', ['alarme', 'desliga', 'desligar', 'desliga o alarme']],
  ['next', ['proximo', 'proxima', 'seguinte', 'avanca', 'avancar', 'continua', 'continuar', 'passa', 'next']],
  ['prev', ['anterior', 'volta', 'voltar', 'atras', 'recua', 'recuar']],
  ['repeat', ['repete', 'repetir', 'outra vez', 'ler', 'le', 'lê']],
  ['timer', ['temporizador', 'cronometro', 'relogio', 'inicia', 'iniciar', 'comeca', 'comecar']],
  ['pause', ['pausa', 'pausar', 'parar', 'para']],
  ['ingredients', ['ingrediente', 'ingredientes']],
]

export function parseCommand(text: string): VoiceCommand | null {
  const t = ' ' + normalize(text).replace(/[^a-z0-9]+/g, ' ').trim() + ' '
  // Só frases curtas: evita reagir a conversa ou à própria leitura em voz alta
  if (t.trim().split(' ').length > 4) return null
  for (const [cmd, words] of RULES) if (words.some((w) => t.includes(' ' + normalize(w) + ' '))) return cmd
  return null
}

export type ListenState = 'off' | 'starting' | 'listening' | 'error'

const ERRORS: Record<string, string> = {
  'not-allowed': 'O acesso ao microfone foi bloqueado. Toca no cadeado ao lado do endereço e permite o microfone.',
  'service-not-allowed': 'Este browser não deixa usar o reconhecimento de voz. Experimenta no Chrome ou no Edge.',
  'audio-capture': 'Não encontrei nenhum microfone ligado.',
  network: 'O reconhecimento de voz precisa de internet e este browser não o suporta (Brave e alguns outros bloqueiam-no). Usa o Chrome, o Edge ou o Safari.',
  'language-not-supported': 'Este browser não reconhece português.',
}

export function recognitionSupported() {
  return !!getCtor()
}

/**
 * Comandos de voz. `start()` tem de ser chamado diretamente no clique do botão:
 * os browsers só pedem o microfone quando é o utilizador a iniciar.
 */
export function useVoiceCommands(onCommand: (c: VoiceCommand) => void) {
  const handler = useRef(onCommand)
  const recRef = useRef<RecognitionLike | null>(null)
  const activeRef = useRef(false)
  const failsRef = useRef(0)
  const [state, setState] = useState<ListenState>('off')
  const [error, setError] = useState('')
  const [heard, setHeard] = useState('')
  const supported = recognitionSupported()

  useEffect(() => {
    handler.current = onCommand
  })

  const stop = useCallback(() => {
    activeRef.current = false
    const rec = recRef.current
    recRef.current = null
    if (rec) {
      rec.onend = null
      rec.onerror = null
      rec.onresult = null
      try {
        rec.abort()
      } catch {
        /* ignorar */
      }
    }
    setState('off')
    setHeard('')
  }, [])

  const start = useCallback(() => {
    const Ctor = getCtor()
    if (!Ctor) {
      setError('Este browser não tem reconhecimento de voz. Usa o Chrome, o Edge ou o Safari.')
      setState('error')
      return
    }
    stop()
    setError('')
    activeRef.current = true
    failsRef.current = 0

    const rec = new Ctor()
    recRef.current = rec
    rec.lang = 'pt-PT'
    rec.continuous = true
    rec.interimResults = true
    rec.maxAlternatives = 1

    rec.onstart = () => {
      failsRef.current = 0
      setState('listening')
    }
    rec.onresult = (e) => {
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i]
        const said = r[0].transcript.trim()
        if (said) setHeard(said)
        if (!r.isFinal) continue
        // Enquanto a app está a ler, só aceita comandos de 1-2 palavras (para não se ouvir a si própria)
        if (recentlySpoke() && said.split(/\s+/).length > 2) continue
        const cmd = parseCommand(said)
        if (cmd) {
          if (isSpeaking() && cmd !== 'repeat') stopSpeaking()
          handler.current(cmd)
        }
      }
    }
    rec.onerror = (e) => {
      if (e.error === 'no-speech' || e.error === 'aborted') return
      failsRef.current++
      const msg = ERRORS[e.error]
      if (msg) {
        activeRef.current = false
        setError(msg)
        setState('error')
      }
    }
    rec.onend = () => {
      if (!activeRef.current || recRef.current !== rec) return
      if (failsRef.current > 3) {
        activeRef.current = false
        setError('O microfone parou várias vezes seguidas. Toca no microfone para tentar outra vez.')
        setState('error')
        return
      }
      setState('starting')
      // O Chrome termina a escuta sozinho de vez em quando: volta a ligar
      setTimeout(() => {
        if (!activeRef.current || recRef.current !== rec) return
        try {
          rec.start()
        } catch {
          failsRef.current++
        }
      }, 250)
    }

    setState('starting')
    try {
      rec.start()
    } catch {
      setError('Não consegui ligar o microfone. Tenta outra vez.')
      setState('error')
      activeRef.current = false
    }
  }, [stop])

  useEffect(() => stop, [stop])

  return { supported, state, error, heard, start, stop }
}
