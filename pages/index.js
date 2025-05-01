import dynamic from 'next/dynamic';
import Head from 'next/head';

const KakaoMap = dynamic(() => import('../components/Map'), { ssr: false });

export default function Home() {
  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Claw Machine</title>
      </Head>

      <main
        style={{
          padding: 0,
          margin: 0,
          width: '100vw',
          height: '100vh',
          overflow: 'hidden',
          fontFamily: 'Apple SD Gothic Neo, sans-serif',
        }}
      >
        <KakaoMap />
      </main>
    </>
  );
}