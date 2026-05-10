import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, Plus, GripVertical, CheckSquare, Circle, AlignLeft } from 'lucide-react';

const QUESTION_TYPES = [
  { value: 'single', label: 'Single Choice', icon: Circle, desc: 'One answer only' },
  { value: 'multiple', label: 'Multiple Choice', icon: CheckSquare, desc: 'Select all that apply' },
  { value: 'text', label: 'Open Text', icon: AlignLeft, desc: 'Free-text response' },
];

export default function QuestionBuilder({ questions, setQuestions }) {
  const addQuestion = () => {
    setQuestions([...questions, { questionText: '', questionType: 'single', options: ['', ''], isRequired: true }]);
  };

  const removeQuestion = (index) => {
    if (questions.length <= 1) return;
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const updateQuestion = (index, field, value) => {
    const updated = [...questions];
    updated[index] = { ...updated[index], [field]: value };
    // When switching to text type, clear options. When switching away, ensure 2 options.
    if (field === 'questionType') {
      if (value === 'text') {
        updated[index].options = [];
      } else if (!updated[index].options || updated[index].options.length < 2) {
        updated[index].options = ['', ''];
      }
    }
    setQuestions(updated);
  };

  const addOption = (qIndex) => {
    const updated = [...questions];
    updated[qIndex] = { ...updated[qIndex], options: [...updated[qIndex].options, ''] };
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
      {questions.map((q, qIndex) => {
        const typeInfo = QUESTION_TYPES.find(t => t.value === (q.questionType || 'single'));
        const TypeIcon = typeInfo?.icon || Circle;

        return (
          <Card key={qIndex} className="border-border/50 animate-fade-in">
            <CardHeader className="pb-3">
              <div className="flex items-start gap-3">
                <GripVertical className="mt-2.5 h-5 w-5 shrink-0 text-muted-foreground/50" />
                <div className="flex-1 space-y-3">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span className="text-sm font-medium text-muted-foreground">Question {qIndex + 1}</span>
                    <div className="flex items-center gap-3">
                      {/* Question Type Selector */}
                      <Select
                        value={q.questionType || 'single'}
                        onValueChange={(val) => updateQuestion(qIndex, 'questionType', val)}
                      >
                        <SelectTrigger className="h-8 w-44 text-xs">
                          <TypeIcon className="mr-1.5 h-3.5 w-3.5 shrink-0" />
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {QUESTION_TYPES.map(t => (
                            <SelectItem key={t.value} value={t.value}>
                              <div className="flex items-center gap-2">
                                <t.icon className="h-3.5 w-3.5 text-muted-foreground" />
                                <span>{t.label}</span>
                                <span className="text-xs text-muted-foreground">— {t.desc}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      {/* Required Toggle */}
                      <div className="flex items-center gap-2">
                        <Switch
                          id={`required-${qIndex}`}
                          checked={q.isRequired}
                          onCheckedChange={(checked) => updateQuestion(qIndex, 'isRequired', checked)}
                        />
                        <Label htmlFor={`required-${qIndex}`} className="text-xs text-muted-foreground">Required</Label>
                      </div>

                      {questions.length > 1 && (
                        <Button
                          variant="ghost" size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={() => removeQuestion(qIndex)}
                          type="button"
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

            {/* Options — only for single/multiple types */}
            {(q.questionType || 'single') !== 'text' && (
              <CardContent className="pl-14 pt-0">
                <div className="space-y-2">
                  {q.options.map((opt, oIndex) => (
                    <div key={oIndex} className="flex items-center gap-2">
                      {/* Visual indicator of question type */}
                      {(q.questionType || 'single') === 'single'
                        ? <div className="h-4 w-4 shrink-0 rounded-full border-2 border-muted-foreground/30" />
                        : <div className="h-4 w-4 shrink-0 rounded border-2 border-muted-foreground/30" />
                      }
                      <Input
                        placeholder={`Option ${oIndex + 1}`}
                        value={opt}
                        onChange={(e) => updateOption(qIndex, oIndex, e.target.value)}
                        className="text-sm"
                      />
                      {q.options.length > 2 && (
                        <Button
                          variant="ghost" size="icon"
                          className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                          onClick={() => removeOption(qIndex, oIndex)}
                          type="button"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button
                    variant="ghost" size="sm" type="button"
                    className="mt-1 text-muted-foreground"
                    onClick={() => addOption(qIndex)}
                  >
                    <Plus className="mr-1 h-3.5 w-3.5" />Add option
                  </Button>
                </div>
              </CardContent>
            )}

            {/* Text question preview */}
            {(q.questionType || 'single') === 'text' && (
              <CardContent className="pl-14 pt-0">
                <div className="rounded-md border border-dashed border-muted-foreground/30 bg-muted/30 px-3 py-2">
                  <p className="text-xs text-muted-foreground italic">Respondents will type their answer here…</p>
                </div>
              </CardContent>
            )}
          </Card>
        );
      })}

      <Button
        variant="outline"
        className="w-full border-dashed"
        onClick={addQuestion}
        type="button"
      >
        <Plus className="mr-2 h-4 w-4" />Add Question
      </Button>
    </div>
  );
}
