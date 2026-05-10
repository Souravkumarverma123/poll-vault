import { useState } from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Button } from '@/components/ui/button';
import { Loader2, Send } from 'lucide-react';

export default function ResponseForm({ questions, onSubmit, loading }) {
  const [answers, setAnswers] = useState({});
  const [errors, setErrors] = useState({});

  const handleSelect = (questionId, option) => {
    setAnswers({ ...answers, [questionId]: option });
    if (errors[questionId]) {
      setErrors({ ...errors, [questionId]: null });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = {};
    questions.forEach((q) => {
      if (q.isRequired && !answers[q._id]) {
        newErrors[q._id] = 'This question is required';
      }
    });
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    const formattedAnswers = Object.entries(answers).map(([questionId, selectedOption]) => ({
      questionId,
      selectedOption,
    }));
    onSubmit(formattedAnswers);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {questions.map((q, index) => (
        <Card key={q._id} id={`question-${q._id}`} className={`transition-all ${errors[q._id] ? 'border-destructive/50' : ''}`}>
          <CardHeader className="pb-3">
            <div className="flex items-start gap-2">
              <span className="mt-0.5 text-sm font-medium text-muted-foreground">{index + 1}.</span>
              <h3 className="text-base font-medium">
                {q.questionText}
                {q.isRequired && <span className="ml-1 text-destructive">*</span>}
              </h3>
            </div>
          </CardHeader>
          <CardContent className="pt-0 pl-9">
            <RadioGroup value={answers[q._id] || ''} onValueChange={(v) => handleSelect(q._id, v)}>
              <div className="space-y-2">
                {q.options.map((opt, oIndex) => (
                  <div key={oIndex} className={`flex items-center gap-3 rounded-lg border p-3 cursor-pointer hover:bg-accent/50 transition-all ${answers[q._id] === opt ? 'border-primary bg-primary/5' : ''}`} onClick={() => handleSelect(q._id, opt)}>
                    <RadioGroupItem value={opt} id={`${q._id}-${oIndex}`} />
                    <Label htmlFor={`${q._id}-${oIndex}`} className="flex-1 cursor-pointer text-sm">{opt}</Label>
                  </div>
                ))}
              </div>
            </RadioGroup>
            {errors[q._id] && <p className="mt-2 text-sm text-destructive">{errors[q._id]}</p>}
          </CardContent>
        </Card>
      ))}
      <Button type="submit" size="lg" className="w-full" disabled={loading}>
        {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Submitting...</> : <><Send className="mr-2 h-4 w-4" />Submit Response</>}
      </Button>
    </form>
  );
}
