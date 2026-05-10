import { BarChart3, Shield, Zap, Globe, Lock } from 'lucide-react';

const features = [
  { 
    icon: BarChart3, 
    title: 'Real-Time Analytics', 
    desc: 'Watch responses flow in live with WebSocket-powered dashboards and beautiful charts. No refreshing required.',
    className: 'md:col-span-2 md:row-span-2 bg-gradient-to-br from-card to-primary/5',
    contentDark: (
      <div className="mt-8 bg-[#0a0a0a] rounded-2xl p-6 sm:p-8 border border-border/30 shadow-2xl flex flex-col md:flex-row gap-8 items-center md:items-start justify-between">
        <div className="flex-1 w-full max-w-sm">
          <h4 className="text-white font-semibold text-sm mb-4">1. Which software development role pays the most?</h4>
          
          <div className="flex items-center gap-1 bg-[#1A1A1A] w-max rounded-md p-1 border border-border/30 mb-8">
            <span className="px-3 py-1 text-xs text-muted-foreground font-medium">Bar Chart</span>
            <span className="px-3 py-1 text-xs text-white bg-[#2A2A2A] rounded font-medium border border-border/50 shadow-sm">Doughnut</span>
          </div>

          <div className="flex flex-col items-center">
            {/* Chart */}
            <div className="relative w-40 h-40 rounded-full flex items-center justify-center shadow-[0_0_40px_rgba(91,107,249,0.15)]" style={{ background: 'conic-gradient(#5B6BF9 0% 67%, #F97316 67% 100%)' }}>
              <div className="w-20 h-20 bg-[#0a0a0a] rounded-full"></div>
            </div>
            
            {/* Center Stack Legend */}
            <div className="flex flex-col mt-6 gap-2 ml-4">
              <div className="flex items-center gap-3"><div className="w-8 h-3 bg-[#5B6BF9] rounded-[2px]"></div><span className="text-xs text-muted-foreground font-medium">AI/ML Engineer</span></div>
              <div className="flex items-center gap-3"><div className="w-10 h-3 bg-pink-600 rounded-[2px]"></div><span className="text-xs text-muted-foreground font-medium">Software Architect</span></div>
              <div className="flex items-center gap-3"><div className="w-12 h-3 bg-green-500 rounded-[2px]"></div><span className="text-xs text-muted-foreground font-medium">Staff/Principal Engineer</span></div>
              <div className="flex items-center gap-3"><div className="w-14 h-3 bg-[#F97316] rounded-[2px]"></div><span className="text-xs text-muted-foreground font-medium">Quant Developer (Finance/HFT)</span></div>
            </div>
          </div>
        </div>

        {/* Bottom/Side List */}
        <div className="flex-1 w-full space-y-4 md:mt-auto bg-[#111] p-5 rounded-xl border border-border/20">
          <div className="flex justify-between items-center text-sm">
            <div className="flex items-center gap-3"><div className="w-3 h-3 bg-[#5B6BF9] rounded-sm"></div><span className="text-white font-medium">AI/ML Engineer</span></div>
            <span className="text-muted-foreground tabular-nums">2 (67%)</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <div className="flex items-center gap-3"><div className="w-3 h-3 bg-pink-600 rounded-sm"></div><span className="text-white font-medium">Software Architect</span></div>
            <span className="text-muted-foreground tabular-nums">0 (0%)</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <div className="flex items-center gap-3"><div className="w-3 h-3 bg-green-500 rounded-sm"></div><span className="text-white font-medium">Staff/Principal Engineer</span></div>
            <span className="text-muted-foreground tabular-nums">0 (0%)</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <div className="flex items-center gap-3"><div className="w-3 h-3 bg-[#F97316] rounded-sm"></div><span className="text-white font-medium">Quant Developer (Finance/HFT)</span></div>
            <span className="text-muted-foreground tabular-nums">1 (33%)</span>
          </div>
        </div>
      </div>
    ),
    contentLight: (
      <div className="mt-8 bg-white rounded-2xl p-6 sm:p-8 border border-border shadow-sm flex flex-col w-full">
        <h4 className="text-black font-bold text-base mb-4">1. Which software development role pays the most?</h4>
        
        <div className="flex items-center gap-1 bg-gray-100 w-max rounded-md p-1 border border-gray-200 mb-8">
          <span className="px-3 py-1 text-xs text-black bg-white shadow-sm rounded font-medium border border-gray-200">Bar Chart</span>
          <span className="px-3 py-1 text-xs text-gray-500 font-medium">Doughnut</span>
        </div>

        {/* Bar Chart Area */}
        <div className="relative w-full h-48 flex items-end justify-around pb-0">
          {/* Grid lines */}
          <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
            <div className="w-full border-t border-gray-100 flex-1"></div>
            <div className="w-full border-t border-gray-100 flex-1"></div>
            <div className="w-full border-t border-gray-100 flex-1"></div>
            <div className="w-full border-t border-gray-200 h-px"></div>
          </div>
          
          {/* Y-axis labels */}
          <div className="absolute left-0 top-0 bottom-0 flex flex-col justify-between text-xs text-gray-400 py-1 -ml-4">
            <span>2</span>
            <span>1</span>
            <span>0</span>
          </div>

          {/* Bars */}
          <div className="relative z-10 w-1/4 h-full flex justify-center items-end">
            <div className="w-[80%] sm:w-full max-w-[80px] h-full bg-[#818cf8] rounded-t-md"></div>
          </div>
          <div className="relative z-10 w-1/4 h-full flex justify-center items-end">
            <div className="w-[80%] sm:w-full max-w-[80px] h-0 bg-pink-400 rounded-t-md"></div>
          </div>
          <div className="relative z-10 w-1/4 h-full flex justify-center items-end">
            <div className="w-[80%] sm:w-full max-w-[80px] h-0 bg-green-400 rounded-t-md"></div>
          </div>
          <div className="relative z-10 w-1/4 h-full flex justify-center items-end">
            <div className="w-[80%] sm:w-full max-w-[80px] h-1/2 bg-[#fb923c] rounded-t-md"></div>
          </div>
        </div>

        {/* X-axis labels */}
        <div className="flex justify-around mt-2 text-[10px] sm:text-xs text-gray-500 text-center">
          <div className="w-1/4">AI/ML Engineer</div>
          <div className="w-1/4">Software Architect</div>
          <div className="w-1/4">Staff/Principal Engineer</div>
          <div className="w-1/4 hidden sm:block">Quant Developer (Finance/HFT)</div>
          <div className="w-1/4 sm:hidden">Quant Developer</div>
        </div>

        {/* Legend List */}
        <div className="mt-8 space-y-3 w-full">
          <div className="flex justify-between items-center text-sm">
            <div className="flex items-center gap-3"><div className="w-3 h-3 bg-[#818cf8] rounded-sm"></div><span className="text-black font-medium">AI/ML Engineer</span></div>
            <span className="text-gray-600 tabular-nums">2 (67%)</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <div className="flex items-center gap-3"><div className="w-3 h-3 bg-pink-400 rounded-sm"></div><span className="text-black font-medium">Software Architect</span></div>
            <span className="text-gray-600 tabular-nums">0 (0%)</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <div className="flex items-center gap-3"><div className="w-3 h-3 bg-green-400 rounded-sm"></div><span className="text-black font-medium">Staff/Principal Engineer</span></div>
            <span className="text-gray-600 tabular-nums">0 (0%)</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <div className="flex items-center gap-3"><div className="w-3 h-3 bg-[#fb923c] rounded-sm"></div><span className="text-black font-medium">Quant Developer (Finance/HFT)</span></div>
            <span className="text-gray-600 tabular-nums">1 (33%)</span>
          </div>
        </div>
      </div>
    )
  },
  { 
    icon: Shield, 
    title: 'Flexible Privacy', 
    desc: 'Choose anonymous or authenticated modes per poll.',
    className: 'md:col-span-1 md:row-span-1'
  },
  { 
    icon: Zap, 
    title: 'Instant Publishing', 
    desc: 'Publish final results with one click.',
    className: 'md:col-span-1 md:row-span-1'
  },
  { 
    icon: Globe, 
    title: 'Shareable Links', 
    desc: 'Every poll gets a unique link. Share anywhere.',
    className: 'md:col-span-1 md:row-span-1'
  },
  { 
    icon: Lock, 
    title: 'Role-Based Access', 
    desc: 'Manage your platform with powerful admin controls.',
    className: 'md:col-span-2 md:row-span-1'
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
