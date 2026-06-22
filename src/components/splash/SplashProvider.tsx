'use client';

import dynamic from 'next/dynamic';

const AnimatedSplash = dynamic(() => import('./AnimatedSplash'), { ssr: false });

export default function SplashProvider({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AnimatedSplash />
      {children}
    </>
  );
}