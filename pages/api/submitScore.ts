import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // 1. POST 요청이 아니면 거부
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  // 2. Canva 앱에서 보낸 정보 (API 키가 없음)
  const { classId, studentCode, points, description } = req.body ?? {};

  // 3. 필수 정보가 비었는지 확인
  if (!classId || !studentCode || typeof points !== 'number') {
    return res.status(400).json({ message: 'Invalid payload' });
  }

  // 4. Vercel에 숨겨둔 비밀 API 키 가져오기 (가장 중요!)
  const API_KEY = process.env.GROUNDCARD_API_KEY;

  if (!API_KEY) {
    return res.status(500).json({ message: 'Server configuration error: API key not found' });
  }

  try {
    // 5. 서버(여기)가 대신 groundcard.com에 안전하게 요청
    const r = await fetch(`https://growndcard.com/api/v1/classes/${classId}/students/${studentCode}/points`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // 여기에만 API 키가 사용됩니다.
        'X-API-Key': API_KEY,
      },
      body: JSON.stringify({ type: 'reward', points, description }),
    });

    const data = await r.json().catch(() => ({}));

    if (!r.ok) {
      // groundcard 서버가 에러를 보낸 경우
      return res.status(r.status).json({ message: data.message || 'Upstream error' });
    }

    // 6. 성공 결과를 Canva 앱에 다시 전달
    return res.status(200).json({ ok: true, data });

  } catch (e) {
    return res.status(502).json({ message: 'Upstream network error' });
  }
}