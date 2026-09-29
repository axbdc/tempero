import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowRight,
  BellRing,
  Check,
  Flame,
  Lightbulb,
  ListChecks,
  Pause,
  Play,
  Plus,
  RotateCcw,
  Timer,
  X,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Settings2,
} from 'lucide-react'
import { getRecipe, imageUrl } from '../data'
import { formatClock, remainingOf, useTimers } from '../lib/timers'
import { formatStepTime } from './RecipePage'
import { NotFound } from './NotFound'
import { ServingsStepper, useServings } from '../components/ServingsStepper'
import {
  getRate,
  getVoiceName,
  setRate,
  setVoiceName,
  speak,
  stopSpeaking,
  useVoiceCommands,
  useVoices,
  voiceLabel,
} from '../lib/voice'
import { annotateSteps, stepToSpeech } from '../lib/stepAmounts'
import { StepText } from '../components/StepText'

function useWakeLock() {
  useEffect(() => {
    let lock: { release: () => Promise<void> } | null = null
    const nav = navigator as Navigator & { wakeLock?: { request: (t: 'screen') => Promise<{ release: () => Promise<void> }> } }
    const request = async () => {
      try {
        if (nav.wakeLock && document.visibilityState === 'visible') lock = await nav.wakeLock.request('screen')
      } catch {
        /* não suportado */
      }
    }
    void request()
    const onVis = () => void request()
    document.addEventListener('visibilitychange', onVis)
    return () => {
      document.removeEventListener('visibilitychange', onVis)
      void lock?.release().catch(() => {})
    }
  }, [])
}

