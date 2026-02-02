// pages/_app.js
// Configuration globale Next.js

import '../styles/globals.css'
import { Analytics } from '@vercel/analytics/react'

function MyApp({ Component, pageProps }) {
  return (
    <>
      <Component {...pageProps} />
      <Analytics />
    </>
  )
}

export default MyApp
