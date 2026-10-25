import React from 'react';
import MainNavbar from '@/components/navigation/MainNavbar';
import MobileBottomNav from '@/components/navigation/MobileBottomNav';

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <MainNavbar />
      <main className="flex-1 pb-20 lg:pb-8">
        {children}
      </main>
      <MobileBottomNav />
    </div>
  );
}
