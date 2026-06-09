import { HfInference } from '@huggingface/inference';
import { buildTradeKnowledgeSummary, searchTradeInsights, getVerifiedTradeSources } from '@/lib/trade-intelligence';

export const maxDuration = 60;

function isVerifiedSource(site: { credibility_score?: number; is_verified?: boolean; verificationStatus?: string }) {
  if (site.is_verified === true) return true;
  if (site.verificationStatus === 'verified') return true;
  const score = typeof site.credibility_score === 'number' ? site.credibility_score : 0;
  return score >= 90;
}

function buildVerifiedContext(query: string) {
  return searchTradeInsights(query, 10)
    .filter(isVerifiedSource)
    .map((site, index) => [
      `${index + 1}. ${site.title}`,
      `المجال: ${site.main_category}`,
      `الموثوقية: ${site.credibility_score}%`,
      `نوع المصدر: ${site.sourceType || 'official'}`,
      `تم التحقق: ${site.is_verified ? 'نعم' : 'مُعتمد أصلاً'}`,
      `الملخص: ${site.description}`,
      `الفرصة: ${site.ai_analysis_and_opportunities}`,
    ].join('\n'))
    .join('\n\n');
}

function hasInsufficientVerifiedEvidence(query: string): boolean {
  const verifiedSources = searchTradeInsights(query, 20).filter(isVerifiedSource);
  const avgCredibility = verifiedSources.reduce((sum, s) => sum + (s.credibility_score || 0), 0) / verifiedSources.length;
  return verifiedSources.length < 2 || avgCredibility < 85;
}

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
    
    const verifiedInsights = summary.topInsights.filter(isVerifiedSource);
    if (verifiedInsights.length === 0) {
      return Response.json({
        mode: 'gate-blocked',
        reason: 'no_verified_sources_found',
        summary,
        insights: [],
        aiBrief: 'لا توجد مصادر موثقة كافية لهذا الاستعلام. يرجى التحقق من قاعدة البيانات أو تقديم مصادر إضافية.',
      });
    }

    const apiKey = process.env.HUGGINGFACE_API_KEY;
    const context = buildVerifiedContext(query || 'استعراض عام لقاعدة المعرفة');

    if (!apiKey || hasInsufficientVerifiedEvidence(query || '')) {
      return Response.json({
        mode: 'heuristic',
        summary,
        insights: verifiedInsights,
        aiBrief: hasInsufficientVerifiedEvidence(query || '') 
          ? 'needs_review: insufficient verified evidence for comprehensive analysis. Available sources: ' + verifiedInsights.length
          : '',
      });
    }

    const hf = new HfInference(apiKey);
    const prompt = [
      NO_FABRICATION_PROMPT,
      `سؤال المستخدم: ${query || 'استعراض عام لفرص التصدير'}`,
      'المصادر الموثقة فقط:',
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
      insights: verifiedInsights,
    });
  } catch (error: any) {
    console.error('trade-intelligence route error', error);
    return Response.json(
      { error: error?.message || 'Failed to build trade intelligence summary' },
      { status: 500 }
    );
  }
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
