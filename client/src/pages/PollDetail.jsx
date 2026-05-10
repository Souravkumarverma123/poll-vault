import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getPoll, deletePoll, publishPoll } from '@/api/polls';
import LiveAnalytics from '@/components/LiveAnalytics';
import ShareLink from '@/components/ShareLink';
import StatusBadge from '@/components/StatusBadge';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ArrowLeft, Trash2, Globe, Loader2, Clock, Users, Shield } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { toast } from 'sonner';

export default function PollDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [poll, setPoll] = useState(null);
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await getPoll(id);
        setPoll(res.data.data.poll);
      } catch { navigate('/dashboard'); }
      finally { setLoading(false); }
    };
    fetch();
  }, [id, navigate]);

  const handlePublish = async () => {
    setPublishing(true);
    try {
      await publishPoll(id);
      setPoll(p => ({ ...p, isPublished: true, status: 'published' }));
      toast.success('Results published successfully!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to publish');
    } finally { setPublishing(false); }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deletePoll(id);
      toast.success('Poll deleted');
      navigate('/dashboard');
    } catch (err) {
      toast.error('Failed to delete poll');
    } finally { setDeleting(false); }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8 space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!poll) return null;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <Button variant="ghost" size="sm" className="mb-4" onClick={() => navigate('/dashboard')}>
        <ArrowLeft className="mr-2 h-4 w-4" />Dashboard
      </Button>

      {/* Poll Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between mb-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold">{poll.title}</h1>
            <StatusBadge status={poll.status} />
          </div>
          {poll.description && <p className="text-muted-foreground">{poll.description}</p>}
        </div>
        <div className="flex gap-2 shrink-0">
          {!poll.isPublished && poll.status !== 'closed' && (
            <Button onClick={handlePublish} disabled={publishing}>
              {publishing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Globe className="mr-2 h-4 w-4" />}
              Publish Results
            </Button>
          )}
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="icon" className="text-destructive hover:text-destructive">
                <Trash2 className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Delete this poll?</DialogTitle>
                <DialogDescription>This will permanently delete the poll and all its responses. This action cannot be undone.</DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
                  {deleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Delete
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Poll Info */}
      <Card className="mb-6">
        <CardContent className="grid gap-4 p-6 sm:grid-cols-3">
          <div className="flex items-center gap-3">
            <Clock className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">Expires</p>
              <p className="text-sm font-medium">{format(new Date(poll.expiresAt), 'PPp')}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Users className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">Responses</p>
              <p className="text-sm font-medium">{poll.responseCount || 0}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Shield className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">Mode</p>
              <p className="text-sm font-medium capitalize">{poll.responseMode}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Share Link */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">Share this poll</CardTitle>
        </CardHeader>
        <CardContent>
          <ShareLink shareId={poll.shareId} />
        </CardContent>
      </Card>

      <Separator className="my-6" />

      {/* Live Analytics */}
      <h2 className="text-xl font-semibold mb-4">Analytics</h2>
      <LiveAnalytics pollId={id} />
    </div>
  );
}
