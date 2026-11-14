import type { Metadata } from 'next';
import DevelopersDirectory from '@/components/DevelopersDirectory';

export const metadata: Metadata = {
  title: '개발 구성원 소개 | CSE4Seoul',
  description: 'CSE4Seoul의 개발 구성원을 소개합니다.',
};

export default function DevelopersPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:py-12">
      <DevelopersDirectory />
    </div>
  );
}
