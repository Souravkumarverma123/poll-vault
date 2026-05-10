import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4">
      <div className="text-center animate-fade-in">
        <h1 className="text-8xl font-bold text-primary/20">404</h1>
        <h2 className="mt-4 text-2xl font-semibold">Page not found</h2>
        <p className="mt-2 text-muted-foreground">The page you're looking for doesn't exist or has been moved.</p>
        <Button className="mt-6" asChild>
          <Link to="/">Go Home</Link>
        </Button>
      </div>
    </div>
  );
}
