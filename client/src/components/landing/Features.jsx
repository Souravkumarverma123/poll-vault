import { BarChart3, Shield, Zap, Globe, Lock } from 'lucide-react';

const features = [
  { 
    icon: BarChart3, 
    title: 'Real-Time Analytics', 
    desc: 'Watch responses flow in live with WebSocket-powered dashboards and beautiful charts. No refreshing required.',
    className: 'md:col-span-2'
  },
  { 
    icon: Shield, 
    title: 'Flexible Privacy', 
    desc: 'Choose Anonymous (aggregate only) or Named Roll-Call mode — you decide whether respondents are visible.',
    className: 'md:col-span-1'
  },
  { 
    icon: Zap, 
    title: 'Instant Publishing', 
    desc: 'Publish final results with one click.',
    className: 'md:col-span-1'
  },
  { 
    icon: Globe, 
    title: 'Shareable Links', 
    desc: 'Every poll gets a unique link. Share anywhere.',
    className: 'md:col-span-1'
  },
  { 
    icon: Lock, 
    title: 'Role-Based Access', 
    desc: 'Manage your platform with powerful admin controls.',
    className: 'md:col-span-1'
  },
];

export function Features() {
  return (
    <section className="py-24 relative">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-16 max-w-3xl">
          <h2 className="text-4xl font-heading font-bold sm:text-5xl">Engineered for speed.<br/><span className="text-muted-foreground">Designed for clarity.</span></h2>
        </div>
        
        <div className="grid gap-4 md:grid-cols-3 md:grid-rows-2">
          {features.map((f) => (
            <div key={f.title} className={`group relative overflow-hidden rounded-3xl border border-border/50 bg-card p-8 transition-all duration-300 hover:border-primary/30 hover:shadow-xl hover:-translate-y-1 flex flex-col ${f.className || ''}`}>
              <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-muted/50 text-foreground transition-colors duration-300 group-hover:bg-primary group-hover:text-primary-foreground group-hover:shadow-lg group-hover:shadow-primary/20 shrink-0">
                <f.icon className="h-6 w-6" />
              </div>
              <h3 className="mb-3 text-2xl font-heading font-semibold tracking-tight">{f.title}</h3>
              <p className="text-muted-foreground leading-relaxed">{f.desc}</p>
              {f.contentDark && <div className="hidden dark:block w-full">{f.contentDark}</div>}
              {f.contentLight && <div className="block dark:hidden w-full">{f.contentLight}</div>}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
