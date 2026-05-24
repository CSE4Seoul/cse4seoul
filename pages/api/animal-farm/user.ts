import type { NextApiRequest, NextApiResponse } from 'next';

// 동물 데이터 타입 정의
export type Animal = {
  id: string;
  name: string;
  species: string;
  level: number;
  exp: number;
  maxExp: number;
  status: 'happy' | 'hungry' | 'tired' | 'sick';
  imageUrl: string;
};

// 유저 데이터 타입 정의
export type UserGameData = {
  userId: string;
  points: number;
  animals: Animal[];
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  // TODO: 실제 세션에서 유저 정보 가져오기 (supabase 등)
  // 현재는 요구사항에 따라 Mock Data를 리턴합니다.
  
  const mockData: UserGameData = {
    userId: 'user_123',
    points: 1500,
    animals: [
      {
        id: 'animal_1',
        name: '뭉치',
        species: '강아지',
        level: 5,
        exp: 120,
        maxExp: 500,
        status: 'happy',
        imageUrl: '/emotions/e_신나.png', // AI 생성 에셋 가정
      },
      {
        id: 'animal_2',
        name: '냥이',
        species: '고양이',
        level: 3,
        exp: 45,
        maxExp: 300,
        status: 'hungry',
        imageUrl: '/emotions/e_배고파.png',
      }
    ]
  };

  return res.status(200).json(mockData);
}
