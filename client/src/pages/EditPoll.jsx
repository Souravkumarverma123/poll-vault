import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getPoll, editPoll } from '@/api/polls';
import QuestionBuilder from '@/components/QuestionBuilder';
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Loader2, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

export default function EditPoll() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [responseMode, setResponseMode] = useState('anonymous');
  const [expiresAt, setExpiresAt] = useState('');
  const [questions, setQuestions] = useState([]);

  useEffect(() => {
    const fetchPoll = async () => {
      try {
        const res = await getPoll(id);
        const poll = res.data.data.poll;

        if (poll.isPublished) {
          toast.error('Cannot edit a published poll');
          navigate(`/polls/${id}`);
          return;
        }

        setTitle(poll.title);
        setDescription(poll.description || '');
        setResponseMode(poll.responseMode);
        setExpiresAt(new Date(poll.expiresAt).toISOString().slice(0, 16));
        setQuestions(poll.questions.map(q => ({
          ...q,
          questionType: q.questionType || 'single',
          options: q.options || [],
        })));
      } catch {
        navigate('/dashboard');
      } finally {
        setLoading(false);
      }
    };
    fetchPoll();
  }, [id, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!title.trim()) { setError('Poll title is required'); return; }
    if (!expiresAt) { setError('Expiry date is required'); return; }
    if (new Date(expiresAt) <= new Date()) { setError('Expiry must be in the future'); return; }

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.questionText.trim()) { setError(`Question ${i + 1} text is required`); return; }
      if (q.questionType !== 'text') {
        const emptyOpts = q.options.filter(o => !o.trim());
        if (emptyOpts.length > 0) { setError(`All options in Question ${i + 1} must be filled`); return; }
      }
    }

    setSaving(true);
    try {
      await editPoll(id, {
        title, description, responseMode,
        expiresAt: new Date(expiresAt).toISOString(),
        questions,
      });
      toast.success('Poll updated successfully!');
      navigate(`/polls/${id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update poll');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl px-4 pt-10 pb-12 sm:px-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 pt-10 pb-12 sm:px-6">
      <Button variant="ghost" size="sm" className="mb-4" onClick={() => navigate(`/polls/${id}`)}>
        <ArrowLeft className="mr-2 h-4 w-4" />Back to Poll
      </Button>

      <div className="mb-8">
        <h1 className="text-3xl font-heading font-bold">Edit Poll</h1>
        <p className="text-muted-foreground mt-1">Update your poll details and questions.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}

        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>Update the poll title and description</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input id="title" placeholder="What do you want to ask?" value={title} onChange={(e) => setTitle(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" placeholder="Add context for your respondents..." value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Settings</CardTitle>
            <CardDescription>Configure response mode and expiry</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div>
                <Label>Authenticated Responses</Label>
                <p className="text-sm text-muted-foreground">Require respondents to log in</p>
              </div>
              <Switch
                checked={responseMode === 'authenticated'}
                onCheckedChange={(checked) => setResponseMode(checked ? 'authenticated' : 'anonymous')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="expiry">Expiry Date & Time *</Label>
              <Input
                id="expiry" type="datetime-local"
                value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)}
                min={new Date().toISOString().slice(0, 16)} required
              />
            </div>
          </CardContent>
        </Card>

        <div>
          <h2 className="text-xl font-semibold mb-4">Questions</h2>
          <QuestionBuilder questions={questions} setQuestions={setQuestions} />
        </div>

        <Separator />

        <div className="flex gap-3">
          <Button type="button" variant="outline" className="flex-1" onClick={() => navigate(`/polls/${id}`)}>
            Cancel
          </Button>
          <Button type="submit" size="lg" className="flex-1" disabled={saving}>
            {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</> : 'Save Changes'}
          </Button>
        </div>
      </form>
    </div>
  );
}
