import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function FinalCTA() {
  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="absolute inset-0 bg-primary/5"></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-primary/10 blur-[100px] rounded-full pointer-events-none"></div>
      
      <div className="mx-auto max-w-4xl text-center relative z-10 border border-primary/20 bg-background/50 backdrop-blur-xl p-12 sm:p-20 rounded-[3rem] shadow-2xl">
        <h2 className="text-4xl font-heading font-extrabold tracking-tight sm:text-5xl mb-6">
          Ready to transform your polling?
        </h2>
        <p className="text-lg text-muted-foreground mb-10 max-w-2xl mx-auto">
          Join thousands of creators, educators, and teams who use PollVault for instant insights.
        </p>
        <Button size="lg" className="h-14 px-10 text-lg font-medium rounded-full shadow-xl shadow-primary/20 hover:scale-105 transition-transform duration-300" asChild>
          <Link to="/register">
            Get Started Free
            <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
        </Button>
      </div>
    </section>
  );
}
