interface Props {
  className?: string
  withWordmark?: boolean
  light?: boolean
}

export function LogoMark({ className = 'h-9 w-9' }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      <rect width="64" height="64" rx="16" fill="#1F5C43" />
      <path d="M31.5 31C27.8 25.6 22.6 23.4 17 24.6c2.4 5 7.8 7.4 14.5 6.4z" fill="#9FD3B0" />
      <path d="M32.5 31C30.4 21.6 34.6 13.4 44.6 10.6c1.6 10.2-3.6 18-12.1 20.4z" fill="#F2B544" />
      <path d="M12 33h40c0 11-9 19-20 19S12 44 12 33z" fill="#FFFFFF" />
    </svg>
  )
}

export function Logo({ className = '', withWordmark = true, light = false }: Props) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <LogoMark />
      {withWordmark && (
        <span
          className={`font-display text-[1.6rem] font-semibold leading-none tracking-tight ${light ? 'text-white' : 'text-herb-900'}`}
        >
          tempero
        </span>
      )}
    </span>
  )
}
