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
    <section className="relative mx-auto max-w-7xl px-4 pt-32 pb-20 sm:px-6 sm:pt-40 lg:px-8 text-center overflow-hidden">
      <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-border/50 bg-muted/50 px-4 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted/80 animate-fade-in">
        <Zap className="h-4 w-4 text-primary" />
        <span className="font-medium">Real-time analytics &middot; Anonymous &amp; Authenticated modes</span>
      </div>
      <h1 className="text-5xl font-heading font-extrabold tracking-tight sm:text-7xl lg:text-8xl">
        <span className="inline-block animate-fade-in" style={{ animationDelay: '0ms' }}>Insights</span>{' '}
        <span className="inline-block animate-fade-in text-muted-foreground" style={{ animationDelay: '100ms' }}>without</span>{' '}
        <span className="inline-block animate-fade-in" style={{ animationDelay: '200ms' }}>friction.</span>
      </h1>
      <p className="mx-auto mt-8 max-w-2xl text-lg text-muted-foreground sm:text-xl animate-fade-in" style={{ animationDelay: '300ms' }}>
        The definitive platform for real-time polling. Engage your audience, capture instant feedback, and publish beautiful analytics in seconds.
      </p>
      <div className="mt-12 flex flex-col items-center justify-center gap-4 sm:flex-row animate-fade-in" style={{ animationDelay: '400ms' }}>
        {isAuthenticated ? (
          <Button size="lg" className="h-14 px-8 text-lg font-medium rounded-full shadow-lg hover:scale-105 transition-transform duration-300" asChild>
            <Link to="/dashboard">
              Go to Dashboard
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        ) : (
          <Dialog>
            <DialogTrigger render={
              <Button size="lg" className="h-14 px-10 text-lg font-medium rounded-full shadow-lg hover:scale-105 transition-transform duration-300">
                Get Started
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            } />
            <DialogContent className="sm:max-w-[500px] p-6">
              <DialogHeader className="mb-4">
                <DialogTitle className="text-center text-3xl font-bold font-heading">Welcome to PollVault</DialogTitle>
                <p className="text-center text-muted-foreground mt-2">How would you like to continue?</p>
              </DialogHeader>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                <Link to="/login" className="flex flex-col items-center justify-center p-8 border border-border/50 rounded-2xl hover:border-primary transition-all duration-300 hover:shadow-md group bg-card">
                  <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                    <LogIn className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-heading font-semibold text-xl mb-1">Sign In</h3>
                  <p className="text-sm text-muted-foreground text-center">Already have an account?</p>
                </Link>
                <Link to="/register" className="flex flex-col items-center justify-center p-8 border border-border/50 rounded-2xl hover:border-primary transition-all duration-300 hover:shadow-md group bg-card">
                  <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                    <UserPlus className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-heading font-semibold text-xl mb-1">Register</h3>
                  <p className="text-sm text-muted-foreground text-center">Create a new account</p>
                </Link>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
      {/* Inline product preview — gives visitors a taste of the UI immediately */}
      <div className="mt-16 animate-fade-in" style={{ animationDelay: '600ms' }}>
        <div className="mx-auto max-w-xl rounded-2xl border border-border/60 bg-card/80 p-5 shadow-xl backdrop-blur-sm text-left">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-semibold">Favorite Framework?</span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Active
            </span>
          </div>
          <div className="space-y-2">
            {[
              { label: 'React', pct: 52 },
              { label: 'Vue',   pct: 28 },
              { label: 'Svelte',pct: 20 },
            ].map(({ label, pct }) => (
              <div key={label}>
                <div className="flex justify-between text-xs text-muted-foreground mb-1">
                  <span>{label}</span><span>{pct}%</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-2 rounded-full bg-foreground transition-all duration-700"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
          <p className="mt-4 text-xs text-muted-foreground">247 responses &middot; Closes in 3 days</p>
        </div>
      </div>

      {/* Decorative background blur */}
      <div className="absolute top-1/2 left-1/2 -z-10 -translate-x-1/2 -translate-y-1/2">
        <div className="h-[400px] w-[600px] rounded-full bg-primary/5 blur-[120px]" />
      </div>
    </section>
  );
}
