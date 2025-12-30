import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, GripVertical, HelpCircle } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";

interface Question {
  pergunta: string;
  alternativas: string[];
  resposta_correta: number;
}

interface LessonQuestionsEditorProps {
  questions: Question[];
  onChange: (questions: Question[]) => void;
}

export function LessonQuestionsEditor({ questions, onChange }: LessonQuestionsEditorProps) {
  const [expanded, setExpanded] = useState<number | null>(null);

  const addQuestion = () => {
    const newQuestion: Question = {
      pergunta: '',
      alternativas: ['', '', '', ''],
      resposta_correta: 0
    };
    onChange([...questions, newQuestion]);
    setExpanded(questions.length);
  };

  const removeQuestion = (index: number) => {
    const newQuestions = questions.filter((_, i) => i !== index);
    onChange(newQuestions);
    if (expanded === index) setExpanded(null);
  };

  const updateQuestion = (index: number, field: keyof Question, value: any) => {
    const newQuestions = [...questions];
    newQuestions[index] = { ...newQuestions[index], [field]: value };
    onChange(newQuestions);
  };

  const updateAlternative = (questionIndex: number, altIndex: number, value: string) => {
    const newQuestions = [...questions];
    const newAlternatives = [...newQuestions[questionIndex].alternativas];
    newAlternatives[altIndex] = value;
    newQuestions[questionIndex] = { ...newQuestions[questionIndex], alternativas: newAlternatives };
    onChange(newQuestions);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <HelpCircle className="h-4 w-4 text-muted-foreground" />
          <Label>Perguntas do Quiz (opcional)</Label>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addQuestion}
          className="gap-1"
        >
          <Plus className="h-3 w-3" />
          Adicionar Pergunta
        </Button>
      </div>

      {questions.length === 0 ? (
        <div className="border border-dashed border-border rounded-lg p-6 text-center">
          <HelpCircle className="h-8 w-8 text-muted-foreground/50 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">
            Nenhuma pergunta adicionada.
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Adicione perguntas para criar um quiz ao final da aula.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {questions.map((question, qIndex) => (
            <div
              key={qIndex}
              className={cn(
                "border border-border rounded-lg overflow-hidden transition-all",
                expanded === qIndex ? "bg-muted/30" : "bg-background"
              )}
            >
              {/* Question header */}
              <div
                className="flex items-center gap-2 p-3 cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => setExpanded(expanded === qIndex ? null : qIndex)}
              >
                <GripVertical className="h-4 w-4 text-muted-foreground/50" />
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-medium flex items-center justify-center">
                  {qIndex + 1}
                </span>
                <span className="flex-1 text-sm truncate">
                  {question.pergunta || 'Pergunta sem título...'}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeQuestion(qIndex);
                  }}
                  className="h-7 w-7 text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>

              {/* Expanded content */}
              {expanded === qIndex && (
                <div className="p-4 pt-2 border-t border-border space-y-4">
                  <div className="space-y-2">
                    <Label className="text-xs">Pergunta</Label>
                    <Input
                      value={question.pergunta}
                      onChange={(e) => updateQuestion(qIndex, 'pergunta', e.target.value)}
                      placeholder="Digite a pergunta..."
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs">Alternativas (4 opções)</Label>
                    <RadioGroup
                      value={String(question.resposta_correta)}
                      onValueChange={(value) => updateQuestion(qIndex, 'resposta_correta', parseInt(value))}
                    >
                      {question.alternativas.map((alt, altIndex) => (
                        <div key={altIndex} className="flex items-center gap-2">
                          <RadioGroupItem 
                            value={String(altIndex)} 
                            id={`q${qIndex}-a${altIndex}`}
                            className="flex-shrink-0"
                          />
                          <div className="flex-shrink-0 w-6 h-6 rounded-full bg-muted text-muted-foreground text-xs font-medium flex items-center justify-center">
                            {String.fromCharCode(65 + altIndex)}
                          </div>
                          <Input
                            value={alt}
                            onChange={(e) => updateAlternative(qIndex, altIndex, e.target.value)}
                            placeholder={`Alternativa ${String.fromCharCode(65 + altIndex)}`}
                            className="flex-1"
                          />
                        </div>
                      ))}
                    </RadioGroup>
                    <p className="text-xs text-muted-foreground">
                      Selecione o círculo ao lado da resposta correta.
                    </p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        O quiz será exibido ao usuário após assistir o vídeo ou ler o conteúdo. 
        É opcional e ajuda a fixar o aprendizado.
      </p>
    </div>
  );
}
