import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircleQuestion, Send, ChevronDown, ChevronUp, Trash2, BadgeCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useEventQuestions, EventQuestion } from '@/hooks/useEventQuestions';
import { useAuth } from '@/context/AuthContext';
import { formatDistanceToNow } from 'date-fns';

interface EventQAProps {
  eventId: string;
  hostUserId?: string;
}

const QuestionCard = ({ 
  question, 
  hostUserId, 
  onAnswer, 
  onDelete,
  currentUserId 
}: { 
  question: EventQuestion; 
  hostUserId?: string;
  onAnswer: (questionId: string, answer: string, isHost: boolean) => Promise<boolean>;
  onDelete: (questionId: string) => Promise<boolean>;
  currentUserId?: string;
}) => {
  const [showAnswers, setShowAnswers] = useState(question.answers.length > 0);
  const [answerText, setAnswerText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const isHost = currentUserId === hostUserId;
  const isOwnQuestion = currentUserId === question.user_id;

  const handleSubmitAnswer = async () => {
    if (!answerText.trim()) return;
    setIsSubmitting(true);
    const success = await onAnswer(question.id, answerText, isHost);
    if (success) setAnswerText('');
    setIsSubmitting(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl p-4"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <p className="text-foreground font-medium">{question.question}</p>
          <p className="text-xs text-muted-foreground mt-1">
            Asked {formatDistanceToNow(new Date(question.created_at), { addSuffix: true })}
          </p>
        </div>
        {isOwnQuestion && (
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 text-muted-foreground hover:text-destructive"
            onClick={() => onDelete(question.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Answers section */}
      {question.answers.length > 0 && (
        <Button
          variant="ghost"
          size="sm"
          className="mt-3 text-muted-foreground"
          onClick={() => setShowAnswers(!showAnswers)}
        >
          {showAnswers ? <ChevronUp className="h-4 w-4 mr-1" /> : <ChevronDown className="h-4 w-4 mr-1" />}
          {question.answers.length} {question.answers.length === 1 ? 'answer' : 'answers'}
        </Button>
      )}

      <AnimatePresence>
        {showAnswers && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-3 space-y-2 pl-4 border-l-2 border-primary/30">
              {question.answers.map((answer) => (
                <div key={answer.id} className="py-2">
                  <div className="flex items-center gap-2 mb-1">
                    {answer.is_host_answer && (
                      <span className="flex items-center gap-1 text-xs text-primary font-medium">
                        <BadgeCheck className="h-3 w-3" /> Host
                      </span>
                    )}
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(answer.created_at), { addSuffix: true })}
                    </span>
                  </div>
                  <p className="text-sm text-foreground">{answer.answer}</p>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Answer input */}
      {currentUserId && (
        <div className="mt-3 flex gap-2">
          <Textarea
            placeholder={isHost ? "Answer as host..." : "Add your answer..."}
            value={answerText}
            onChange={(e) => setAnswerText(e.target.value)}
            className="min-h-[60px] bg-background/50 border-border/50 resize-none"
          />
          <Button 
            size="icon" 
            onClick={handleSubmitAnswer}
            disabled={!answerText.trim() || isSubmitting}
            className="shrink-0"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      )}
    </motion.div>
  );
};

export const EventQA = ({ eventId, hostUserId }: EventQAProps) => {
  const { questions, loading, askQuestion, answerQuestion, deleteQuestion } = useEventQuestions(eventId);
  const { user } = useAuth();
  const [newQuestion, setNewQuestion] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAskQuestion = async () => {
    if (!newQuestion.trim()) return;
    setIsSubmitting(true);
    const success = await askQuestion(newQuestion);
    if (success) setNewQuestion('');
    setIsSubmitting(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <MessageCircleQuestion className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold text-foreground">Questions & Answers</h3>
        <span className="text-sm text-muted-foreground">({questions.length})</span>
      </div>

      {/* Ask question input */}
      <div className="bg-card/30 backdrop-blur-sm border border-border/50 rounded-xl p-4">
        <Textarea
          placeholder="Ask about dress code, vibe, capacity, entrance fee..."
          value={newQuestion}
          onChange={(e) => setNewQuestion(e.target.value)}
          className="min-h-[80px] bg-background/50 border-border/50 resize-none mb-3"
        />
        <div className="flex justify-end">
          <Button 
            onClick={handleAskQuestion}
            disabled={!newQuestion.trim() || isSubmitting || !user}
          >
            <Send className="h-4 w-4 mr-2" />
            {user ? 'Ask Question' : 'Sign in to ask'}
          </Button>
        </div>
      </div>

      {/* Questions list */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="bg-card/30 rounded-xl p-4 animate-pulse">
              <div className="h-4 bg-muted rounded w-3/4 mb-2" />
              <div className="h-3 bg-muted rounded w-1/4" />
            </div>
          ))}
        </div>
      ) : questions.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <MessageCircleQuestion className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p>No questions yet. Be the first to ask!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {questions.map((question) => (
            <QuestionCard
              key={question.id}
              question={question}
              hostUserId={hostUserId}
              onAnswer={answerQuestion}
              onDelete={deleteQuestion}
              currentUserId={user?.id}
            />
          ))}
        </div>
      )}
    </div>
  );
};
