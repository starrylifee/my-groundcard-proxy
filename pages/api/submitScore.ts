import type { NextApiRequest, NextApiResponse } from 'next';

const API_KEY = process.env.GROUNDCARD_API_KEY;
const BASE_URL = 'https://growndcard.com';

/**
 * 모든 응답에 CORS 헤더를 설정하는 헬퍼 함수
 */
const setCorsHeaders = (res: NextApiResponse) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // 1. 모든 응답에 CORS 헤더 우선 적용
  setCorsHeaders(res);

  // 2. 브라우저의 사전 요청(OPTIONS) 처리
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // 3. POST 요청이 아니면 거부
  if (req.method !== 'POST') {
    res.status(405).json({ message: 'Method not allowed' });
    return;
  }

  // 4. Vercel에 API 키가 설정되어 있는지 확인
  if (!API_KEY) {
    res.status(500).json({ message: 'Server configuration error: API key not found' });
    return;
  }
  
  // 5. React 앱에서 보낸 정보 유효성 검사
  const { classId, studentCode, points, description } = req.body ?? {};
  if (!classId || !studentCode || typeof points !== 'number') {
    res.status(400).json({ message: 'Invalid payload from client' });
    return;
  }

  try {
    // 6. Vercel 서버가 groundcard.com에 대신 요청
    const response = await fetch(`${BASE_URL}/api/v1/classes/${classId}/students/${studentCode}/points`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': API_KEY,
      },
      body: JSON.stringify({ type: 'reward', points, description }),
    });

    const data = await response.json().catch(() => ({}));

    // 7. groundcard가 보낸 응답(성공/실패)을 React 앱에 그대로 전달
    //    (이미 CORS 헤더가 설정되어 있으므로 안전)
    res.status(response.status).json(data);

  } catch (e) {
    // 8. 네트워크 자체 오류 처리
    res.status(502).json({ message: 'Upstream network error', error: (e as Error).message });
  }
}