import type { NextApiRequest, NextApiResponse } from 'next';
import { createPagesServerClient } from '@/utils/supabase/pages-server';

// 동물 데이터 타입 정의
export type Animal = {
  id: string;
  name: string;
  species: string;
  level: number;
  exp: number;
  hunger: number;
  status: string;
  imageUrl: string;
};

// 유저 데이터 타입 정의
export type UserGameData = {
  userId: string;
  points: number;
  animals: Animal[];
};

const speciesToImage: Record<string, string> = {
  cat: '/assets/animal-farm/animals/cat.png',
  dog: '/assets/animal-farm/animals/dog.png',
  pig: '/assets/animal-farm/animals/pig.png',
  chick: '/assets/animal-farm/animals/chick.png',
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const supabase = createPagesServerClient(req, res);
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  // 1. Fetch points from animal_farm_profiles
  const { data: profileData, error: profileError } = await supabase
    .from('animal_farm_profiles')
    .select('points')
    .eq('id', user.id)
    .single();

  if (profileError && profileError.code !== 'PGRST116') {
    console.error('Profile fetch error:', profileError);
    return res.status(500).json({ message: 'Failed to fetch profile' });
  }

  // 2. Fetch animals
  const { data: animalsData, error: animalsError } = await supabase
    .from('animals')
    .select('*')
    .eq('owner_id', user.id);

  if (animalsError) {
    console.error('Animals fetch error:', animalsError);
    return res.status(500).json({ message: 'Failed to fetch animals' });
  }

  const animals: Animal[] = (animalsData || []).map(a => ({
    id: a.id,
    name: a.name,
    species: a.species,
    level: a.level,
    exp: a.exp,
    hunger: a.hunger,
    status: a.status,
    imageUrl: speciesToImage[a.species] || '/assets/animal-farm/animals/chick.png',
  }));

  const gameData: UserGameData = {
    userId: user.id,
    points: profileData?.points ?? 0,
    animals: animals,
  };

  return res.status(200).json(gameData);
}
