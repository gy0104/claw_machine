// scripts/convert-coords.js

import dotenv from 'dotenv';
import path from 'path';
dotenv.config({
  path: path.resolve(process.cwd(), '.env.local'), // 💡 여기가 핵심
});

import fs from 'fs';
import fetch from 'node-fetch';

const KAKAO_REST_API_KEY = process.env.KAKAO_REST_API_KEY;

if (!KAKAO_REST_API_KEY) {
  console.error('❌ KAKAO_REST_API_KEY 환경변수가 설정되지 않았습니다.');
  process.exit(1);
}

const inputFile = path.join(process.cwd(), 'public', 'locations.csv');
const outputFile = path.join(process.cwd(), 'public', 'locations-with-coords.csv');

async function convert() {
  const raw = fs.readFileSync(inputFile, 'utf-8');
  const rows = raw.trim().split('\n').slice(1);

  const results = [];

  for (const [i, row] of rows.entries()) {
    const [store_id, name, ...addressParts] = row.split(',');
    const address = addressParts.join(',').trim();

    try {
      const res = await fetch(
        `https://dapi.kakao.com/v2/local/search/address.json?query=${encodeURIComponent(address)}`,
        {
          headers: {
            Authorization: `KakaoAK ${KAKAO_REST_API_KEY}`,
          },
        }
      );

      if (!res.ok) {
        console.warn(`⚠️ [${res.status}] ${name}: ${address}`);
        results.push(`${store_id},${name},${address},,`);
        continue;
      }

      const data = await res.json();
      const doc = data.documents?.[0];

      if (doc) {
        const lat = doc.y;
        const lng = doc.x;
        results.push(`${store_id},${name},${address},${lat},${lng}`);
        console.log(`✅ [${i + 1}] ${name} → (${lat}, ${lng})`);
      } else {
        results.push(`${store_id},${name},${address},,`);
        console.warn(`❌ 좌표 없음: ${name}`);
      }

      await new Promise((r) => setTimeout(r, 150)); // rate limit 회피

    } catch (err) {
      console.error(`🚨 예외 발생: ${name}`, err);
      results.push(`${store_id},${name},${address},,`);
    }
  }

  const csvText = 'store_id,name,address,lat,lng\n' + results.join('\n');
  fs.writeFileSync(outputFile, csvText, 'utf-8');
  console.log(`\n✅ 저장 완료: ${outputFile}`);
}

convert();