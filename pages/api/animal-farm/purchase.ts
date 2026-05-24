import type { NextApiRequest, NextApiResponse } from 'next';
import { createPagesServerClient } from '@/utils/supabase/pages-server';

type PurchaseRequest = {
  itemId: string;
  price: number;
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

  const { itemId, price }: PurchaseRequest = req.body;

  if (!itemId || price === undefined) {
    return res.status(400).json({ message: 'Missing itemId or price' });
  }

  // 1. Fetch profile for points
  const { data: profile, error: profileError } = await supabase
    .from('animal_farm_profiles')
    .select('points')
    .eq('id', user.id)
    .single();

  if (profileError || !profile) {
    return res.status(500).json({ message: 'Profile not found' });
  }

  if (profile.points < price) {
    return res.status(400).json({ message: '포인트가 부족해요!' });
  }

  // 2. Deduct points
  const { error: updatePointsError } = await supabase
    .from('animal_farm_profiles')
    .update({ points: profile.points - price })
    .eq('id', user.id);

  if (updatePointsError) {
    return res.status(500).json({ message: 'Failed to update points' });
  }

  // 3. Add to inventory
  const { data: existingItem, error: fetchInventoryError } = await supabase
    .from('animal_farm_inventory')
    .select('*')
    .eq('user_id', user.id)
    .eq('item_id', itemId)
    .single();

  if (fetchInventoryError && fetchInventoryError.code !== 'PGRST116') {
    return res.status(500).json({ message: 'Failed to fetch inventory' });
  }

  if (existingItem) {
    const { error: updateInventoryError } = await supabase
      .from('animal_farm_inventory')
      .update({ quantity: existingItem.quantity + 1 })
      .eq('id', existingItem.id);

    if (updateInventoryError) {
      return res.status(500).json({ message: 'Failed to update inventory' });
    }
  } else {
    const { error: insertInventoryError } = await supabase
      .from('animal_farm_inventory')
      .insert({
        user_id: user.id,
        item_id: itemId,
        quantity: 1
      });

    if (insertInventoryError) {
      return res.status(500).json({ message: 'Failed to insert into inventory' });
    }
  }

  return res.status(200).json({
    message: '구매 완료!',
    newPoints: profile.points - price
  });
}
