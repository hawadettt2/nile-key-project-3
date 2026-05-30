
  import { HfInference } from '@huggingface/inference';
  import { buildTradeKnowledgeSummary, searchTradeInsights } from '@/lib/trade-intelligence';

  export const maxDuration = 60;

  export async function POST(req: Request) {
    try {
      const body = await req.json().catch(() => ({}));
      const query = typeof body?.query === 'string' ? body.query : '';
      const summary = buildTradeKnowledgeSummary(query);

      const apiKey = process.env.HUGGINGFACE_API_KEY;
      if (!apiKey) {
        return Response.json({
          mode: 'heuristic',
          summary,
          insights: summary.topInsights,
        });
      }

      const hf = new HfInference(apiKey);
      const context = searchTradeInsights(query, 10)
        .map((site, index) => `${index + 1}. ${site.title}\nالمجال: ${site.main_category}\nالموثوقية: ${site.credibility_score}\nالملخص: ${site.description}\nالفرصة: ${site.ai_analysis_and_opportunities}`)
        .join('\n\n');

      const prompt = [
        'أنت محلل تجارة دولية لشركة تصدير مصرية كبيرة. اعتمد فقط على المصادر التالية.',
        'اكتب جوابًا عمليًا ومباشرًا يتضمن: الفرص القابلة للتنفيذ، المخاطر، وأول 3 خطوات مقترحة.',
        `سؤال المستخدم: ${query || 'استعراض عام لفرص التصدير'}`,
        'المصادر:',
        context,
      ].join('\n\n');

      const generated = await hf.textGeneration({
        model: 'meta-llama/Meta-Llama-3-8B-Instruct',
        inputs: prompt,
        parameters: {
          max_new_tokens: 500,
          temperature: 0.3,
          top_p: 0.9,
          return_full_text: false,
        },
      });

      return Response.json({
        mode: 'ai',
        summary,
        aiBrief: generated.generated_text ?? '',
        insights: summary.topInsights,
      });
    } catch (error: any) {
      console.error('trade-intelligence route error', error);
      return Response.json(
        { error: error?.message || 'Failed to build trade intelligence summary' },
        { status: 500 }
      );
    }
  }
