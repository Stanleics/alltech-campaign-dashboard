import Image from 'next/image'

export function Logo({ className = '' }: { className?: string }) {
  return (
    <Image
      src="/alltech-logo.png"
      alt="Alltech"
      width={12144}
      height={2065}
      priority
      className={`h-8 w-auto ${className}`}
    />
  )
}
