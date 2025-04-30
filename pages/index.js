import dynamic from 'next/dynamic';

const KakaoMap = dynamic(() => import('../components/Map'), { ssr: false });

export default function Home() {
  return (
    <main style={{ padding: '20px', textAlign: 'center', fontFamily: 'Apple SD Gothic Neo, sans-serif' }}>
      <h1 style={{ fontSize: '22px', fontWeight: 600 }}>
        ♡ 주석이를 위한 Claw Machine 위치 ♡
      </h1>
      <KakaoMap />
    </main>
  );
}