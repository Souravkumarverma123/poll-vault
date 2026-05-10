import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Trash2, Plus, GripVertical } from 'lucide-react';

export default function QuestionBuilder({ questions, setQuestions }) {
  const addQuestion = () => {
    setQuestions([
      ...questions,
      { questionText: '', options: ['', ''], isRequired: true },
    ]);
  };

  const removeQuestion = (index) => {
    if (questions.length <= 1) return;
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const updateQuestion = (index, field, value) => {
    const updated = [...questions];
    updated[index] = { ...updated[index], [field]: value };
    setQuestions(updated);
  };

  const addOption = (qIndex) => {
    const updated = [...questions];
    updated[qIndex] = {
      ...updated[qIndex],
      options: [...updated[qIndex].options, ''],
    };
    setQuestions(updated);
  };

  const removeOption = (qIndex, oIndex) => {
    const updated = [...questions];
    if (updated[qIndex].options.length <= 2) return;
    updated[qIndex] = {
      ...updated[qIndex],
      options: updated[qIndex].options.filter((_, i) => i !== oIndex),
    };
    setQuestions(updated);
  };

  const updateOption = (qIndex, oIndex, value) => {
    const updated = [...questions];
    const newOptions = [...updated[qIndex].options];
    newOptions[oIndex] = value;
    updated[qIndex] = { ...updated[qIndex], options: newOptions };
    setQuestions(updated);
  };

  return (
    <div className="space-y-4">
      {questions.map((q, qIndex) => (
        <Card key={qIndex} className="border-border/50 animate-fade-in">
          <CardHeader className="pb-3">
            <div className="flex items-start gap-3">
              <GripVertical className="mt-2.5 h-5 w-5 shrink-0 text-muted-foreground/50" />
              <div className="flex-1 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium text-muted-foreground">
                    Question {qIndex + 1}
                  </span>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <Switch
                        id={`required-${qIndex}`}
                        checked={q.isRequired}
                        onCheckedChange={(checked) => updateQuestion(qIndex, 'isRequired', checked)}
                      />
                      <Label htmlFor={`required-${qIndex}`} className="text-xs text-muted-foreground">
                        Required
                      </Label>
                    </div>
                    {questions.length > 1 && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => removeQuestion(qIndex)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
                <Input
                  placeholder="Enter your question..."
                  value={q.questionText}
                  onChange={(e) => updateQuestion(qIndex, 'questionText', e.target.value)}
                  className="text-base"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="pl-14 pt-0">
            <div className="space-y-2">
              {q.options.map((opt, oIndex) => (
                <div key={oIndex} className="flex items-center gap-2">
                  <div className="h-4 w-4 shrink-0 rounded-full border-2 border-muted-foreground/30" />
                  <Input
                    placeholder={`Option ${oIndex + 1}`}
                    value={opt}
                    onChange={(e) => updateOption(qIndex, oIndex, e.target.value)}
                    className="text-sm"
                  />
                  {q.options.length > 2 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                      onClick={() => removeOption(qIndex, oIndex)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              ))}
              <Button
                variant="ghost"
                size="sm"
                className="mt-1 text-muted-foreground"
                onClick={() => addOption(qIndex)}
              >
                <Plus className="mr-1 h-3.5 w-3.5" />
                Add option
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
      <Button
        variant="outline"
        className="w-full border-dashed"
        onClick={addQuestion}
      >
        <Plus className="mr-2 h-4 w-4" />
        Add Question
      </Button>
    </div>
  );
}
