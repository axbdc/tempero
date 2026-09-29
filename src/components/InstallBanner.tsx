import { Smartphone } from 'lucide-react'
import { useInstall } from '../lib/pwa'

export function InstallBanner() {
  const { canPrompt, standalone, ios, install } = useInstall()
  if (standalone || (!canPrompt && !ios)) return null
  return (
    <div className="mt-3 flex items-center gap-4 rounded-card bg-herb-700 p-4 text-white">
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-white/10">
        <Smartphone size={21} className="text-saffron" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-bold">Instala a Tempero no telemóvel</p>
        <p className="text-sm text-white/75">
          {ios
            ? 'No Safari, toca em Partilhar e depois em "Adicionar ao ecrã principal".'
            : 'Abre como uma app e as receitas que já viste funcionam sem internet.'}
        </p>
      </div>
      {canPrompt && (
        <button
          onClick={install}
          className="shrink-0 rounded-full bg-white px-4 py-2 text-sm font-bold text-[#123a2a] transition hover:scale-105 active:scale-95"
        >
          Instalar
        </button>
      )}
    </div>
  )
}
