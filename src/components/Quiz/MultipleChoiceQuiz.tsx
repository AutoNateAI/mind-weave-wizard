import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, XCircle, Clock } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

type Question = {
  id: string;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_option: string;
};

type UserAnswer = {
  question_id: string;
  selected_option: string;
  is_correct: boolean;
};

type MultipleChoiceQuizProps = {
  sessionNumber: number;
  lectureNumber: number;
};

export function MultipleChoiceQuiz({ sessionNumber, lectureNumber }: MultipleChoiceQuizProps) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [userAnswers, setUserAnswers] = useState<UserAnswer[]>([]);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchQuestions();
    fetchUserAnswers();
  }, [sessionNumber, lectureNumber]);

  const fetchQuestions = async () => {
    try {
      const { data, error } = await supabase
        .from('multiple_choice_questions')
        .select('*')
        .eq('session_number', sessionNumber)
        .eq('lecture_number', lectureNumber)
        .order('created_at');

      if (error) throw error;
      setQuestions(data || []);
    } catch (error) {
      console.error('Error fetching questions:', error);
      toast({
        title: "Error loading questions",
        description: "Please try again later.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchUserAnswers = async () => {
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session?.user) return;

      const { data, error } = await supabase
        .from('user_quiz_answers')
        .select('*')
        .eq('user_id', session.session.user.id);

      if (error) throw error;
      setUserAnswers(data || []);
      
      // Set selected answers for questions already answered
      const answersMap: Record<string, string> = {};
      data?.forEach(answer => {
        answersMap[answer.question_id] = answer.selected_option;
      });
      setSelectedAnswers(answersMap);
    } catch (error) {
      console.error('Error fetching user answers:', error);
    }
  };

  const handleAnswerSelect = async (questionId: string, option: string) => {
    // Log the interaction immediately when clicked
    try {
      const { data: session } = await supabase.auth.getSession();
      if (session.session?.user) {
        const question = questions.find(q => q.id === questionId);
        const isCorrect = question ? option === question.correct_option : false;

        // Log every click interaction
        await supabase
          .from('multiple_choice_interactions')
          .insert({
            user_id: session.session.user.id,
            question_id: questionId,
            selected_option: option,
            is_correct: isCorrect
          });
      }
    } catch (error) {
      console.error('Error logging interaction:', error);
    }

    // Update the selected answer in the UI
    setSelectedAnswers(prev => ({
      ...prev,
      [questionId]: option
    }));
  };

  const handleSubmit = async (questionId: string) => {
    if (!selectedAnswers[questionId]) return;

    setSubmitting(true);
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session?.user) {
        toast({
          title: "Please sign in",
          description: "You need to be signed in to submit answers.",
          variant: "destructive"
        });
        return;
      }

      const question = questions.find(q => q.id === questionId);
      if (!question) return;

      const isCorrect = selectedAnswers[questionId] === question.correct_option;

      const { error } = await supabase
        .from('user_quiz_answers')
        .upsert({
          user_id: session.session.user.id,
          question_id: questionId,
          selected_option: selectedAnswers[questionId],
          is_correct: isCorrect
        });

      if (error) throw error;

      // Update local state
      setUserAnswers(prev => {
        const filtered = prev.filter(a => a.question_id !== questionId);
        return [...filtered, {
          question_id: questionId,
          selected_option: selectedAnswers[questionId],
          is_correct: isCorrect
        }];
      });

      toast({
        title: isCorrect ? "Correct!" : "Not quite right",
        description: isCorrect 
          ? "Well done! You got it right." 
          : `The correct answer is ${question.correct_option}`,
        variant: isCorrect ? "default" : "destructive"
      });
    } catch (error) {
      console.error('Error submitting answer:', error);
      toast({
        title: "Error submitting answer",
        description: "Please try again.",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Clock className="w-6 h-6 animate-spin mr-2" />
        <span>Loading questions...</span>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>No quiz questions available for this lecture yet.</p>
        <p className="text-sm mt-2">Check back later!</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold mb-2">Knowledge Check</h3>
        <p className="text-sm text-muted-foreground">
          Test your understanding of the concepts from this lecture
        </p>
      </div>

      {questions.map((question, index) => {
        const userAnswer = userAnswers.find(a => a.question_id === question.id);
        const isAnswered = !!userAnswer;
        const selectedOption = selectedAnswers[question.id];

        return (
          <Card key={question.id} className="glass">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <span className="bg-primary/10 text-primary rounded-full w-6 h-6 flex items-center justify-center text-sm font-semibold">
                  {index + 1}
                </span>
                {question.question_text}
                {isAnswered && (
                  userAnswer.is_correct ? (
                    <CheckCircle className="w-5 h-5 text-green-500 ml-auto" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-500 ml-auto" />
                  )
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {['A', 'B', 'C', 'D'].map((option) => {
                const optionText = question[`option_${option.toLowerCase()}` as keyof Question] as string;
                const isSelected = selectedOption === option;
                const isCorrect = option === question.correct_option;
                const showResult = isAnswered;

                return (
                  <button
                    key={option}
                    onClick={() => !isAnswered && handleAnswerSelect(question.id, option)}
                    disabled={isAnswered}
                    className={`w-full text-left p-3 rounded-lg border transition-all ${
                      isSelected 
                        ? showResult 
                          ? isCorrect 
                            ? 'border-green-500 bg-green-50 dark:bg-green-900/50' 
                            : 'border-red-500 bg-red-50 dark:bg-red-950/30'
                          : 'border-primary bg-primary/5'
                        : showResult && isCorrect
                          ? 'border-green-500 bg-green-50 dark:bg-green-900/50'
                          : 'border-border hover:border-primary/50'
                    } ${isAnswered ? 'cursor-default' : 'cursor-pointer hover:bg-accent/50'}`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-sm font-semibold ${
                        isSelected
                          ? showResult
                            ? isCorrect
                              ? 'border-green-500 bg-green-500 text-white'
                              : 'border-red-500 bg-red-500 text-white'
                            : 'border-primary bg-primary text-primary-foreground'
                          : showResult && isCorrect
                            ? 'border-green-500 bg-green-500 text-white'
                            : 'border-muted-foreground'
                      }`}>
                        {option}
                      </span>
                      <span className="flex-1">{optionText}</span>
                      {showResult && isSelected && !isCorrect && (
                        <XCircle className="w-4 h-4 text-red-500" />
                      )}
                      {showResult && isCorrect && (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      )}
                    </div>
                  </button>
                );
              })}

              {!isAnswered && selectedOption && (
                <Button 
                  onClick={() => handleSubmit(question.id)}
                  disabled={submitting}
                  className="w-full mt-4"
                >
                  {submitting ? "Submitting..." : "Submit Answer"}
                </Button>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}