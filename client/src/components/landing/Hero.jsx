import { Link } from 'react-router-dom';
import { ArrowRight, Zap, LogIn, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function Hero({ isAuthenticated }) {
  return (
    <div className="relative w-full overflow-hidden z-0">
      {/* Custom image background */}
      <img 
        src="/hero-bg.png" 
        alt="" 
        className="absolute inset-x-0 top-0 -z-10 h-[800px] w-full object-cover object-top opacity-100 pointer-events-none"
      />
      <section className="relative mx-auto max-w-5xl px-4 pt-32 pb-32 sm:px-6 sm:pt-48 lg:px-8 text-center flex flex-col items-center">
      
      <h1 className="font-heading font-light text-[60px] sm:text-[80px] lg:text-[104px] leading-[0.95] tracking-[-0.04em]">
        <span className="inline-block animate-fade-in text-foreground" style={{ animationDelay: '0ms' }}>Insights</span>{' '}
        <span className="inline-block animate-fade-in text-muted-foreground" style={{ animationDelay: '100ms' }}>without</span>{' '}
        <span className="inline-block animate-fade-in text-foreground" style={{ animationDelay: '200ms' }}>friction.</span>
      </h1>
      <p className="mt-8 max-w-2xl text-lg text-muted-foreground sm:text-xl font-mono tracking-tight animate-fade-in mx-auto" style={{ animationDelay: '300ms' }}>
        The definitive platform for real-time polling. Engage your audience, capture instant feedback, and publish pure data in seconds.
      </p>
      <div className="mt-12 flex flex-col items-center justify-center gap-4 sm:flex-row animate-fade-in" style={{ animationDelay: '400ms' }}>
        {isAuthenticated ? (
          <Button size="lg" className="h-12 px-8 text-base font-mono uppercase tracking-wide rounded-none border border-foreground bg-foreground text-background hover:bg-transparent hover:text-foreground transition-colors duration-150" asChild>
            <Link to="/dashboard">
              Go to Dashboard
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        ) : (
          <Dialog>
            <DialogTrigger render={
              <Button size="lg" className="h-12 px-8 text-base font-mono uppercase tracking-wide rounded-none border border-foreground bg-foreground text-background hover:bg-transparent hover:text-foreground transition-colors duration-150">
                Get Started
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            } />
            <DialogContent className="sm:max-w-[500px] p-6 rounded-none border-border bg-background">
              <DialogHeader className="mb-4 border-b border-border pb-4">
                <DialogTitle className="text-left text-2xl font-bold font-heading tracking-tight">System Access</DialogTitle>
                <p className="text-left text-muted-foreground mt-2 font-mono text-sm">Select authentication method</p>
              </DialogHeader>
              <div className="grid grid-cols-1 gap-4 mt-2">
                <Link to="/login" className="flex items-center p-4 border border-border rounded-none hover:border-foreground transition-colors duration-150 hover:bg-foreground/5 group bg-card">
                  <div className="h-10 w-10 border border-border flex items-center justify-center mr-4 group-hover:bg-foreground group-hover:text-background transition-colors duration-150">
                    <LogIn className="h-4 w-4" />
                  </div>
                  <div className="text-left">
                    <h3 className="font-heading font-semibold text-lg">Sign In</h3>
                    <p className="text-sm font-mono text-muted-foreground">Authenticate existing session</p>
                  </div>
                </Link>
                <Link to="/register" className="flex items-center p-4 border border-border rounded-none hover:border-foreground transition-colors duration-150 hover:bg-foreground/5 group bg-card">
                  <div className="h-10 w-10 border border-border flex items-center justify-center mr-4 group-hover:bg-foreground group-hover:text-background transition-colors duration-150">
                    <UserPlus className="h-4 w-4" />
                  </div>
                  <div className="text-left">
                    <h3 className="font-heading font-semibold text-lg">Register</h3>
                    <p className="text-sm font-mono text-muted-foreground">Initialize new user profile</p>
                  </div>
                </Link>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      </section>
    </div>
  );
}
