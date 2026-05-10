export function SocialProof() {
  const stats = [
    { label: 'Latency', value: '<50ms' },
    { label: 'Uptime', value: '99.9%' },
    { label: 'Data Sync', value: 'Real-time' },
    { label: 'Privacy', value: 'End-to-End' },
  ];

  return (
    <section className="border-y border-border/40 bg-muted/10 relative overflow-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {stats.map((stat, i) => (
            <div key={stat.label} className="text-center animate-slide-up" style={{ animationDelay: `${i * 100}ms` }}>
              <p className="text-5xl font-heading font-bold tracking-tight text-foreground">{stat.value}</p>
              <p className="mt-3 text-sm font-medium tracking-widest text-muted-foreground uppercase">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
