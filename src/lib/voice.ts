import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { normalize } from '../data'

export type VoiceCommand = 'next' | 'prev' | 'repeat' | 'timer' | 'pause' | 'stop' | 'ingredients'

/* ------------------------------------------------------------------ */
/* Leitura em voz alta: voz Piper (pt-PT) gerada no próprio dispositivo */
/* ------------------------------------------------------------------ */

export type VoiceModelState = 'checking' | 'missing' | 'downloading' | 'ready' | 'error'

interface VoiceStore {
  model: VoiceModelState
  progress: number // 0-1 durante a transferência
  error: string
  busy: 'idle' | 'preparing' | 'playing'
}

let store: VoiceStore = { model: 'checking', progress: 0, error: '', busy: 'idle' }
const listeners = new Set<() => void>()
const setStore = (patch: Partial<VoiceStore>) => {
  store = { ...store, ...patch }
  listeners.forEach((l) => l())
}

/** Estado da voz (transferência, erros, se está a falar). */
export function useVoiceModel() {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb)
      return () => listeners.delete(cb)
    },
    () => store,
    () => store,
  )
}

type Reply =
  | { id: number; type: 'status'; ready: boolean }
  | { id: number; type: 'progress'; url: string; loaded: number; total: number }
  | { id: number; type: 'done' }
  | { id: number; type: 'audio'; buf: ArrayBuffer }
  | { id: number; type: 'skipped' }
  | { id: number; type: 'error'; message: string }

let worker: Worker | null = null
let nextId = 1
const pending = new Map<number, { resolve: (r: Reply) => void; onProgress?: (r: Reply) => void }>()

function getWorker() {
  if (!worker) {
    worker = new Worker(new URL('./piper.worker.ts', import.meta.url), { type: 'module' })
    worker.onmessage = (e: MessageEvent<Reply>) => {
      const r = e.data
      const p = pending.get(r.id)
      if (!p) return
      if (r.type === 'progress') return p.onProgress?.(r)
      pending.delete(r.id)
      p.resolve(r)
    }
    worker.onerror = () => {
      pending.forEach((p, id) => p.resolve({ id, type: 'error', message: 'worker' }))
      pending.clear()
      worker = null
    }
  }
  return worker
}

function call(msg: Record<string, unknown>, onProgress?: (r: Reply) => void) {
  const id = nextId++
  return new Promise<Reply>((resolve) => {
    pending.set(id, { resolve, onProgress })
    getWorker().postMessage({ ...msg, id })
  })
}

export const voiceSupported = () =>
  typeof window !== 'undefined' && typeof Worker !== 'undefined' && typeof WebAssembly !== 'undefined' && !!window.AudioContext

let checked = false
/** Vê se a voz já foi descarregada neste dispositivo. */
export function checkVoice() {
  if (checked) return
  checked = true
  if (!voiceSupported()) return setStore({ model: 'error', error: 'Este browser não consegue gerar a voz. Atualiza-o ou usa o Chrome, o Edge ou o Safari.' })
  void call({ type: 'status' }).then((r) => {
    if (r.type === 'status') setStore({ model: r.ready ? 'ready' : 'missing' })
    else setStore({ model: 'missing' })
  })
}

/** Descarrega a voz (cerca de 60 MB, só da primeira vez). */
export async function downloadVoice() {
  if (store.model === 'downloading') return false
  setStore({ model: 'downloading', progress: 0, error: '' })
  const files = new Map<string, { loaded: number; total: number }>()
  const r = await call({ type: 'download' }, (p) => {
    if (p.type !== 'progress' || !p.total) return
    files.set(p.url, { loaded: p.loaded, total: p.total })
    let loaded = 0
    let total = 0
    files.forEach((f) => {
      loaded += f.loaded
      total += f.total
    })
    // O modelo é o ficheiro grande; antes de ele começar, o total ainda é pequeno
    const big = [...files.values()].some((f) => f.total > 1e6)
    setStore({ progress: big ? loaded / total : 0 })
  })
  if (r.type === 'done') {
    setStore({ model: 'ready', progress: 1 })
    return true
  }
  setStore({
    model: 'error',
    error: 'Não consegui descarregar a voz. Verifica a internet e tenta outra vez.',
  })
  return false
}

/* Áudio: um AudioContext desbloqueado num toque serve para o resto da sessão (iPhone incluído) */
let audio: AudioContext | null = null
let current: AudioBufferSourceNode | null = null

/** Chamar dentro de um clique antes da primeira leitura. */
export function unlockAudio() {
  try {
    audio ??= new AudioContext()
    if (audio.state === 'suspended') void audio.resume()
    const b = audio.createBuffer(1, 1, 22050)
    const s = audio.createBufferSource()
    s.buffer = b
    s.connect(audio.destination)
    s.start(0)
  } catch {
    /* sem áudio */
  }
}

function play(buf: ArrayBuffer) {
  return new Promise<void>((resolve) => {
    if (!audio) return resolve()
    audio
      .decodeAudioData(buf)
      .then((decoded) => {
        const src = audio!.createBufferSource()
        src.buffer = decoded
        src.connect(audio!.destination)
        src.onended = () => {
          if (current === src) current = null
          resolve()
        }
        current = src
        src.start()
      })
      .catch(() => resolve())
  })
}

/** Parte o texto em frases: a primeira começa a tocar enquanto a seguinte é gerada. */
function chunks(text: string) {
  const parts = text
    .replace(/\s+/g, ' ')
    .split(/(?<=[.!?:;])\s+/)
    .map((p) => p.trim())
    .filter(Boolean)
  const out: string[] = []
  for (const p of parts) {
    if (p.length <= 160) out.push(p)
    else out.push(...p.split(/(?<=,)\s+/))
  }
  return out
}

let speaking = false
let spokeUntil = 0
let speakToken = 0

export const isSpeaking = () => speaking
/** Ainda a falar ou acabou há muito pouco (o microfone pode apanhar o fim da frase). */
const recentlySpoke = () => speaking || Date.now() - spokeUntil < 800

/** Lê o texto com a voz Piper. Devolve false se a voz ainda não estiver descarregada. */
export function speak(text: string, onDone?: () => void) {
  stopSpeaking()
  if (store.model !== 'ready') return false
  unlockAudio()
  const token = ++speakToken
  const parts = chunks(text)
  if (!parts.length) return true
  speaking = true
  setStore({ busy: 'preparing' })

  const synth = (t: string) => call({ type: 'speak', text: t, gen: token })

  void (async () => {
    let next = synth(parts[0])
    for (let i = 0; i < parts.length; i++) {
      const r = await next
      if (token !== speakToken) return
      if (i + 1 < parts.length) next = synth(parts[i + 1])
      if (r.type === 'error') {
        setStore({ error: 'A voz falhou a gerar esta frase.' })
        continue
      }
      if (r.type !== 'audio') continue
      setStore({ busy: 'playing' })
      await play(r.buf)
      if (token !== speakToken) return
    }
    speaking = false
    spokeUntil = Date.now()
    setStore({ busy: 'idle' })
    onDone?.()
  })()
  return true
}

export function stopSpeaking() {
  const was = speaking
  speakToken++
  speaking = false
  if (was) spokeUntil = Date.now()
  if (worker) worker.postMessage({ type: 'cancel', gen: speakToken, id: 0 })
  try {
    current?.stop()
  } catch {
    /* já tinha parado */
  }
  current = null
  if (store.busy !== 'idle') setStore({ busy: 'idle' })
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
