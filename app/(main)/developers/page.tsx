import type { Metadata } from 'next';
import DevelopersDirectory, { type DeveloperProfile } from '@/components/DevelopersDirectory';
import { createClient } from '@/utils/supabase/server';

export const metadata: Metadata = {
  title: '개발 구성원 소개 | CSE4Seoul',
  description: 'CSE4Seoul의 개발 구성원을 소개합니다.',
};

const developers: DeveloperProfile[] = [
  {
    id: 'johamin',
    name: '조하민',
    email: 'johamin3624@konkuk.ac.kr',
    portfolioUrl: 'https://hamin-portfolio.vercel.app/',
    royaleApiUrl: 'https://royaleapi.com/player/8YUPJQC29',
    isLead: true,
  },
  {
    id: 'peval',
    name: 'Peval',
    royaleApiUrl: 'https://royaleapi.com/player/RQVPY0GGV',
    youtubeUrl: 'https://youtube.com/channel/UC-kiTHAKYch0YTpvOLTOCWg?si=QSLk6Frh_zgLPyVg',
    role: {
      ko: '구성원 && 유튜버',
      en: 'Member && YouTuber',
    },
  },
];

export default async function DevelopersPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const visibleDevelopers = user
    ? developers
    : developers.map(({ id, name, royaleApiUrl, youtubeUrl, photoUrl, isLead, role }) => ({
      id,
      name,
      royaleApiUrl,
      youtubeUrl,
      photoUrl,
      isLead,
      role,
    }));

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:py-12">
      <DevelopersDirectory developers={visibleDevelopers} />
    </div>
  );
}
