/// <reference lib="webworker" />
/* Voz Piper (português de Portugal) a correr num worker, para não bloquear o ecrã. */
import { TtsSession, download, stored } from '@mintplex-labs/piper-tts-web'

const VOICE_ID = 'pt_PT-tugão-medium'

type Msg =
  | { id: number; type: 'status' }
  | { id: number; type: 'download' }
  | { id: number; type: 'speak'; text: string; gen: number }
  | { id: number; type: 'cancel'; gen: number }

const ctx = self as unknown as DedicatedWorkerGlobalScope
let session: Promise<TtsSession> | null = null

const getSession = () => (session ??= TtsSession.create({ voiceId: VOICE_ID }))

// Pedidos em fila: o modelo só gera uma frase de cada vez
let queue: Promise<void> = Promise.resolve()
let latestGen = 0

ctx.onmessage = (e: MessageEvent<Msg>) => {
  const m = e.data
  if (m.type === 'cancel') {
    latestGen = Math.max(latestGen, m.gen)
    return
  }
  if (m.type === 'speak') latestGen = Math.max(latestGen, m.gen)
  queue = queue.then(() => handle(m))
}

async function handle(m: Msg) {
  try {
    if (m.type === 'status') {
      const list = await stored()
      ctx.postMessage({ id: m.id, type: 'status', ready: list.includes(VOICE_ID) })
    } else if (m.type === 'download') {
      await download(VOICE_ID, (p) => ctx.postMessage({ id: m.id, type: 'progress', url: p.url, loaded: p.loaded, total: p.total }))
      await getSession()
      ctx.postMessage({ id: m.id, type: 'done' })
    } else if (m.type === 'speak') {
      // Leitura cancelada entretanto (mudou de passo): não vale a pena gerar
      if (m.gen < latestGen) return void ctx.postMessage({ id: m.id, type: 'skipped' })
      const s = await getSession()
      const blob = await s.predict(m.text)
      const buf = await blob.arrayBuffer()
      ctx.postMessage({ id: m.id, type: 'audio', buf }, [buf])
    }
  } catch (err) {
    session = null
    ctx.postMessage({ id: m.id, type: 'error', message: err instanceof Error ? err.message : String(err) })
  }
}
