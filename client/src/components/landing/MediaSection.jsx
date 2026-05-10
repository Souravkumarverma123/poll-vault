export function MediaSection() {
  return (
    <section className="py-24 overflow-hidden relative">
      {/* Background glow effects */}
      <div className="absolute inset-0 bg-primary/5"></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-primary/10 blur-[120px] rounded-full pointer-events-none"></div>

      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* The Card wrapper */}
        <div className="relative rounded-3xl p-2 sm:p-4 bg-white/5 border border-white/10 shadow-2xl backdrop-blur-xl overflow-hidden animate-slide-up" style={{ animationDelay: '500ms' }}>
          
          {/* Inner Card representing a browser window or UI container */}
          <div className="rounded-2xl overflow-hidden bg-[#0A0A0A] border border-white/5 aspect-[4/3] md:aspect-[16/9] relative group">
            
            {/* Top decorative bar */}
            <div className="absolute top-0 left-0 w-full h-12 bg-black/40 border-b border-white/5 flex items-center px-4 gap-2 z-20 backdrop-blur-md">
              <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
              <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
            </div>

            {/* Generated Mockup Image */}
            <div className="w-full h-full pt-12 bg-[#0d1117] relative">
               <img 
                 src="/dashboard-mockup.png" 
                 alt="PollVault Live Analytics Dashboard" 
                 className="w-full h-full object-cover opacity-90 transition-transform duration-700 group-hover:scale-105"
               />
               
               {/* Vignette/Overlay for depth */}
               <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none"></div>
               <div className="absolute inset-0 ring-1 ring-inset ring-white/10 rounded-2xl pointer-events-none"></div>
            </div>

            {/* Floating Live Indicator */}
            <div className="absolute bottom-6 right-6 bg-black/80 border border-white/10 rounded-lg shadow-2xl p-4 w-64 backdrop-blur-md animate-fade-in" style={{ animationDelay: '800ms' }}>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse"></div>
                <span className="text-sm font-medium text-white">Live Connection</span>
              </div>
              <p className="text-xs text-muted-foreground">Monitoring active WebSocket events.</p>
            </div>
            
          </div>
        </div>
      </div>
    </section>
  );
}
