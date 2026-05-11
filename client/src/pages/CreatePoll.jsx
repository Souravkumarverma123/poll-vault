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
import { Loader2, ArrowLeft, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { addDays, addMonths, addYears } from 'date-fns';

const TITLE_MAX = 200;
const DESC_MAX = 1000;

/** Format a Date to the value expected by <input type="datetime-local"> */
const toLocalISO = (d) => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);

const EXPIRY_PRESETS = [
  { label: '1 day',   fn: () => addDays(new Date(), 1) },
  { label: '7 days',  fn: () => addDays(new Date(), 7) },
  { label: '30 days', fn: () => addDays(new Date(), 30) },
  { label: '3 months',fn: () => addMonths(new Date(), 3) },
  { label: '1 year',  fn: () => addYears(new Date(), 1) },
];

export default function CreatePoll() {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [responseMode, setResponseMode] = useState('anonymous');

  const getDefaultExpiry = () => toLocalISO(addDays(new Date(), 7));
  const [expiresAt, setExpiresAt] = useState(getDefaultExpiry);
  const [questions, setQuestions] = useState([{ questionText: '', options: ['', ''], isRequired: true }]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!title.trim()) { setError('Poll title is required'); return; }
    if (!expiresAt) { setError('Expiry date is required'); return; }
    if (new Date(expiresAt) <= new Date()) { setError('Expiry must be in the future'); return; }
    for (let i = 0; i < questions.length; i++) {
      if (!questions[i].questionText.trim()) { setError(`Question ${i + 1} text is required`); return; }
      const type = questions[i].questionType || 'single';
      if (type !== 'text') {
        const emptyOpts = questions[i].options.filter(o => !o.trim());
        if (emptyOpts.length > 0) { setError(`All options in Question ${i + 1} must be filled`); return; }
      }
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

        {/* ── Step 1: Basic Info ─────────────────────────────────────────── */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold shrink-0">1</span>
              <div>
                <CardTitle>Basic Information</CardTitle>
                <CardDescription>Give your poll a title and description</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="title">Title *</Label>
                <span className={`text-xs tabular-nums ${title.length > TITLE_MAX * 0.9 ? 'text-destructive' : 'text-muted-foreground'}`}>
                  {title.length}/{TITLE_MAX}
                </span>
              </div>
              <Input
                id="title"
                placeholder="What do you want to ask?"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={TITLE_MAX}
                required
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="description">Description</Label>
                <span className={`text-xs tabular-nums ${description.length > DESC_MAX * 0.9 ? 'text-destructive' : 'text-muted-foreground'}`}>
                  {description.length}/{DESC_MAX}
                </span>
              </div>
              <Textarea
                id="description"
                placeholder="Add context for your respondents..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={DESC_MAX}
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* ── Step 2: Settings ───────────────────────────────────────────── */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold shrink-0">2</span>
              <div>
                <CardTitle>Settings</CardTitle>
                <CardDescription>Configure response mode and expiry</CardDescription>
              </div>
            </div>
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

            <div className="space-y-3">
              <Label htmlFor="expiry" className="flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-muted-foreground" />
                Expiry Date & Time *
              </Label>

              {/* Quick preset buttons */}
              <div className="flex flex-wrap gap-2">
                {EXPIRY_PRESETS.map(({ label, fn }) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() => setExpiresAt(toLocalISO(fn()))}
                    className="rounded-full border border-border bg-muted/50 px-3 py-1 text-xs font-medium text-muted-foreground transition-colors hover:border-primary hover:bg-primary/10 hover:text-primary"
                  >
                    {label}
                  </button>
                ))}
              </div>

              <Input
                id="expiry"
                type="datetime-local"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
                min={toLocalISO(new Date())}
                required
              />
            </div>
          </CardContent>
        </Card>

        {/* ── Step 3: Questions ──────────────────────────────────────────── */}
        <div>
          <div className="flex items-center gap-3 mb-4">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold shrink-0">3</span>
            <h2 className="text-xl font-semibold">Questions</h2>
          </div>
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
