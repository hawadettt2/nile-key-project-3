import { HfInference } from '@huggingface/inference';

const apiKey = process.env.HUGGINGFACE_API_KEY;

export const hf = apiKey ? new HfInference(apiKey) : null;

// Default model for text generation
export const DEFAULT_MODEL = 'meta-llama/Meta-Llama-3-8B-Instruct';

// Helper function to format messages for Llama 3 Instruct model
export function formatLlama3Prompt(messages: { role: 'user' | 'assistant' | 'system'; content: string }[]) {
  let prompt = '';
  
  for (const message of messages) {
    if (message.role === 'system') {
      prompt += `<|start_header_id|>system<|end_header_id|>\n${message.content}<|eot_id|>`;
    } else if (message.role === 'user') {
      prompt += `<|start_header_id|>user<|end_header_id|>\n${message.content}<|eot_id|>`;
    } else if (message.role === 'assistant') {
      prompt += `<|start_header_id|>assistant<|end_header_id|>\n${message.content}<|eot_id|>`;
    }
  }
  
  prompt += '<|start_header_id|>assistant<|end_header_id|>\n';
  return prompt;
}
