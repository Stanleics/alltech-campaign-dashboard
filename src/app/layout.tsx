import type { Metadata } from 'next'
import { Montserrat } from 'next/font/google'
import { Nav } from '@/components/ui/Nav'
import './globals.css'

const montserrat = Montserrat({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-montserrat',
})

export const metadata: Metadata = {
  title: 'Alltech — Dashboard de Campanhas',
  description: 'Acompanhamento das metas de autoridade da Alltech no LinkedIn (mídia paga e orgânico).',
  icons: { icon: '/favicon.png' },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className={`${montserrat.variable} bg-white font-sans text-[#1D2333] antialiased`}>
        <Nav />
        {children}
      </body>
    </html>
  )
}
