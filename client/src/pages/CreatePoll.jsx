import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPoll } from '@/api/polls';
import QuestionBuilder from '@/components/QuestionBuilder';
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Loader2, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

export default function CreatePoll() {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [responseMode, setResponseMode] = useState('anonymous');

  // Default expiry: 7 days from now
  const getDefaultExpiry = () => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().slice(0, 16);
  };

  const [expiresAt, setExpiresAt] = useState(getDefaultExpiry);
  const [questions, setQuestions] = useState([{ questionText: '', options: ['', ''], isRequired: true }]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Client-side validation
    if (!title.trim()) { setError('Poll title is required'); return; }
    if (!expiresAt) { setError('Expiry date is required'); return; }
    if (new Date(expiresAt) <= new Date()) { setError('Expiry must be in the future'); return; }
    for (let i = 0; i < questions.length; i++) {
      if (!questions[i].questionText.trim()) { setError(`Question ${i + 1} text is required`); return; }
      const emptyOpts = questions[i].options.filter(o => !o.trim());
      if (emptyOpts.length > 0) { setError(`All options in Question ${i + 1} must be filled`); return; }
    }

    setLoading(true);
    try {
      const res = await createPoll({ title, description, responseMode, expiresAt: new Date(expiresAt).toISOString(), questions });
      toast.success('Poll created successfully!');
      navigate(`/polls/${res.data.data.poll._id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create poll');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 pt-10 pb-12 sm:px-6">
      <Button variant="ghost" size="sm" className="mb-4" onClick={() => navigate(-1)}>
        <ArrowLeft className="mr-2 h-4 w-4" />Back
      </Button>

      <div className="mb-8">
        <h1 className="text-3xl font-heading font-bold">Create a Poll</h1>
        <p className="text-muted-foreground mt-1">Set up your poll, add questions, and start collecting responses.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}

        {/* Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>Give your poll a title and description</CardDescription>
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

        {/* Settings */}
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
              <Switch checked={responseMode === 'authenticated'} onCheckedChange={(checked) => setResponseMode(checked ? 'authenticated' : 'anonymous')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="expiry">Expiry Date & Time *</Label>
              <Input id="expiry" type="datetime-local" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} min={new Date().toISOString().slice(0, 16)} required />
            </div>
          </CardContent>
        </Card>

        {/* Questions */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Questions</h2>
          <QuestionBuilder questions={questions} setQuestions={setQuestions} />
        </div>

        <Separator />

        <Button type="submit" size="lg" className="w-full" disabled={loading}>
          {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Creating...</> : 'Create Poll'}
        </Button>
      </form>
    </div>
  );
}
