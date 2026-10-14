import { NextRequest, NextResponse } from 'next/server';

// Romanized Hinglish to natural Devanagari Hindi phonetic dictionary
const HINGLISH_MAP: Record<string, string> = {
  shabash: 'शाबाश',
  beta: 'बेटा',
  maine: 'मैंने',
  aapki: 'आपकी',
  aapka: 'आपका',
  notebook: 'कॉपी',
  copy: 'कॉपी',
  photo: 'फोटो',
  page: 'पेज',
  dhyan: 'ध्यान',
  se: 'से',
  dekh: 'देख',
  liya: 'लिया',
  hai: 'है',
  hain: 'हैं',
  blackboard: 'ब्लैकबोर्ड',
  board: 'बोर्ड',
  par: 'पर',
  step: 'स्टेप',
  pehla: 'पहला',
  pehle: 'पहले',
  dusra: 'दूसरा',
  dekhein: 'देखें',
  samjhein: 'समझें',
  samajhte: 'समझते',
  question: 'सवाल',
  sawaal: 'सवाल',
  prashn: 'प्रश्न',
  hal: 'हल',
  answer: 'उत्तर',
  sahi: 'सही',
  galat: 'गलत',
  aur: 'और',
  ek: 'एक',
  do: 'दो',
  teen: 'तीन',
  char: 'चार',
  karein: 'करें',
  karte: 'करते',
  hume: 'हमें',
  mila: 'मिला',
  barabar: 'बराबर',
  guna: 'गुणा',
  bhaag: 'भाग',
  fraction: 'भिन्न',
  fractions: 'भिन्न',
  plus: 'प्लस',
  minus: 'माइनस',
  very: 'बहुत',
  good: 'अच्छा',
  sharma: 'शर्मा',
  sir: 'सर',
  neha: 'नेहा',
  mam: 'मैम',
};

function convertHinglishToDevanagari(text: string): string {
  // If already mostly Devanagari, return as is
  const devanagariCount = (text.match(/[\u0900-\u097F]/g) || []).length;
  if (devanagariCount > text.length * 0.3) {
    return text;
  }

  // Replace recognized phonetic words
  const words = text.split(/(\s+|[.,!?।])/);
  const converted = words.map((w) => {
    const cleanWord = w.toLowerCase().replace(/[^a-z]/g, '');
    if (HINGLISH_MAP[cleanWord]) {
      return HINGLISH_MAP[cleanWord];
    }
    return w;
  });

  return converted.join('');
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const rawText = searchParams.get('text') || '';
    const lang = searchParams.get('lang') || 'hi';

    if (!rawText.trim()) {
      return new NextResponse('Text is required', { status: 400 });
    }

    // 1. Clean up file names and symbols
    let cleanText = rawText
      .replace(/WhatsApp\s*Image[a-zA-Z0-9_.\-\s]+\.(jpe?g|png)/gi, 'आपकी कॉपी का सवाल')
      .replace(/[a-zA-Z0-9_\-]+\.(jpe?g|png|pdf)/gi, 'आपका पेज')
      .replace(/<[^>]*>/g, '')
      .replace(/[*_#]/g, '')
      .replace(/≠/g, ' बराबर नहीं है ')
      .replace(/⟹/g, ' इससे मिला ')
      .replace(/×/g, ' गुणा ')
      .replace(/÷/g, ' भाग ')
      .replace(/1\/2/g, ' आधा ')
      .replace(/1\/4/g, ' एक चौथाई ')
      .replace(/3\/4/g, ' तीन चौथाई ')
      .replace(/✅/g, ' सही उत्तर ')
      .replace(/❌/g, ' यहाँ गलती है ')
      .replace(/^(Sharma Sir|Neha Mam|Riya Didi|Kabir Bhaiya):\s*/i, '')
      .trim();

    // 2. Convert to natural Hindi Devanagari if Romanized
    if (lang === 'hi' || lang === 'hi-IN') {
      cleanText = convertHinglishToDevanagari(cleanText);
    }

    // Limit to 200 chars per speech utterance chunk
    const speechSlice = cleanText.slice(0, 200);

    // 3. Fetch authentic Indian Hindi voice from Google Cloud Translate TTS
    const targetLang = lang === 'en' ? 'en-IN' : 'hi';
    const googleTtsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(
      speechSlice
    )}&tl=${targetLang}&client=tw-ob`;

    const audioRes = await fetch(googleTtsUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Referer: 'https://translate.google.com/',
      },
    });

    if (!audioRes.ok) {
      return new NextResponse('TTS generation failed', { status: 502 });
    }

    const audioBuffer = await audioRes.arrayBuffer();

    return new NextResponse(audioBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'public, max-age=86400, s-maxage=86400',
      },
    });
  } catch (error: any) {
    console.error('TTS Route Error:', error);
    return new NextResponse(error.message || 'Server error', { status: 500 });
  }
}
