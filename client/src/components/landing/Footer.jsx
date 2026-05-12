import { Link } from 'react-router-dom';
import { BarChart3 } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t border-border/50 bg-background pt-16 pb-8 relative overflow-hidden z-0 min-h-[500px] sm:min-h-[600px] flex flex-col">
      <img 
        src="/footer.webp" 
        alt="" 
        className="absolute inset-0 -z-10 h-full w-full object-cover object-bottom opacity-100 pointer-events-none"
      />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[1px] bg-gradient-to-r from-transparent via-primary/30 to-transparent"></div>
      <div className="mx-auto flex flex-col justify-between flex-1 w-full max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-2 gap-x-8 gap-y-12 md:grid-cols-4 lg:grid-cols-5">
          <div className="col-span-2 lg:col-span-2 pr-8">
            <Link to="/" className="flex items-center gap-2 mb-6 transition-opacity hover:opacity-70 w-max">
              <img src="/logo.png" alt="PollVault Logo" className="h-8 w-auto" />
              <span className="text-2xl font-heading font-bold tracking-tight">PollVault</span>
            </Link>
            <p className="text-sm text-muted-foreground max-w-xs mt-4 leading-relaxed">
              The definitive platform for real-time polling. Engage your audience and capture instant feedback.
            </p>
          </div>
          <div>
            <h3 className="font-semibold mb-6 text-muted-foreground uppercase tracking-widest text-xs">Products</h3>
            <ul className="space-y-4 text-sm font-medium text-foreground/90">
              <li><Link to="#" className="hover:text-primary transition-colors">Features</Link></li>
              <li><Link to="#" className="hover:text-primary transition-colors">Pricing</Link></li>
              <li><Link to="#" className="hover:text-primary transition-colors">Enterprise</Link></li>
              <li><Link to="#" className="hover:text-primary transition-colors">Security</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-6 text-muted-foreground uppercase tracking-widest text-xs">Resources</h3>
            <ul className="space-y-4 text-sm font-medium text-foreground/90">
              <li><Link to="#" className="hover:text-primary transition-colors">Documentation</Link></li>
              <li><Link to="#" className="hover:text-primary transition-colors">API Reference</Link></li>
              <li><Link to="#" className="hover:text-primary transition-colors">Blog</Link></li>
              <li><Link to="#" className="hover:text-primary transition-colors">Support</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-6 text-muted-foreground uppercase tracking-widest text-xs">Company</h3>
            <ul className="space-y-4 text-sm font-medium text-foreground/90">
              <li><Link to="#" className="hover:text-primary transition-colors">About</Link></li>
              <li><Link to="#" className="hover:text-primary transition-colors">Careers</Link></li>
              <li><Link to="#" className="hover:text-primary transition-colors">Privacy Policy</Link></li>
              <li><Link to="#" className="hover:text-primary transition-colors">Terms of Service</Link></li>
            </ul>
          </div>
        </div>
        <div className="mt-24 pt-8 border-t border-border/30 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-foreground/80 font-medium">
            © {new Date().getFullYear()} PollVault Inc. All rights reserved.
          </p>
          <div className="flex gap-3">
            <div className="h-9 w-9 rounded-full bg-background/50 backdrop-blur-sm border border-border/50 flex items-center justify-center hover:bg-background/80 hover:scale-105 transition-all cursor-pointer">
              <span className="text-sm font-semibold text-foreground">𝕏</span>
            </div>
            <div className="h-9 w-9 rounded-full bg-background/50 backdrop-blur-sm border border-border/50 flex items-center justify-center hover:bg-background/80 hover:scale-105 transition-all cursor-pointer">
              <span className="text-sm font-semibold text-foreground">in</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
