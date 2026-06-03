import { HfInference } from '@huggingface/inference';

export const maxDuration = 60; // Allow streaming responses up to 60 seconds

const GLOBAL_GUARDRAILS = [
  'أنت مساعد داخلي لشركة مفتاح النيل.',
  'لا تختلق حقائق أو أسماء أو أرقام أو مصادر أو مواقع أو أسعار أو فرص غير موجودة في البيانات المقدمة.',
  'اعتمد فقط على النصوص الموجودة في الرسائل أو في تعليمات النظام التي يرسلها التطبيق.',
  'إذا كان السؤال يتطلب معلومة خارج النص المقدم، فقل بوضوح إنك لا تستطيع التحقق منها واطلب مصدرًا موثقًا أو سجلًا من قاعدة بيانات الشركة.',
  'في الترجمة والصياغة والتحرير، التزم فقط بالنص الذي يقدمه المستخدم.',
  'لا تذكر قدرات أو تكاملات غير مؤكدة.',
].join(' ');

function formatPrompt(messages: { role: 'user' | 'assistant' | 'system'; content: string }[]) {
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

export async function POST(req: Request) {
  const apiKey = process.env.HUGGINGFACE_API_KEY;
  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: 'Missing HUGGINGFACE_API_KEY environment variable' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const hf = new HfInference(apiKey);
  const body = await req.json().catch(() => ({}));
  const messages = Array.isArray(body?.messages) ? body.messages : [];
  const model = typeof body?.model === 'string' && body.model.trim() ? body.model : 'meta-llama/Meta-Llama-3-8B-Instruct';
  const system = typeof body?.system === 'string' ? body.system.trim() : '';

  const prompt = formatPrompt([
    { role: 'system', content: GLOBAL_GUARDRAILS },
    ...(system ? [{ role: 'system' as const, content: system }] : []),
    ...messages,
  ]);

  try {
    const hfStream = await hf.textGenerationStream({
      model,
      inputs: prompt,
      parameters: {
        max_new_tokens: 1024,
        temperature: 0.2,
        top_p: 0.85,
        repetition_penalty: 1.08,
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
