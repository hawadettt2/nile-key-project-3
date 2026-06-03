'use client';

import { useState, useCallback } from 'react';
import { useLanguage } from '@/context/language-provider';

interface UseAICompletionOptions {
  apiEndpoint?: string;
  model?: string;
  systemPrompt?: string;
}

export function useAICompletion(options?: UseAICompletionOptions) {
  const { language } = useLanguage();
  const isRTL = language === 'ar';

  const [input, setInput] = useState('');
  const [completion, setCompletion] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setInput(e.target.value);
  };

  const complete = useCallback(async (prompt: string) => {
    setIsLoading(true);
    setError(null);
    setCompletion('');

    try {
      const response = await fetch(options?.apiEndpoint || '/api/ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [
            {
              role: 'user',
              content: prompt,
            },
          ],
          model: options?.model || 'meta-llama/Meta-Llama-3-8B-Instruct',
          system: options?.systemPrompt || (isRTL 
            ? 'أنت مساعد ذكي يتحدث العربية بطلاقة. كن مفيداً ومختصراً.'
            : 'You are a helpful AI assistant. Be concise and helpful.'),
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          setCompletion((prev) => prev + chunk);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setIsLoading(false);
    }
  }, [options?.apiEndpoint, options?.model, options?.systemPrompt, isRTL]);

  const handleSubmit = (e?: { preventDefault?: () => void }) => {
    e?.preventDefault?.();
    if (input.trim()) {
      complete(input);
    }
  };

  const stop = () => {
    setIsLoading(false);
  };

  return {
    completion,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    error,
    stop,
    setInput,
    complete,
    isRTL,
  };
}
