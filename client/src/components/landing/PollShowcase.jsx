import { useState } from 'react';

export function PollShowcase() {
  const [options, setOptions] = useState([
    { label: 'React', votes: 128 },
    { label: 'Vue',   votes: 69 },
    { label: 'Svelte',votes: 50 },
  ]);
  const [totalVotes, setTotalVotes] = useState(247);
  const [activeIdx, setActiveIdx] = useState(null);

  const handleVote = (idx) => {
    const newOptions = [...options];
    newOptions[idx].votes += 1;
    setOptions(newOptions);
    setTotalVotes(prev => prev + 1);
    setActiveIdx(idx);
    setTimeout(() => setActiveIdx(null), 500);
  };

  return (
    <section className="relative w-full py-12 bg-transparent -mt-20 z-10 flex justify-center px-4 sm:px-6 lg:px-8">
      {/* Inline product preview — brutalist console style */}
      <div className="w-full max-w-3xl rounded-none border border-border bg-card/80 backdrop-blur-md p-0 text-left font-mono text-sm shadow-2xl hover:border-primary/50 transition-colors duration-500">
        <div className="flex items-center justify-between border-b border-border p-4 bg-muted/50 backdrop-blur-md">
          <span className="font-bold tracking-tight text-foreground uppercase text-xs sm:text-sm">Query_01: Framework</span>
          <span className="inline-flex items-center gap-2 px-2 py-0.5 text-xs font-bold uppercase tracking-wider text-foreground border border-foreground bg-background/50">
            <span className="h-1.5 w-1.5 bg-foreground animate-pulse" />
            Live
          </span>
        </div>
        <div className="p-6 sm:p-8 space-y-6">
          {options.map((opt, idx) => {
            const pct = Math.round((opt.votes / totalVotes) * 100);
            const isPulsing = activeIdx === idx;
            return (
              <div 
                key={opt.label} 
                className="group cursor-pointer"
                onClick={() => handleVote(idx)}
              >
                <div className="flex justify-between text-muted-foreground mb-2 text-xs sm:text-sm uppercase tracking-wider group-hover:text-foreground transition-colors">
                  <span>{opt.label}</span><span className="text-foreground">{pct}%</span>
                </div>
                <div className="h-1.5 bg-border/50 overflow-hidden relative group-hover:bg-border transition-colors">
                  <div
                    className={`absolute inset-y-0 left-0 bg-foreground transition-all duration-500 ease-out ${isPulsing ? 'shadow-[0_0_15px_rgba(255,255,255,0.8)] dark:shadow-[0_0_15px_rgba(255,255,255,0.8)] bg-primary' : ''}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
          <div className="pt-4 border-t border-border/50 mt-8 text-xs text-muted-foreground flex justify-between uppercase tracking-widest">
            <span>RESP: {totalVotes}</span>
            <span>TTL: 72H</span>
          </div>
        </div>
      </div>
    </section>
  );
}
