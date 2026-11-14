import type { Metadata } from 'next';
import { createAdminClient } from '@/lib/supabase/admin';
import PartnerClansDirectory from '@/components/PartnerClansDirectory';

export const metadata: Metadata = {
  title: '협력 클랜 | CSE4Seoul',
  description: 'CSE4Seoul과 함께 활동한 협력 클랜을 소개합니다.',
};

export const dynamic = 'force-dynamic';

export default async function PartnerClansPage() {
  const adminClient = createAdminClient();
  const { data, error } = await adminClient
    .from('partner_clans')
    .select('id, name, royaleapi_url, collaboration_activities')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('협력 클랜 공개 목록 조회 실패:', error);
    throw new Error('협력 클랜 목록을 불러오지 못했습니다.');
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:py-12">
      <PartnerClansDirectory partnerClans={(data || []).map((clan) => ({
        id: clan.id,
        name: clan.name,
        royaleApiUrl: clan.royaleapi_url,
        collaborationActivities: clan.collaboration_activities,
      }))} />
    </div>
  );
}
