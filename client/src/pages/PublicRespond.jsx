import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getPublicPoll, submitResponse } from '@/api/polls';
import { useAuth } from '@/context/AuthContext';
import ResponseForm from '@/components/ResponseForm';
import ResultsView from '@/components/ResultsView';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle2, XCircle, Lock, BarChart3 } from 'lucide-react';
import { toast } from 'sonner';

export default function PublicRespond() {
  const { shareId } = useParams();
  const { user, isAuthenticated } = useAuth();
  const [poll, setPoll] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await getPublicPoll(shareId);
        setPoll(res.data.data.poll);
      } catch (err) {
        setError(err.response?.status === 404 ? 'Poll not found' : 'Failed to load poll');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [shareId]);

  const handleSubmit = async (answers) => {
    setSubmitting(true);
    try {
      await submitResponse(poll._id, { answers });
      setSubmitted(true);
      toast.success('Response submitted!');
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to submit';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12 space-y-4">
        <Skeleton className="h-10 w-3/4 mx-auto" />
        <Skeleton className="h-6 w-1/2 mx-auto" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="p-8">
            <XCircle className="mx-auto h-12 w-12 text-destructive mb-4" />
            <h2 className="text-xl font-semibold mb-2">Oops!</h2>
            <p className="text-muted-foreground">{error}</p>
            <Button className="mt-4" asChild><Link to="/">Go Home</Link></Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!poll) return null;

  // Published — show results
  if (poll.status === 'published' && poll.analytics) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12">
        <ResultsView analytics={poll.analytics} title={poll.title} description={poll.description} />
      </div>
    );
  }

  // Closed
  if (poll.status === 'closed') {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="p-8">
            <XCircle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">Poll Closed</h2>
            <p className="text-muted-foreground">This poll is no longer accepting responses.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Authenticated mode — need login
  if (poll.responseMode === 'authenticated' && !isAuthenticated) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="p-8">
            <Lock className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">Login Required</h2>
            <p className="text-muted-foreground mb-4">This poll requires you to be logged in to respond.</p>
            <div className="flex gap-2 justify-center">
              <Button asChild><Link to="/login">Log in</Link></Button>
              <Button variant="outline" asChild><Link to="/register">Sign up</Link></Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Submitted
  if (submitted) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4">
        <Card className="w-full max-w-md text-center animate-fade-in">
          <CardContent className="p-8">
            <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-500 mb-4" />
            <h2 className="text-xl font-semibold mb-2">Thank You!</h2>
            <p className="text-muted-foreground">Your response has been recorded successfully.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Active — show form
  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
          <BarChart3 className="h-6 w-6 text-primary" />
        </div>
        <h1 className="text-2xl font-bold sm:text-3xl">{poll.title}</h1>
        {poll.description && <p className="mt-2 text-muted-foreground">{poll.description}</p>}
      </div>
      <ResponseForm questions={poll.questions} onSubmit={handleSubmit} loading={submitting} />
    </div>
  );
}
