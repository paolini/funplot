import './globals.css'
import { Inter } from 'next/font/google'
import { BANNER } from '@/app/info'

const env = process.env.NODE_ENV
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
        <script dangerouslySetInnerHTML={{
            __html: `/*



${BANNER}



*/` + (env == "development" 
? `// tracker code not included in development 
  `
: `// matomo tracking code
var _paq = window._paq = window._paq || [];
/* tracker methods like "setCustomDimension" should be called before "trackPageView" */
_paq.push(['trackPageView']);
_paq.push(['enableLinkTracking']);
(function() {
  var u="//matomo.matb.it/";
  _paq.push(['setTrackerUrl', u+'matomo.php']);
  _paq.push(['setSiteId', '6']);
  var d=document, g=d.createElement('script'), s=d.getElementsByTagName('script')[0];
  g.async=true; g.src=u+'matomo.js'; s.parentNode.insertBefore(g,s);
})();`)
          }} />
        <title>FunPlot</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </head>
      <body className={inter.className}>
      <div>
        {children}
      </div>
      </body>
    </html>
  )
}
