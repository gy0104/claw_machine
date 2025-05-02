// pages/api/kakao-address.js

export default async function handler(req, res) {
    const { query } = req.query;
  
    if (!query) {
      return res.status(400).json({ error: 'Missing query parameter' });
    }
  
    try {
      const kakaoRes = await fetch(`https://dapi.kakao.com/v2/local/search/address.json?query=${encodeURIComponent(query)}`, {
        headers: {
          Authorization: `KakaoAK ${process.env.KAKAO_REST_API_KEY}`
        }
      });
  
      const data = await kakaoRes.json();
      res.status(200).json(data);
    } catch (error) {
      console.error('Kakao API 호출 실패:', error);
      res.status(500).json({ error: 'Kakao API 호출 중 오류 발생' });
    }
  }