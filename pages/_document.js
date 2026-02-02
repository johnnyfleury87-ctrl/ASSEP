// pages/_document.js
// Configuration HTML globale pour Next.js

import { Html, Head, Main, NextScript } from 'next/document'

export default function Document() {
  return (
    <Html lang="fr">
      <Head>
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <meta name="description" content="ASSEP - Association des Seniors et Seniors en Préparation" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}
