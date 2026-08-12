import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Esküvői visszajelzés',
  description: 'Esküvői meghívó és visszajelzési rendszer',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="hu">
      <body>{children}</body>
    </html>
  )
}
