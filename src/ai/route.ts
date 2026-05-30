import { HfInference } from '@huggingface/inference';

export const maxDuration = 60; // Allow streaming responses up to 60 seconds

export async function POST(req: Request) {
  const apiKey = process.env.HUGGINGFACE_API_KEY;
  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: 'Missing HUGGINGFACE_API_KEY environment variable' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const hf = new HfInference(apiKey);
  const { messages, model = 'meta-llama/Meta-Llama-3-8B-Instruct' } = await req.json();

  const prompt = messages
    .map((m: { role: string; content: string }) => {
      if (m.role === 'user') return `<|start_header_id|>user<|end_header_id|>\n${m.content}<|eot_id|>`;
      if (m.role === 'assistant') return `<|start_header_id|>assistant<|end_header_id|>\n${m.content}<|eot_id|>`;
      if (m.role === 'system') return `<|start_header_id|>system<|end_header_id|>\n${m.content}<|eot_id|>`;
      return '';
    })
    .join('') + '<|start_header_id|>assistant<|end_header_id|>\n';

  try {
    const hfStream = await hf.textGenerationStream({
      model,
      inputs: prompt,
      parameters: {
        max_new_tokens: 2048,
        temperature: 0.7,
        top_p: 0.95,
        repetition_penalty: 1.1,
        return_full_text: false,
      },
    });

    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        try {
          for await (const chunk of hfStream) {
            if (chunk && chunk.token && chunk.token.text) {
              controller.enqueue(encoder.encode(chunk.token.text));
            }
          }
          controller.close();
        } catch (error) {
          controller.error(error);
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (error) {
    console.error('Error in AI route:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to generate response' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
