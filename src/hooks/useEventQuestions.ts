import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';

export interface EventQuestion {
  id: string;
  event_id: string;
  user_id: string;
  question: string;
  created_at: string;
  user_display_name?: string;
  answers: EventAnswer[];
}

export interface EventAnswer {
  id: string;
  question_id: string;
  user_id: string;
  answer: string;
  is_host_answer: boolean;
  created_at: string;
  user_display_name?: string;
}

export const useEventQuestions = (eventId: string) => {
  const [questions, setQuestions] = useState<EventQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchQuestions = useCallback(async () => {
    if (!eventId) return;
    
    try {
      // Fetch questions
      const { data: questionsData, error: questionsError } = await supabase
        .from('event_questions')
        .select('*')
        .eq('event_id', eventId)
        .order('created_at', { ascending: false });

      if (questionsError) throw questionsError;

      // Fetch answers for all questions
      const questionIds = questionsData?.map(q => q.id) || [];
      let answersData: any[] = [];
      
      if (questionIds.length > 0) {
        const { data, error: answersError } = await supabase
          .from('event_answers')
          .select('*')
          .in('question_id', questionIds)
          .order('created_at', { ascending: true });
        
        if (answersError) throw answersError;
        answersData = data || [];
      }

      // Fetch user display names for questions
      const userIds = [...new Set([
        ...(questionsData?.map(q => q.user_id) || []),
        ...answersData.map(a => a.user_id)
      ])];

      let profilesMap: Record<string, string> = {};
      if (userIds.length > 0) {
        // For now, we'll use a simple approach - in production you'd want a view or RPC
        // Since we can't query other users' profiles, we'll show "Anonymous" for others
        if (user) {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('id, display_name')
            .eq('id', user.id)
            .single();
          
          if (profileData) {
            profilesMap[profileData.id] = profileData.display_name || 'Anonymous';
          }
        }
      }

      // Combine data
      const formattedQuestions: EventQuestion[] = (questionsData || []).map(q => ({
        ...q,
        user_display_name: profilesMap[q.user_id] || 'User',
        answers: answersData
          .filter(a => a.question_id === q.id)
          .map(a => ({
            ...a,
            user_display_name: profilesMap[a.user_id] || 'User'
          }))
      }));

      setQuestions(formattedQuestions);
    } catch (error) {
      console.error('Error fetching questions:', error);
    } finally {
      setLoading(false);
    }
  }, [eventId, user]);

  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  const askQuestion = async (question: string) => {
    if (!user) {
      toast.error('Please sign in to ask a question');
      return false;
    }

    try {
      const { error } = await supabase
        .from('event_questions')
        .insert({
          event_id: eventId,
          user_id: user.id,
          question: question.trim()
        });

      if (error) throw error;

      toast.success('Question posted!');
      fetchQuestions();
      return true;
    } catch (error) {
      console.error('Error posting question:', error);
      toast.error('Failed to post question');
      return false;
    }
  };

  const answerQuestion = async (questionId: string, answer: string, isHostAnswer: boolean = false) => {
    if (!user) {
      toast.error('Please sign in to answer');
      return false;
    }

    try {
      const { error } = await supabase
        .from('event_answers')
        .insert({
          question_id: questionId,
          user_id: user.id,
          answer: answer.trim(),
          is_host_answer: isHostAnswer
        });

      if (error) throw error;

      toast.success('Answer posted!');
      fetchQuestions();
      return true;
    } catch (error) {
      console.error('Error posting answer:', error);
      toast.error('Failed to post answer');
      return false;
    }
  };

  const deleteQuestion = async (questionId: string) => {
    try {
      const { error } = await supabase
        .from('event_questions')
        .delete()
        .eq('id', questionId);

      if (error) throw error;

      toast.success('Question deleted');
      fetchQuestions();
      return true;
    } catch (error) {
      console.error('Error deleting question:', error);
      toast.error('Failed to delete question');
      return false;
    }
  };

  return {
    questions,
    loading,
    askQuestion,
    answerQuestion,
    deleteQuestion,
    refetch: fetchQuestions
  };
};
