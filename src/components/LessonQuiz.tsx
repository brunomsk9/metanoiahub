import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, XCircle, HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface Question {
  pergunta: string;
  alternativas: string[];
  resposta_correta: number;
}

interface LessonQuizProps {
  questions: Question[];
  onComplete: () => void;
  lessonTitle: string;
}

export function LessonQuiz({ questions, onComplete, lessonTitle }: LessonQuizProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [showResult, setShowResult] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  if (!questions || questions.length === 0) {
    return null;
  }

  const currentQuestion = questions[currentIndex];
  const isLastQuestion = currentIndex === questions.length - 1;
  const hasSelectedAnswer = selectedAnswers[currentIndex] !== undefined;

  const handleSelectAnswer = (answerIndex: number) => {
    if (submitted) return;
    setSelectedAnswers(prev => ({
      ...prev,
      [currentIndex]: answerIndex
    }));
  };

  const handleNext = () => {
    if (isLastQuestion) {
      setSubmitted(true);
      setShowResult(true);
    } else {
      setCurrentIndex(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    setCurrentIndex(prev => Math.max(0, prev - 1));
  };

  const calculateScore = () => {
    let correct = 0;
    questions.forEach((q, idx) => {
      if (selectedAnswers[idx] === q.resposta_correta) {
        correct++;
      }
    });
    return correct;
  };

  const getAnswerStatus = (questionIndex: number, answerIndex: number) => {
    if (!submitted) return null;
    const question = questions[questionIndex];
    const userAnswer = selectedAnswers[questionIndex];
    
    if (answerIndex === question.resposta_correta) {
      return 'correct';
    }
    if (answerIndex === userAnswer && userAnswer !== question.resposta_correta) {
      return 'incorrect';
    }
    return null;
  };

  if (showResult) {
    const score = calculateScore();
    const percentage = Math.round((score / questions.length) * 100);
    const passed = percentage >= 60;

    return (
      <Card className="border-border bg-card">
        <CardHeader className="text-center pb-2">
          <div className={cn(
            "mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-2",
            passed ? "bg-emerald-500/20" : "bg-amber-500/20"
          )}>
            {passed ? (
              <CheckCircle2 className="w-8 h-8 text-emerald-500" />
            ) : (
              <HelpCircle className="w-8 h-8 text-amber-500" />
            )}
          </div>
          <CardTitle className="text-lg">
            {passed ? "Parabéns!" : "Continue aprendendo!"}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <div>
            <p className="text-3xl font-bold text-foreground">{score}/{questions.length}</p>
            <p className="text-sm text-muted-foreground">respostas corretas ({percentage}%)</p>
          </div>
          
          {/* Review answers */}
          <div className="text-left space-y-3 pt-4 border-t border-border">
            {questions.map((q, qIdx) => (
              <div key={qIdx} className="space-y-1">
                <p className="text-sm font-medium flex items-start gap-2">
                  {selectedAnswers[qIdx] === q.resposta_correta ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                  )}
                  {q.pergunta}
                </p>
                <p className="text-xs text-muted-foreground pl-6">
                  Resposta correta: {q.alternativas[q.resposta_correta]}
                </p>
              </div>
            ))}
          </div>

          <Button onClick={onComplete} className="w-full mt-4">
            {passed ? "Concluir Aula" : "Continuar mesmo assim"}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            Pergunta {currentIndex + 1} de {questions.length}
          </span>
          <span className="text-xs text-primary font-medium">
            Quiz: {lessonTitle}
          </span>
        </div>
        <CardTitle className="text-base mt-2">
          {currentQuestion.pergunta}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          {currentQuestion.alternativas.map((alt, idx) => {
            const status = getAnswerStatus(currentIndex, idx);
            return (
              <button
                key={idx}
                onClick={() => handleSelectAnswer(idx)}
                disabled={submitted}
                className={cn(
                  "w-full text-left p-3 rounded-lg border transition-all",
                  selectedAnswers[currentIndex] === idx
                    ? "border-primary bg-primary/10"
                    : "border-border hover:border-primary/50 hover:bg-muted/50",
                  status === 'correct' && "border-emerald-500 bg-emerald-500/10",
                  status === 'incorrect' && "border-red-500 bg-red-500/10"
                )}
              >
                <div className="flex items-center gap-3">
                  <span className={cn(
                    "w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium",
                    selectedAnswers[currentIndex] === idx
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground",
                    status === 'correct' && "bg-emerald-500 text-white",
                    status === 'incorrect' && "bg-red-500 text-white"
                  )}>
                    {String.fromCharCode(65 + idx)}
                  </span>
                  <span className="text-sm">{alt}</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Progress dots */}
        <div className="flex items-center justify-center gap-1.5 pt-2">
          {questions.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className={cn(
                "w-2 h-2 rounded-full transition-all",
                idx === currentIndex
                  ? "bg-primary w-4"
                  : selectedAnswers[idx] !== undefined
                    ? "bg-primary/50"
                    : "bg-muted"
              )}
            />
          ))}
        </div>

        <div className="flex gap-2 pt-2">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentIndex === 0}
            className="flex-1"
          >
            Anterior
          </Button>
          <Button
            onClick={handleNext}
            disabled={!hasSelectedAnswer}
            className="flex-1"
          >
            {isLastQuestion ? "Ver Resultado" : "Próxima"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
