import { Link } from 'react-router-dom';
import { BarChart3 } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t border-border/50 bg-background py-12 relative overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[1px] bg-gradient-to-r from-transparent via-primary/30 to-transparent"></div>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4 lg:grid-cols-5">
          <div className="col-span-2 lg:col-span-2">
            <Link to="/" className="flex items-center gap-2 mb-4 transition-opacity hover:opacity-70 w-max">
              <div className="flex h-8 w-8 items-center justify-center rounded-sm bg-foreground">
                <BarChart3 className="h-4 w-4 text-background" />
              </div>
              <span className="text-2xl font-heading font-bold tracking-tight">
                PollVault
              </span>
            </Link>
            <p className="text-sm text-muted-foreground max-w-xs mt-4">
              The modern polling platform for real-time insights and beautiful analytics.
            </p>
          </div>
          <div>
            <h3 className="font-semibold mb-4 text-foreground tracking-tight">Product</h3>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li><Link to="#" className="hover:text-primary transition-colors">Features</Link></li>
              <li><Link to="#" className="hover:text-primary transition-colors">Pricing</Link></li>
              <li><Link to="#" className="hover:text-primary transition-colors">Security</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-4 text-foreground tracking-tight">Resources</h3>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li><Link to="#" className="hover:text-primary transition-colors">Documentation</Link></li>
              <li><Link to="#" className="hover:text-primary transition-colors">Blog</Link></li>
              <li><Link to="#" className="hover:text-primary transition-colors">Support</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-4 text-foreground tracking-tight">Company</h3>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li><Link to="#" className="hover:text-primary transition-colors">About</Link></li>
              <li><Link to="#" className="hover:text-primary transition-colors">Privacy</Link></li>
              <li><Link to="#" className="hover:text-primary transition-colors">Terms</Link></li>
            </ul>
          </div>
        </div>
        <div className="mt-16 pt-8 border-t border-border/50 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} PollVault Inc. All rights reserved.
          </p>
          <div className="flex gap-4">
            <div className="h-8 w-8 rounded-full border border-border/50 bg-card flex items-center justify-center hover:bg-muted transition-colors cursor-pointer hover:border-border">
              <span className="text-xs font-semibold">𝕏</span>
            </div>
            <div className="h-8 w-8 rounded-full border border-border/50 bg-card flex items-center justify-center hover:bg-muted transition-colors cursor-pointer hover:border-border">
              <span className="text-xs font-semibold">in</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
