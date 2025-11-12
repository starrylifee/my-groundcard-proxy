import type { NextApiRequest, NextApiResponse } from 'next';

const API_KEY = process.env.GROUNDCARD_API_KEY;
const BASE_URL = 'https://growndcard.com';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // ⭐️ CORS 헤더 추가 (모든 도메인 허용)
  // Vercel이 Canva의 요청을 허용하도록 설정합니다.
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // ⭐️ 브라우저가 본 요청(POST) 전에 보내는 사전 요청(OPTIONS) 처리
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // 1. POST 요청이 아니면 거부
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  // 2. Canva 앱에서 보낸 정보
  const { classId, studentCode, points, description } = req.body ?? {};

  // 3. 필수 정보 확인
  if (!classId || !studentCode || typeof points !== 'number') {
    return res.status(400).json({ message: 'Invalid payload' });
  }

  // 4. Vercel에 숨겨둔 비밀 API 키 확인
  if (!API_KEY) {
    return res.status(500).json({ message: 'Server configuration error: API key not found' });
  }

  try {
    // 5. 서버(여기)가 대신 groundcard.com에 안전하게 요청
    const r = await fetch(`${BASE_URL}/api/v1/classes/${classId}/students/${studentCode}/points`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': API_KEY,
      },
      body: JSON.stringify({ type: 'reward', points, description }),
    });

    const data = await r.json().catch(() => ({}));
    
    if (!r.ok) {
      return res.status(r.status).json({ message: data.message || 'Upstream error' });
    }

    // 6. 성공 결과를 Canva 앱에 다시 전달
    return res.status(200).json(data); // ⭐️ 성공 시 groundcard가 준 데이터를 그대로 반환

  } catch (e) {
    return res.status(502).json({ message: 'Upstream network error' });
  }
}