export function CookMode() {
  const { slug = '' } = useParams()
  const recipe = getRecipe(slug)
  const navigate = useNavigate()
  const sv = useServings(recipe)
  const [idx, setIdx] = useState(-1) // -1 = preparar ingredientes, steps.length = fim
  const [showIngredients, setShowIngredients] = useState(false)
  const [checked, setChecked] = useState<Set<string>>(new Set())
  const { timers, start, pause, reset, addMinute } = useTimers()
  const touchX = useRef<number | null>(null)
  useWakeLock()

  const total = recipe?.steps.length ?? 0
  const go = useCallback((d: number) => setIdx((i) => Math.min(total, Math.max(-1, i + d))), [total])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') go(1)
      if (e.key === 'ArrowLeft') go(-1)
      if (e.key === 'Escape') navigate(`/receita/${slug}`)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [go, navigate, slug])

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [])

  const current = recipe && idx >= 0 && idx < recipe.steps.length ? recipe.steps[idx] : null
  const annotated = useMemo(() => (recipe ? annotateSteps(recipe, sv.factor) : []), [recipe, sv.factor])
  const [readOn, setReadOn] = useState(false)
  const [voiceSheet, setVoiceSheet] = useState(false)
  const voices = useVoices()
  const [voiceName, setVoiceNameState] = useState(getVoiceName)
  const [rate, setRateState] = useState(getRate)

  const annotatedRef = useRef(annotated)
  useEffect(() => {
    annotatedRef.current = annotated
  })

  const readStep = useCallback(() => {
    if (!recipe) return
    if (idx < 0) speak(`${recipe.title}. Antes de começar, junta os ingredientes na bancada.`)
    else if (current) speak(`Passo ${idx + 1}. ${current.title}. ${stepToSpeech(annotatedRef.current[idx])}`)
    else speak('Terminado. Bom apetite!')
  }, [recipe, idx, current])

  // Lê automaticamente sempre que se muda de passo (a primeira leitura é feita no próprio clique)
  const lastRead = useRef<unknown>(null)
  useEffect(() => {
    if (readOn && lastRead.current !== readStep) {
      lastRead.current = readStep
      readStep()
    }
  }, [readOn, readStep])

  useEffect(() => () => stopSpeaking(), [])

  const voice = useVoiceCommands((cmd) => {
    if (cmd === 'next') go(1)
    else if (cmd === 'prev') go(-1)
    else if (cmd === 'repeat') readStep()
    else if (cmd === 'ingredients') setShowIngredients(true)
    else if (cmd === 'timer' && current?.minutes) start(idx, current.minutes)
    else if (cmd === 'pause') pause(idx)
    else if (cmd === 'stop') Object.entries(timers).forEach(([k, t]) => t.done && reset(Number(k)))
  })

  if (!recipe) return <NotFound />

  const voiceOn = voice.state !== 'off'
  const toggleMic = () => (voiceOn ? voice.stop() : voice.start())
  const currentVoice = voices.find((v) => v.name === voiceName) ?? voices[0]

  const step = idx >= 0 && idx < total ? recipe.steps[idx] : null
  const progress = ((idx + 1) / (total + 1)) * 100
  const timer = step ? timers[idx] : undefined
  const otherTimers = Object.entries(timers)
    .map(([k, t]) => ({ step: Number(k), t }))
    .filter(({ step: s, t }) => s !== idx && (t.endAt || t.done))

  const toggleIng = (key: string) =>
    setChecked((s) => {
      const n = new Set(s)
      if (n.has(key)) n.delete(key)
      else n.add(key)
      return n
    })

  const ingredientList = (
    <div className="space-y-5">
      {sv.ingredients.map((g, gi) => (
        <div key={gi}>
          {g.group && <h3 className="mb-1 text-xs font-bold uppercase tracking-wider text-herb-600">{g.group}</h3>}
          <ul className="divide-y divide-line/70">
            {g.items.map((it, ii) => {
              const key = `${gi}-${ii}`
              const on = checked.has(key)
              return (
                <li key={key}>
                  <button onClick={() => toggleIng(key)} className="flex w-full items-start gap-3 py-3 text-left" aria-pressed={on}>
                    <span
                      className={`mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-lg border-2 transition ${
                        on ? 'border-herb-600 bg-herb-600 text-white' : 'border-line bg-paper'
                      }`}
                    >
                      {on && <Check size={15} strokeWidth={3} />}
                    </span>
                    <span className={`text-base leading-snug ${on ? 'text-muted line-through' : ''}`}>
                      {it.qty && <strong>{it.qty} </strong>}
                      {it.item}
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        </div>
      ))}
    </div>
  )

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-cream"
      onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
      onTouchEnd={(e) => {
        if (touchX.current === null) return
        const dx = e.changedTouches[0].clientX - touchX.current
        if (Math.abs(dx) > 70) go(dx < 0 ? 1 : -1)
        touchX.current = null
      }}
    >
      {/* Topo */}
      <header className="shrink-0 border-b border-line/70 bg-paper">
        <div className="mx-auto flex h-16 max-w-4xl items-center gap-3 px-4">
          <Link
            to={`/receita/${recipe.slug}${sv.query}`}
            className="grid h-10 w-10 place-items-center rounded-full hover:bg-herb-50"
            aria-label="Sair do modo cozinhar"
          >
            <X size={21} />
          </Link>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold">{recipe.title}</p>
            <p className="text-xs text-muted">
              {idx < 0 ? 'Preparação' : idx >= total ? 'Concluído' : `Passo ${idx + 1} de ${total}`}
            </p>
          </div>
          {voice.supported && (
            <button
              onClick={toggleMic}
              aria-pressed={voiceOn}
              aria-label={voiceOn ? 'Desligar comandos de voz' : 'Ligar comandos de voz'}
              title="Comandos de voz"
              className={`grid h-10 w-10 place-items-center rounded-full transition ${
                voice.state === 'error' ? 'bg-saffron-50 text-[#8a5a00]' : voiceOn ? 'bg-tomato text-white' : 'hover:bg-herb-50'
              }`}
            >
              {voiceOn && voice.state !== 'error' ? (
                <Mic size={19} className={voice.state === 'listening' ? 'animate-pulse' : ''} />
              ) : (
                <MicOff size={19} />
              )}
            </button>
          )}
          <button
            onClick={() => {
              if (readOn) {
                stopSpeaking()
                lastRead.current = null
              } else {
                // Tem de arrancar dentro do clique: o Safari no iPhone não fala sem um toque do utilizador
                lastRead.current = readStep
                readStep()
              }
              setReadOn(!readOn)
            }}
            aria-pressed={readOn}
            aria-label={readOn ? 'Parar leitura em voz alta' : 'Ler os passos em voz alta'}
            title="Ler em voz alta"
            className={`grid h-10 w-10 place-items-center rounded-full transition ${readOn ? 'bg-herb-700 text-white' : 'hover:bg-herb-50'}`}
          >
            {readOn ? <Volume2 size={19} /> : <VolumeX size={19} />}
          </button>
          {readOn && voices.length > 0 && (
            <button
              onClick={() => setVoiceSheet(true)}
              aria-label="Escolher voz"
              title="Escolher voz"
              className="grid h-10 w-10 place-items-center rounded-full hover:bg-herb-50"
            >
              <Settings2 size={19} />
            </button>
          )}
          <button
            onClick={() => setShowIngredients(true)}
            className="inline-flex h-10 items-center gap-2 rounded-full bg-herb-50 px-4 text-sm font-bold text-herb-700 hover:bg-herb-100"
          >
            <ListChecks size={17} /> <span className="hidden sm:inline">Ingredientes</span>
          </button>
        </div>
        <div className="h-1 bg-line/60">
          <div className="h-full bg-herb-500 transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>
      </header>

      {voiceOn && (
        <div
          className={`shrink-0 border-b border-line/70 px-4 py-2 text-center text-xs font-semibold ${
            voice.state === 'error' ? 'bg-saffron-50 text-[#8a5a00]' : 'bg-herb-50 text-herb-700'
          }`}
          role="status"
        >
          {voice.state === 'error' ? (
            <>
              {voice.error}{' '}
              <button onClick={voice.start} className="ml-1 underline">
                Tentar outra vez
              </button>
            </>
          ) : (
            <>
              {voice.state === 'listening' ? 'A ouvir' : 'A ligar o microfone'}: diz "próximo", "anterior", "repetir", "temporizador",
              "pausa" ou "parar alarme"
              {voice.heard && <span className="mt-0.5 block font-normal italic opacity-80">Ouvi: "{voice.heard}"</span>}
            </>
          )}
        </div>
      )}

      {/* Temporizadores de outros passos */}
      {otherTimers.length > 0 && (
        <div className="no-scrollbar flex shrink-0 gap-2 overflow-x-auto border-b border-line/70 bg-paper px-4 py-2">
          {otherTimers.map(({ step: s, t }) => (
            <button
              key={s}
              onClick={() => setIdx(s)}
              className={`inline-flex shrink-0 items-center gap-2 rounded-full px-3 py-1.5 text-sm font-bold ${
                t.done ? 'animate-pulse bg-tomato text-white' : 'bg-herb-50 text-herb-700'
              }`}
            >
              {t.done ? <BellRing size={15} /> : <Timer size={15} />}
              Passo {s + 1} · {t.done ? 'Pronto!' : formatClock(remainingOf(t))}
            </button>
          ))}
        </div>
      )}

      {/* Conteúdo */}
      <main className="flex-1 overflow-y-auto">
        <div key={idx} className="animate-fade-up mx-auto flex min-h-full max-w-3xl flex-col px-5 py-8 sm:py-12">
          {idx < 0 && (
            <>
              <div className="overflow-hidden rounded-card">
                <img src={imageUrl(recipe.image, 1200, 600)} alt="" className="aspect-[2/1] w-full object-cover" />
              </div>
              <p className="mt-6 text-sm font-bold uppercase tracking-[0.1em] text-herb-600">Antes de começar</p>
              <h1 className="mt-1 font-display text-3xl font-semibold leading-tight text-herb-900 sm:text-4xl">
                Junta tudo na bancada
              </h1>
              <div className="mt-5 flex flex-col gap-3 rounded-card bg-paper p-5 ring-1 ring-line/60 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-bold">Para quantas pessoas?</p>
                  <p className="text-sm text-muted">As quantidades ajustam-se sozinhas.</p>
                </div>
                <ServingsStepper count={sv.count} unit={sv.base.unit} onChange={sv.setCount} size="lg" />
              </div>
              {sv.factor !== 1 && (
                <p className="mt-2 text-xs leading-relaxed text-herb-700">
                  Receita original para {sv.baseLabel}. As quantidades nos passos já estão ajustadas; os tempos mantêm-se.
                </p>
              )}
              <p className="mt-6 text-muted">Marca cada ingrediente à medida que o tiras do armário.</p>
              <div className="mt-6 rounded-card bg-paper p-5 ring-1 ring-line/60">{ingredientList}</div>
            </>
          )}

          {step && (
            <>
              <div className="flex items-center gap-3">
                <span className="grid h-12 w-12 place-items-center rounded-full bg-herb-700 font-display text-xl font-semibold text-white">
                  {idx + 1}
                </span>
                <span className="text-sm font-semibold text-muted">de {total}</span>
              </div>
              <h1 className="mt-5 font-display text-3xl font-semibold leading-tight text-herb-900 sm:text-[2.6rem]">{step.title}</h1>
              <p className="mt-4 text-xl leading-relaxed text-ink sm:text-2xl sm:leading-relaxed">
                <StepText step={annotated[idx]} size="lg" />
              </p>

              {step.heat && (
                <p className="mt-6 inline-flex w-fit items-center gap-2 rounded-full bg-saffron-50 px-4 py-2 text-base font-bold text-[#8a5a00]">
                  <Flame size={18} /> {step.heat}
                </p>
              )}

              {step.minutes && (
                <div
                  className={`mt-6 rounded-[24px] p-6 transition ${
                    timer?.done ? 'bg-tomato text-white' : 'bg-paper ring-1 ring-line/60'
                  }`}
                >
                  <div className="flex flex-wrap items-center gap-5">
                    <div className="flex items-center gap-3">
                      {timer?.done ? <BellRing size={28} className="animate-ring" /> : <Timer size={28} className="text-herb-600" />}
                      <span className="font-display text-5xl font-semibold tabular-nums tracking-tight sm:text-6xl">
                        {timer?.done ? '00:00' : formatClock(timer ? remainingOf(timer) : Math.round(step.minutes * 60))}
                      </span>
                    </div>
                    <div className="ml-auto flex items-center gap-2">
                      {timer?.done ? (
                        <>
                          <button
                            onClick={() => addMinute(idx)}
                            className="inline-flex h-12 items-center gap-1.5 rounded-full bg-white/20 px-4 font-bold"
                          >
                            <Plus size={17} /> 1 min
                          </button>
                          <button
                            onClick={() => reset(idx)}
                            className="inline-flex h-12 items-center gap-2 rounded-full bg-white px-5 font-bold text-tomato"
                          >
                            <Check size={18} /> Parar alarme
                          </button>
                        </>
                      ) : (
                        <>
                          {timer && (
                            <button
                              onClick={() => reset(idx)}
                              className="grid h-12 w-12 place-items-center rounded-full bg-cream text-ink hover:bg-herb-50"
                              aria-label="Repor temporizador"
                            >
                              <RotateCcw size={19} />
                            </button>
                          )}
                          {timer && (
                            <button
                              onClick={() => addMinute(idx)}
                              className="grid h-12 w-12 place-items-center rounded-full bg-cream text-ink hover:bg-herb-50"
                              aria-label="Mais 1 minuto"
                            >
                              <Plus size={19} />
                            </button>
                          )}
                          {timer?.endAt ? (
                            <button
                              onClick={() => pause(idx)}
                              className="inline-flex h-12 items-center gap-2 rounded-full bg-ink px-6 font-bold text-white"
                            >
                              <Pause size={18} className="fill-white" /> Pausa
                            </button>
                          ) : (
                            <button
                              onClick={() => start(idx, step.minutes!)}
                              className="inline-flex h-12 items-center gap-2 rounded-full bg-herb-700 px-6 font-bold text-white hover:bg-herb-600"
                            >
                              <Play size={18} className="fill-white" /> {timer ? 'Continuar' : `Iniciar ${formatStepTime(step.minutes)}`}
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                  {timer && !timer.done && (
                    <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-line/60">
                      <div
                        className="h-full rounded-full bg-herb-500 transition-[width] duration-300"
                        style={{ width: `${(1 - remainingOf(timer) / timer.total) * 100}%` }}
                      />
                    </div>
                  )}
                </div>
              )}

              {step.tip && (
                <p className="mt-6 flex gap-3 rounded-card bg-paper p-5 text-base leading-relaxed ring-1 ring-line/60">
                  <Lightbulb size={20} className="mt-0.5 shrink-0 text-saffron" />
                  {step.tip}
                </p>
              )}
            </>
          )}

          {idx >= total && (
            <div className="my-auto text-center">
              <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-herb-700 text-white">
                <Check size={38} strokeWidth={2.5} />
              </div>
              <h1 className="mt-6 font-display text-4xl font-semibold text-herb-900">Bom apetite!</h1>
              <p className="mt-2 text-muted">{recipe.title} está pronto.</p>
              <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
                <Link to="/" className="rounded-full bg-herb-700 px-6 py-3 font-bold text-white hover:bg-herb-600">
                  Ver mais receitas
                </Link>
                <button onClick={() => setIdx(-1)} className="rounded-full px-6 py-3 font-bold text-herb-700 hover:bg-herb-50">
                  Recomeçar
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Navegação */}
      {idx < total && (
        <footer className="pb-safe shrink-0 border-t border-line/70 bg-paper">
          <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-3">
            <button
              onClick={() => go(-1)}
              disabled={idx < 0}
              className="grid h-14 w-14 place-items-center rounded-full bg-cream text-ink ring-1 ring-line transition hover:bg-herb-50 disabled:opacity-30"
              aria-label="Passo anterior"
            >
              <ArrowLeft size={22} />
            </button>
            <button
              onClick={() => go(1)}
              className="flex h-14 flex-1 items-center justify-center gap-2 rounded-full bg-herb-700 text-base font-bold text-white transition hover:bg-herb-600 active:scale-[0.99]"
            >
              {idx < 0 ? 'Começar' : idx === total - 1 ? 'Terminar' : 'Próximo passo'} <ArrowRight size={20} />
            </button>
          </div>
        </footer>
      )}

      {/* Escolher voz */}
      {voiceSheet && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/40 sm:items-center" onClick={() => setVoiceSheet(false)}>
          <div
            className="animate-fade-up max-h-[85dvh] w-full max-w-lg overflow-y-auto rounded-t-[28px] bg-paper p-6 sm:rounded-[28px]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold">Voz da leitura</h2>
              <button
                onClick={() => setVoiceSheet(false)}
                className="grid h-9 w-9 place-items-center rounded-full hover:bg-herb-50"
                aria-label="Fechar"
              >
                <X size={19} />
              </button>
            </div>
            <p className="mt-1 text-sm text-muted">
              As vozes vêm do teu dispositivo. As marcadas como "natural" soam muito mais humanas.
            </p>
            <ul className="mt-4 space-y-1.5">
              {voices.map((v) => {
                const on = v.name === currentVoice?.name
                return (
                  <li key={v.name}>
                    <button
                      onClick={() => {
                        setVoiceName(v.name)
                        setVoiceNameState(v.name)
                        speak('Olá! Vou ler-te os passos da receita.')
                      }}
                      className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm transition ${
                        on ? 'bg-herb-700 font-bold text-white' : 'bg-cream hover:bg-herb-50'
                      }`}
                    >
                      <Volume2 size={16} className="shrink-0" />
                      <span className="flex-1">{voiceLabel(v)}</span>
                      {on && <Check size={17} />}
                    </button>
                  </li>
                )
              })}
            </ul>
            <p className="mt-5 text-sm font-bold">Ritmo</p>
            <div className="mt-2 flex gap-2">
              {[
                [0.85, 'Mais devagar'],
                [1, 'Normal'],
                [1.12, 'Mais rápido'],
              ].map(([r, label]) => (
                <button
                  key={label}
                  onClick={() => {
                    setRate(r as number)
                    setRateState(r as number)
                    speak('Assim está bom?')
                  }}
                  className={`flex-1 rounded-full px-3 py-2 text-sm font-bold transition ${
                    rate === r ? 'bg-herb-700 text-white' : 'bg-cream hover:bg-herb-50'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <p className="mt-5 text-xs leading-relaxed text-muted">
              Dica: no computador, o Microsoft Edge tem as vozes mais naturais em português de Portugal (Raquel e Duarte). No
              iPhone, em Definições &gt; Acessibilidade &gt; Conteúdo falado &gt; Vozes, podes descarregar a voz "Joana (melhorada)".
            </p>
          </div>
        </div>
      )}

      {/* Folha de ingredientes */}
      {showIngredients && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/40 sm:items-center" onClick={() => setShowIngredients(false)}>
          <div
            className="animate-fade-up max-h-[85dvh] w-full max-w-lg overflow-y-auto rounded-t-[28px] bg-paper p-6 sm:rounded-[28px]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold">Ingredientes</h2>
              <button
                onClick={() => setShowIngredients(false)}
                className="grid h-9 w-9 place-items-center rounded-full hover:bg-herb-50"
                aria-label="Fechar"
              >
                <X size={19} />
              </button>
            </div>
            <div className="mt-2">{ingredientList}</div>
          </div>
        </div>
      )}
    </div>
  )
}
