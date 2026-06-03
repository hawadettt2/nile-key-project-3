import { HfInference } from '@huggingface/inference';
import { buildTradeKnowledgeSummary, searchTradeInsights } from '@/lib/trade-intelligence';

export const maxDuration = 60;

const NO_FABRICATION_PROMPT = [
  'أنت محلل تجارة دولية داخلي لشركة مفتاح النيل.',
  'اعتمد فقط على المصادر المدرجة أدناه وعلى ما يقدمه المستخدم صراحة.',
  'لا تخترع أسماء مواقع أو شركات أو أرقام أو نسب أو فرص أو تشريعات أو أسعار غير موجودة في المصادر.',
  'إذا كانت المصادر غير كافية، اذكر ذلك بوضوح وقدم فقط ما يمكن التحقق منه من القائمة.',
  'اكتب جوابًا عمليًا ومباشرًا يتضمن الفرص القابلة للتنفيذ والمخاطر وأول 3 خطوات مقترحة، دون اختراع أي بيانات خارج السياق.',
].join(' ');

function buildContext(query: string) {
  return searchTradeInsights(query, 10)
    .map((site, index) => [
      `${index + 1}. ${site.title}`,
      `المجال: ${site.main_category}`,
      `الموثوقية: ${site.credibility_score}`,
      `الملخص: ${site.description}`,
      `الفرصة: ${site.ai_analysis_and_opportunities}`,
    ].join('\n'))
    .join('\n\n');
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const query = typeof body?.query === 'string' ? body.query.trim() : '';
    const summary = buildTradeKnowledgeSummary(query);
    const topScore = summary.topInsights[0]?.relevanceScore ?? 0;

    const apiKey = process.env.HUGGINGFACE_API_KEY;
    const context = buildContext(query || 'استعراض عام لقاعدة المعرفة');

    if (!apiKey || (query && topScore < 28)) {
      return Response.json({
        mode: 'heuristic',
        summary,
        insights: summary.topInsights,
        aiBrief: query && topScore < 28
          ? 'لا توجد مصادر موثوقة كافية في قاعدة المعرفة الحالية لهذا الاستعلام. استخدم مصادر موثقة أو وسّع قاعدة البيانات.'
          : '',
      });
    }

    const hf = new HfInference(apiKey);
    const prompt = [
      NO_FABRICATION_PROMPT,
      `سؤال المستخدم: ${query || 'استعراض عام لفرص التصدير'}`,
      'المصادر الموثقة:',
      context,
    ].join('\n\n');

    const generated = await hf.textGeneration({
      model: 'meta-llama/Meta-Llama-3-8B-Instruct',
      inputs: prompt,
      parameters: {
        max_new_tokens: 420,
        temperature: 0.15,
        top_p: 0.8,
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
