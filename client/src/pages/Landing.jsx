import { useAuth } from '@/context/AuthContext';
import { Hero } from '@/components/landing/Hero';
import { PollShowcase } from '@/components/landing/PollShowcase';
import { SocialProof } from '@/components/landing/SocialProof';
import { Features } from '@/components/landing/Features';
import { Testimonials } from '@/components/landing/Testimonials';
import { FAQ } from '@/components/landing/FAQ';
import { FinalCTA } from '@/components/landing/FinalCTA';
import { Footer } from '@/components/landing/Footer';
import { useEffect } from 'react';
import { useTheme } from 'next-themes';

export default function Landing() {
  const { isAuthenticated } = useAuth();
  const { setTheme } = useTheme();

  useEffect(() => {
    setTheme('dark');
  }, [setTheme]);

  return (
    <div className="flex flex-col min-h-screen bg-background selection:bg-primary/20">
      <main className="flex-1">
        <Hero isAuthenticated={isAuthenticated} />
        <PollShowcase />
        <SocialProof />
        <Features />
        <Testimonials />
        <FAQ />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  );
}
