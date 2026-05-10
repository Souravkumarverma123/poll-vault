import { useAuth } from '@/context/AuthContext';
import { Hero } from '@/components/landing/Hero';
import { SocialProof } from '@/components/landing/SocialProof';
import { MediaSection } from '@/components/landing/MediaSection';
import { Features } from '@/components/landing/Features';
import { Testimonials } from '@/components/landing/Testimonials';
import { FAQ } from '@/components/landing/FAQ';
import { FinalCTA } from '@/components/landing/FinalCTA';
import { Footer } from '@/components/landing/Footer';

export default function Landing() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="flex flex-col min-h-screen bg-background selection:bg-primary/20">
      <main className="flex-1">
        <Hero isAuthenticated={isAuthenticated} />
        <SocialProof />
        <MediaSection />
        <Features />
        <Testimonials />
        <FAQ />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  );
}
