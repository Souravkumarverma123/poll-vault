import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { BarChart3, Shield, Zap, Globe, ArrowRight } from 'lucide-react';

const features = [
  { icon: BarChart3, title: 'Real-Time Analytics', desc: 'Watch responses flow in live with WebSocket-powered dashboards and beautiful charts.' },
  { icon: Shield, title: 'Flexible Privacy', desc: 'Choose anonymous or authenticated modes per poll. Full control over respondent identity.' },
  { icon: Zap, title: 'Instant Publishing', desc: 'Publish final results with one click. Share analytics publicly when you\'re ready.' },
  { icon: Globe, title: 'Shareable Links', desc: 'Every poll gets a unique link. Share anywhere — no app download required.' },
];

export default function Landing() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="relative overflow-hidden">
      {/* Hero */}
      <section className="mx-auto max-w-7xl px-4 pt-28 pb-24 sm:px-6 sm:pt-36 sm:pb-32 lg:px-8">
        <div className="text-center animate-fade-in">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border/50 bg-muted/50 px-4 py-1.5 text-sm text-muted-foreground">
            <Zap className="h-3.5 w-3.5 text-primary" />
            Production-ready polling platform
          </div>
          <h1 className="text-4xl font-heading font-bold tracking-tight sm:text-6xl lg:text-7xl">
            Create polls that<br />
            <span className="text-foreground">deliver insights</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground sm:text-xl">
            Build single-choice polls, collect responses in real-time, and publish beautiful analytics — all from one platform.
          </p>
          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            {isAuthenticated ? (
              <Button size="lg" asChild>
                <Link to="/dashboard">
                  Go to Dashboard
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            ) : (
              <>
                <Button size="lg" asChild>
                  <Link to="/register">
                    Get Started Free
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link to="/login">Log in</Link>
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="mt-20 grid grid-cols-2 gap-4 sm:grid-cols-4 animate-slide-up">
          {[
            { label: 'Authentication', value: 'JWT' },
            { label: 'Real-time', value: 'WebSocket' },
            { label: 'Charts', value: 'Chart.js' },
            { label: 'Stack', value: 'MERN' },
          ].map((stat) => (
            <Card key={stat.label} className="text-center rounded-none transition-all duration-300 hover:shadow-md">
              <CardContent className="p-6">
                <p className="text-2xl font-heading font-bold text-foreground">{stat.value}</p>
                <p className="text-xs text-muted-foreground mt-2 uppercase tracking-wider">{stat.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-heading font-bold">Everything you need</h2>
          <p className="mt-2 text-muted-foreground">Powerful features for creating and managing polls</p>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f, i) => (
            <Card key={f.title} className="group rounded-none transition-all duration-300 hover:-translate-y-1 hover:shadow-md" style={{ animationDelay: `${i * 100}ms` }}>
              <CardContent className="p-8">
                <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-sm bg-foreground transition-colors group-hover:bg-primary/90">
                  <f.icon className="h-5 w-5 text-background" />
                </div>
                <h3 className="font-heading font-bold text-xl">{f.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{f.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 py-8">
        <div className="mx-auto max-w-7xl px-4 text-center text-sm text-muted-foreground">
          <p>Built with React, Express, MongoDB, and Socket.IO</p>
        </div>
      </footer>
    </div>
  );
}
