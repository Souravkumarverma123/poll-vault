import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getPublicPoll, submitResponse } from '@/api/polls';
import { useAuth } from '@/context/AuthContext';
import ResponseForm from '@/components/ResponseForm';
import ResultsView from '@/components/ResultsView';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { CheckCircle2, XCircle, Lock, BarChart3, Users, Clock, Eye } from 'lucide-react';
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

  // For named polls: require the respondent to acknowledge the roll-call notice
  // before the form appears. Initialized to true for anonymous polls (no warning needed).
  const [warningAccepted, setWarningAccepted] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await getPublicPoll(shareId);
        const p = res.data.data.poll;
        setPoll(p);
        // Anonymous polls skip the warning screen
        if (p.responseMode !== 'named') setWarningAccepted(true);
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
      const status = err.response?.status;
      if (status === 409) {
        setSubmitted(true);
        toast.info('You have already submitted a response to this poll.');
        return;
      }
      toast.error(err.response?.data?.message || 'Failed to submit');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12 space-y-4">
        <Skeleton className="h-10 w-3/4 mx-auto" />
        <Skeleton className="h-6 w-1/2 mx-auto" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  // ── Error ──────────────────────────────────────────────────────────────────
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

  // ── Published results ──────────────────────────────────────────────────────
  if (poll.status === 'published' && poll.analytics) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12">
        <ResultsView analytics={poll.analytics} title={poll.title} description={poll.description} />
      </div>
    );
  }

  // ── Closed ─────────────────────────────────────────────────────────────────
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

  // ── Login required (all polls now require auth) ────────────────────────────
  if (!isAuthenticated) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="p-8">
            <Lock className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">Login Required</h2>
            <p className="text-muted-foreground mb-4">
              You must be logged in to respond to this poll.
            </p>
            <div className="flex gap-2 justify-center">
              <Button asChild>
                <Link to={`/login?redirect=/respond/${shareId}`}>Log in</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link to="/register">Sign up</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ── Named poll warning ─────────────────────────────────────────────────────
  // Shown before the form for named (roll-call) polls so respondents know
  // the creator will see their name and exact choice.
  if (poll.responseMode === 'named' && !warningAccepted) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="p-8">
            <Eye className="mx-auto h-12 w-12 text-amber-500 mb-4" />
            <h2 className="text-xl font-semibold mb-2">Named Poll</h2>
            <p className="text-muted-foreground mb-2">
              This is a <strong>roll-call poll</strong>. The creator will be able to see:
            </p>
            <ul className="text-sm text-muted-foreground text-left space-y-1 mb-6 bg-muted/40 rounded-lg px-4 py-3">
              <li>✓ Your name</li>
              <li>✓ Exactly which option(s) you selected</li>
            </ul>
            <p className="text-xs text-muted-foreground mb-6">
              Your responses will not be anonymous. Continue only if you agree.
            </p>
            <div className="flex gap-2 justify-center">
              <Button onClick={() => setWarningAccepted(true)}>
                I understand, continue
              </Button>
              <Button variant="outline" asChild>
                <Link to="/">Go back</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ── Submitted ──────────────────────────────────────────────────────────────
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

  // ── Active — show form ─────────────────────────────────────────────────────
  const estimatedMinutes = Math.max(1, Math.ceil(poll.questions.length * 0.5));

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 pb-16">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold sm:text-3xl">{poll.title}</h1>
        {poll.description && <p className="mt-2 text-muted-foreground">{poll.description}</p>}

        {/* Named poll reminder badge */}
        {poll.responseMode === 'named' && (
          <div className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 px-3 py-1 text-xs text-amber-700 dark:text-amber-400">
            <Eye className="h-3.5 w-3.5" />
            Roll-call poll — the creator will see your name and choice
          </div>
        )}

        {/* Meta row */}
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
