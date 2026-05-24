import type { NextApiRequest, NextApiResponse } from 'next';

type ActionRequest = {
  animalId: string;
  actionType: 'train' | 'feed';
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { animalId, actionType }: ActionRequest = req.body;

  if (!animalId || !actionType) {
    return res.status(400).json({ message: 'Missing animalId or actionType' });
  }

  // TODO: 실제 DB 업데이트 로직 (supabase 등)
  // 여기서는 성공 응답과 변경된 데이터의 시뮬레이션을 리턴합니다.

  let rewardExp = 0;
  let costPoints = 0;
  let newStatus = 'happy';

  switch (actionType) {
    case 'train':
      rewardExp = 20;
      costPoints = 0;
      newStatus = 'tired';
      break;
    case 'feed':
      rewardExp = 5;
      costPoints = 50;
      newStatus = 'happy';
      break;
    default:
      return res.status(400).json({ message: 'Invalid action type' });
  }

  // 가상의 성공 응답
  return res.status(200).json({
    message: `${actionType} 액션 성공!`,
    results: {
      addedExp: rewardExp,
      deductedPoints: costPoints,
      newStatus: newStatus,
    }
  });
}
