import { useState } from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Loader2, Send } from 'lucide-react';

export default function ResponseForm({ questions, onSubmit, loading }) {
  const [answers, setAnswers] = useState({});
  const [errors, setErrors] = useState({});

  const handleSingle = (questionId, option) => {
    setAnswers(prev => ({ ...prev, [questionId]: { selectedOption: option } }));
    if (errors[questionId]) setErrors(prev => ({ ...prev, [questionId]: null }));
  };

  const handleMultiple = (questionId, option, checked) => {
    setAnswers(prev => {
      const current = prev[questionId]?.selectedOptions || [];
      const updated = checked ? [...current, option] : current.filter(o => o !== option);
      return { ...prev, [questionId]: { selectedOptions: updated } };
    });
    if (errors[questionId]) setErrors(prev => ({ ...prev, [questionId]: null }));
  };

  const handleText = (questionId, value) => {
    setAnswers(prev => ({ ...prev, [questionId]: { textAnswer: value } }));
    if (errors[questionId]) setErrors(prev => ({ ...prev, [questionId]: null }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = {};

    questions.forEach((q) => {
      if (!q.isRequired) return;
      const ans = answers[q._id];
      const type = q.questionType || 'single';

      if (!ans) { newErrors[q._id] = 'This question is required'; return; }
      if (type === 'single' && !ans.selectedOption) { newErrors[q._id] = 'Please select an option'; return; }
      if (type === 'multiple' && (!ans.selectedOptions || ans.selectedOptions.length === 0)) {
        newErrors[q._id] = 'Please select at least one option'; return;
      }
      if (type === 'text' && !ans.textAnswer?.trim()) { newErrors[q._id] = 'Please enter your answer'; return; }
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      
      // Scroll to the first error
      const firstErrorId = Object.keys(newErrors)[0];
      const element = document.getElementById(`question-${firstErrorId}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      
      return;
    }

    // Format answers for API
    const formattedAnswers = questions
      .filter(q => answers[q._id])
      .map(q => ({
        questionId: q._id,
        selectedOption: answers[q._id]?.selectedOption || null,
        selectedOptions: answers[q._id]?.selectedOptions || [],
        textAnswer: answers[q._id]?.textAnswer || null,
      }));

    onSubmit(formattedAnswers);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {questions.map((q, index) => {
        const type = q.questionType || 'single';
        const ans = answers[q._id];
        const hasError = !!errors[q._id];

        return (
          <Card key={q._id} id={`question-${q._id}`} className={`transition-all ${hasError ? 'border-destructive/50' : ''}`}>
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
              {/* Single choice */}
              {type === 'single' && (
                <RadioGroup value={ans?.selectedOption || ''} onValueChange={(v) => handleSingle(q._id, v)}>
                  <div className="space-y-2">
                    {q.options.map((opt, oIndex) => (
                      <div
                        key={oIndex}
                        className={`flex items-center gap-3 rounded-xl border-2 p-4 cursor-pointer hover:bg-accent/50 transition-all ${
                          ans?.selectedOption === opt
                            ? 'border-primary bg-primary/10 shadow-sm'
                            : 'border-transparent bg-muted/30'
                        }`}
                        onClick={() => handleSingle(q._id, opt)}
                      >
                        <RadioGroupItem value={opt} id={`${q._id}-${oIndex}`} />
                        <Label htmlFor={`${q._id}-${oIndex}`} className="flex-1 cursor-pointer text-sm">{opt}</Label>
                      </div>
                    ))}
                  </div>
                </RadioGroup>
              )}

              {/* Multiple choice */}
              {type === 'multiple' && (
                <div className="space-y-2">
                  {q.options.map((opt, oIndex) => {
                    const isChecked = ans?.selectedOptions?.includes(opt) || false;
                    return (
                      <div
                        key={oIndex}
                        className={`flex items-center gap-3 rounded-xl border-2 p-4 cursor-pointer hover:bg-accent/50 transition-all ${
                          isChecked
                            ? 'border-primary bg-primary/10 shadow-sm'
                            : 'border-transparent bg-muted/30'
                        }`}
                        onClick={() => handleMultiple(q._id, opt, !isChecked)}
                      >
                        <Checkbox
                          id={`${q._id}-${oIndex}`}
                          checked={isChecked}
                          onCheckedChange={(checked) => handleMultiple(q._id, opt, !!checked)}
                        />
                        <Label htmlFor={`${q._id}-${oIndex}`} className="flex-1 cursor-pointer text-sm">{opt}</Label>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Open text */}
              {type === 'text' && (
                <Textarea
                  placeholder="Type your answer here..."
                  value={ans?.textAnswer || ''}
                  onChange={(e) => handleText(q._id, e.target.value)}
                  rows={4}
                  className="resize-none"
                />
              )}

              {hasError && <p className="mt-2 text-sm text-destructive">{errors[q._id]}</p>}
            </CardContent>
          </Card>
        );
      })}

      <Button type="submit" size="lg" className="w-full" disabled={loading}>
        {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Submitting...</> : <><Send className="mr-2 h-4 w-4" />Submit Response</>}
      </Button>
    </form>
  );
}
