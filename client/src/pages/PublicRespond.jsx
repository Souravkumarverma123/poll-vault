import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getPublicPoll, submitResponse } from '@/api/polls';
import { useAuth } from '@/context/AuthContext';
import ResponseForm from '@/components/ResponseForm';
import ResultsView from '@/components/ResultsView';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { CheckCircle2, XCircle, Lock, BarChart3, Users, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

export default function PublicRespond() {
  const { shareId } = useParams();
  const { isAuthenticated } = useAuth();
  const [poll, setPoll] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  // Persistent respondent token — generated once per device, stored in
  // localStorage. Sent with every submission so the server can deduplicate
  // anonymous responses even across incognito tabs or different browsers.
  const respondentTokenRef = useRef('');
  useEffect(() => {
    const KEY = 'pv_respondent_token';
    let token = localStorage.getItem(KEY);
    if (!token) {
      // crypto.randomUUID() is available in all modern browsers (2022+).
      // Fall back to Math.random for very old environments.
      token = typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID()
        : Math.random().toString(36).slice(2) + Date.now().toString(36);
      localStorage.setItem(KEY, token);
    }
    respondentTokenRef.current = token;
  }, []);

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
      await submitResponse(poll._id, {
        answers,
        respondentToken: respondentTokenRef.current,
      });
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
            <Button variant="outline" className="mt-4" asChild><Link to="/">Go Home</Link></Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Auth required
  if (poll.responseMode === 'authenticated' && !isAuthenticated) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="p-8">
            <Lock className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">Login Required</h2>
            <p className="text-muted-foreground mb-4">This poll requires you to be logged in to respond.</p>
            <div className="flex gap-2 justify-center">
              <Button asChild><Link to={`/login?redirect=/respond/${shareId}`}>Log in</Link></Button>
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
            <p className="text-muted-foreground mb-6">Your response has been recorded successfully.</p>
            <div className="flex flex-col gap-2">
              {poll.isPublished && (
                <Button asChild>
                  <Link to={`/respond/${shareId}`}>View Results</Link>
                </Button>
              )}
              <Button variant="outline" asChild>
                <Link to="/">Go to Homepage</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Active — show form
  const estimatedMinutes = Math.max(1, Math.ceil(poll.questions.length * 0.5));

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 pb-16">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold sm:text-3xl">{poll.title}</h1>
        {poll.description && <p className="mt-2 text-muted-foreground">{poll.description}</p>}

        {/* Meta row: respondent count + expiry + estimated time */}
        <div className="mt-4 flex flex-wrap items-center justify-center gap-4 text-sm text-muted-foreground">
          {poll.totalResponses > 0 && (
            <span className="flex items-center gap-1.5">
              <Users className="h-4 w-4" />
              {poll.totalResponses} {poll.totalResponses === 1 ? 'person has' : 'people have'} responded
            </span>
          )}
          {poll.expiresAt && (
            <span className="flex items-center gap-1.5">
              <Clock className="h-4 w-4" />
              Closes {formatDistanceToNow(new Date(poll.expiresAt), { addSuffix: true })}
            </span>
          )}
          <span className="flex items-center gap-1.5">
            <BarChart3 className="h-4 w-4" />
            ~{estimatedMinutes} min
          </span>
        </div>
      </div>
      <ResponseForm questions={poll.questions} onSubmit={handleSubmit} loading={submitting} />
    </div>
  );
}
