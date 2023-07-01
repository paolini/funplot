import './globals.css'
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'FunPlot',
  description: 'manu-fatto',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <title>FunPlot</title>
      </head>
      <body className={inter.className}>
      <div className="w-full h-screen flex">
        {children}
      </div>
      </body>
    </html>
  )
}
