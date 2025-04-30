import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="ko">
      <Head>
        <script
          src="https://apis.openapi.sk.com/tmap/jsv2?version=1&appKey=4d8MGx5fMP8A2VMYKllG17EvPk1rtxN8VHksSkH6"
          type="text/javascript"
        />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}