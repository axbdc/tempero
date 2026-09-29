import { useEffect, useRef, useState } from 'react'
import { normalize } from '../data'

export type VoiceCommand = 'next' | 'prev' | 'repeat' | 'timer' | 'pause' | 'stop' | 'ingredients'

interface ResultList {
  length: number
  [i: number]: { isFinal: boolean; 0: { transcript: string } }
}

interface RecognitionLike {
  lang: string
  continuous: boolean
  interimResults: boolean
  start: () => void
  stop: () => void
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

export function speak(text: string) {
  try {
    const s = window.speechSynthesis
    if (!s) return
    s.cancel()
    const u = new SpeechSynthesisUtterance(text)
    u.lang = 'pt-PT'
    const voices = s.getVoices()
    const v = voices.find((x) => x.lang === 'pt-PT') ?? voices.find((x) => x.lang.startsWith('pt'))
    if (v) u.voice = v
    s.speak(u)
  } catch {
    /* sem síntese de voz */
  }
}

export function stopSpeaking() {
  try {
    window.speechSynthesis?.cancel()
  } catch {
    /* ignorar */
  }
}

// Ordem importa: "parar alarme" tem de ganhar a "parar"
const RULES: [VoiceCommand, string[]][] = [
  ['stop', ['alarme', 'desliga', 'desligar']],
  ['next', ['proximo', 'proxima', 'seguinte', 'avanca', 'avancar', 'continua', 'continuar']],
  ['prev', ['anterior', 'volta', 'voltar', 'atras', 'recua']],
  ['repeat', ['repete', 'repetir', 'outra vez', 'ler', 'le']],
  ['timer', ['temporizador', 'cronometro', 'inicia', 'iniciar', 'comeca', 'comecar']],
  ['pause', ['pausa', 'pausar', 'parar', 'para']],
  ['ingredients', ['ingrediente', 'ingredientes']],
]

export function parseCommand(text: string): VoiceCommand | null {
  const t = ' ' + normalize(text).replace(/[^a-z0-9]+/g, ' ').trim() + ' '
  // Só frases curtas: evita reagir a conversa ou à própria leitura em voz alta
  if (t.trim().split(' ').length > 4) return null
  for (const [cmd, words] of RULES) if (words.some((w) => t.includes(' ' + w + ' '))) return cmd
  return null
}

export function useVoiceCommands(enabled: boolean, onCommand: (c: VoiceCommand) => void) {
  const handler = useRef(onCommand)
  const [listening, setListening] = useState(false)
  const supported = !!getCtor()

  useEffect(() => {
    handler.current = onCommand
  })

  useEffect(() => {
    const Ctor = getCtor()
    if (!enabled || !Ctor) return
    let active = true
    const rec = new Ctor()
    rec.lang = 'pt-PT'
    rec.continuous = true
    rec.interimResults = false
    rec.onresult = (e) => {
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i]
        if (!r.isFinal) continue
        const cmd = parseCommand(r[0].transcript)
        if (cmd) handler.current(cmd)
      }
    }
    rec.onend = () => {
      setListening(false)
      if (!active) return
      try {
        rec.start()
        setListening(true)
      } catch {
        /* já a ouvir */
      }
    }
    rec.onerror = (e) => {
      if (e.error === 'not-allowed' || e.error === 'service-not-allowed') active = false
    }
    try {
      rec.start()
      setListening(true)
    } catch {
      /* ignorar */
    }
    return () => {
      active = false
      rec.onend = null
      try {
        rec.stop()
      } catch {
        /* ignorar */
      }
      setListening(false)
    }
  }, [enabled])

  return { supported, listening }
}
