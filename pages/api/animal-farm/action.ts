import type { NextApiRequest, NextApiResponse } from 'next';
import { createPagesServerClient } from '@/utils/supabase/pages-server';

type ActionRequest = {
  animalId: string;
  actionType: 'train' | 'feed' | 'pet';
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const supabase = createPagesServerClient(req, res);
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const { animalId, actionType }: ActionRequest = req.body;

  if (!animalId || !actionType) {
    return res.status(400).json({ message: 'Missing animalId or actionType' });
  }

  // 1. Fetch current animal state
  const { data: animal, error: animalError } = await supabase
    .from('animals')
    .select('*')
    .eq('id', animalId)
    .eq('owner_id', user.id)
    .single();

  if (animalError || !animal) {
    return res.status(404).json({ message: 'Animal not found' });
  }

  // 2. Fetch profile for points
  const { data: profile, error: profileError } = await supabase
    .from('animal_farm_profiles')
    .select('points')
    .eq('id', user.id)
    .single();

  if (profileError || !profile) {
    return res.status(500).json({ message: 'Profile not found' });
  }

  let rewardExp = 0;
  let costPoints = 0;
  let addedHunger = 0;
  let newStatus = 'IDLE';

  switch (actionType) {
    case 'train':
      if (animal.hunger < 20) {
        return res.status(400).json({ message: '너무 배고파서 훈련할 수 없어요! (Hunger < 20%)' });
      }
      rewardExp = 20 + Math.floor(Math.random() * 10);
      addedHunger = -15;
      newStatus = 'TRAINING';
      break;
    case 'feed':
      costPoints = 50;
      if (profile.points < costPoints) {
        return res.status(400).json({ message: '포인트가 부족해요!' });
      }
      rewardExp = 5;
      addedHunger = 20;
      newStatus = 'EATING';
      break;
    case 'pet':
      rewardExp = 2;
      newStatus = 'IDLE';
      break;
    default:
      return res.status(400).json({ message: 'Invalid action type' });
  }

  // 3. Update DB
  const newExp = animal.exp + rewardExp;
  const newHunger = Math.max(0, Math.min(100, animal.hunger + addedHunger));
  let newLevel = animal.level;
  let finalExp = newExp;

  // Level up logic (every 500 exp)
  if (newExp >= 500) {
    newLevel += 1;
    finalExp = newExp - 500;
  }

  const { error: updateAnimalError } = await supabase
    .from('animals')
    .update({
      exp: finalExp,
      level: newLevel,
      hunger: newHunger,
      updated_at: new Date().toISOString()
    })
    .eq('id', animalId);

  if (updateAnimalError) {
    return res.status(500).json({ message: 'Failed to update animal' });
  }

  if (costPoints > 0) {
    const { error: updateProfileError } = await supabase
      .from('animal_farm_profiles')
      .update({
        points: profile.points - costPoints,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id);

    if (updateProfileError) {
      return res.status(500).json({ message: 'Failed to update points' });
    }
  }

  return res.status(200).json({
    message: `${actionType} 액션 성공!`,
    results: {
      addedExp: rewardExp,
      newExp: finalExp,
      newLevel: newLevel,
      newHunger: newHunger,
      deductedPoints: costPoints,
      newPoints: profile.points - costPoints,
      newStatus: newStatus,
    }
  });
}
