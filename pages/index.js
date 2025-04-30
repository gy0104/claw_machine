import dynamic from 'next/dynamic';

const KakaoMap = dynamic(() => import('../components/Map'), { ssr: false });

export default function Home() {
  return (
    <main style={{ padding: '20px', textAlign: 'center' }}>
      <h1>Claw Machine 위치</h1>
      <KakaoMap />
    </main>
  );
}