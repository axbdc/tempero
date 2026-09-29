import type { AnnotatedStep } from '../lib/stepAmounts'

/** Texto de um passo com as quantidades destacadas logo a seguir a cada ingrediente. */
export function StepText({ step, size = 'md' }: { step: AnnotatedStep; size?: 'md' | 'lg' }) {
  const badge =
    size === 'lg'
      ? 'ml-1.5 mr-0.5 rounded-lg px-2 py-0.5 text-[0.8em] leading-[1.9]'
      : 'ml-1 mr-px rounded-md px-1.5 py-px text-[0.85em]'
  return (
    <>
      {step.list && step.list.length > 0 && (
        <span
          className={`mb-3 block rounded-2xl bg-herb-50 ring-1 ring-herb-100 ${size === 'lg' ? 'p-4 text-lg' : 'p-3 text-sm'}`}
        >
          <span className="mb-1 block text-xs font-bold uppercase tracking-wider text-herb-600">Vais precisar de</span>
          <span className="flex flex-wrap gap-1.5">
            {step.list.map((x) => (
              <span key={x} className="rounded-full bg-paper px-2.5 py-1 font-semibold text-herb-700 ring-1 ring-line/60">
                {x}
              </span>
            ))}
          </span>
        </span>
      )}
      {step.segments.map((s, i) => (
        <span key={i}>
          {s.text}
          {s.amount && (
            <span
              className={`bg-saffron-50 font-bold text-[#8a5a00] [box-decoration-break:clone] [-webkit-box-decoration-break:clone] ${
                s.amount.length > 18 ? '' : 'whitespace-nowrap'
              } ${badge}`}
            >
              {s.amount}
            </span>
          )}
        </span>
      ))}
    </>
  )
}
