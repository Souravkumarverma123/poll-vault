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
import { motion } from 'framer-motion';

function FadeIn({ children, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.7, ease: [0.21, 0.47, 0.32, 0.98], delay }}
    >
      {children}
    </motion.div>
  );
}

export default function Landing() {
  const { isAuthenticated } = useAuth();
  const { setTheme } = useTheme();

  useEffect(() => {
    setTheme('dark');
  }, [setTheme]);

  return (
    <div className="flex flex-col min-h-screen bg-background selection:bg-primary/20">
      <main className="flex-1 overflow-hidden">
        <Hero isAuthenticated={isAuthenticated} />
        <FadeIn delay={0.2}><PollShowcase /></FadeIn>
        <FadeIn><SocialProof /></FadeIn>
        <FadeIn><Features /></FadeIn>
        <FadeIn><Testimonials /></FadeIn>
        <FadeIn><FAQ /></FadeIn>
        <FadeIn><FinalCTA /></FadeIn>
      </main>
      <Footer />
    </div>
  );
}
