import type { NextApiRequest, NextApiResponse } from 'next';
import { createPagesServerClient } from '@/utils/supabase/pages-server';

type ExploreClaimRequest = {
  regionId: number;
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

  const { regionId }: ExploreClaimRequest = req.body;

  if (regionId === undefined) {
    return res.status(400).json({ message: 'Missing regionId' });
  }

  // Region Reward Table
  let rewardPoints = 0;
  let rewardItemId: string | null = null;
  let message = '';

  switch (regionId) {
    case 1: // Forest
      rewardPoints = 50 + Math.floor(Math.random() * 50);
      if (Math.random() < 0.2) rewardItemId = 'apple';
      message = '숲에서 신선한 열매를 발견했습니다!';
      break;
    case 2: // Cave
      rewardPoints = 200 + Math.floor(Math.random() * 300);
      if (Math.random() < 0.3) rewardItemId = 'potion';
      message = '동굴 깊은 곳에서 반짝이는 수정을 찾았습니다!';
      break;
    case 3: // Blackhole
      rewardPoints = 1000 + Math.floor(Math.random() * 1000);
      const rand = Math.random();
      if (rand < 0.4) rewardItemId = 'vitamin';
      else if (rand < 0.6) rewardItemId = 'hat';
      message = '우주의 신비로운 힘이 깃든 보물을 가져왔습니다!';
      break;
    default:
      return res.status(400).json({ message: 'Invalid regionId' });
  }

  // 1. Update points
  const { data: profile, error: profileError } = await supabase
    .from('animal_farm_profiles')
    .select('points')
    .eq('id', user.id)
    .single();

  if (profileError || !profile) {
    return res.status(500).json({ message: 'Profile not found' });
  }

  const { error: updatePointsError } = await supabase
    .from('animal_farm_profiles')
    .update({ points: profile.points + rewardPoints })
    .eq('id', user.id);

  if (updatePointsError) {
    return res.status(500).json({ message: 'Failed to update points' });
  }

  // 2. Update inventory if item rewarded
  if (rewardItemId) {
    const { data: existingItem, error: fetchInventoryError } = await supabase
      .from('animal_farm_inventory')
      .select('*')
      .eq('user_id', user.id)
      .eq('item_id', rewardItemId)
      .single();

    if (fetchInventoryError && fetchInventoryError.code !== 'PGRST116') {
      return res.status(500).json({ message: 'Failed to fetch inventory' });
    }

    if (existingItem) {
      await supabase
        .from('animal_farm_inventory')
        .update({ quantity: existingItem.quantity + 1 })
        .eq('id', existingItem.id);
    } else {
      await supabase
        .from('animal_farm_inventory')
        .insert({
          user_id: user.id,
          item_id: rewardItemId,
          quantity: 1
        });
    }
  }

  return res.status(200).json({
    message: message,
    rewardPoints: rewardPoints,
    rewardItemId: rewardItemId,
    newPoints: profile.points + rewardPoints
  });
}
