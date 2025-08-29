import { useState, useCallback } from 'react';

interface DemographicContext {
  department: string;
  role: string;
  tenure: string;
  teamSize: number;
}

interface AIAnalysisResult {
  insights: any[];
  themes: string[];
  sentiment: any[];
}

interface QuestionAdaptation {
  originalQuestion: string;
  adaptedQuestion: string;
  reason: string;
  confidence: number;
}

export function useAI() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analyzeResponses = useCallback(
    async (
      responses: any[],
      context: DemographicContext
    ): Promise<AIAnalysisResult | null> => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch('/api/ai/analyze-responses', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ responses, context }),
        });

        if (!response.ok) {
          throw new Error('Failed to analyze responses');
        }

        const data = await response.json();
        return data.analysis;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Analysis failed');
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const adaptQuestions = useCallback(
    async (
      questionIds: string[],
      context: DemographicContext,
      generateNew: boolean = false
    ): Promise<{
      adaptedQuestions: QuestionAdaptation[];
      newQuestions: any[];
    } | null> => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch('/api/ai/adapt-questions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ questionIds, context, generateNew }),
        });

        if (!response.ok) {
          throw new Error('Failed to adapt questions');
        }

        const data = await response.json();
        return {
          adaptedQuestions: data.adaptedQuestions,
          newQuestions: data.newQuestions,
        };
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Question adaptation failed'
        );
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const analyzeSentiment = useCallback(async (texts: string[]) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/ai/sentiment-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ texts }),
      });

      if (!response.ok) {
        throw new Error('Failed to analyze sentiment');
      }

      const data = await response.json();
      return data;
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Sentiment analysis failed'
      );
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    analyzeResponses,
    adaptQuestions,
    analyzeSentiment,
  };
}
