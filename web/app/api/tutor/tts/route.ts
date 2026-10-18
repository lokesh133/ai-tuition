import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// Hindi words for numbers 0 to 100 for authentic Hindi reading
const HINDI_NUMBERS: Record<number, string> = {
  0: 'शून्य', 1: 'एक', 2: 'दो', 3: 'तीन', 4: 'चार', 5: 'पांच', 6: 'छह', 7: 'सात', 8: 'आठ', 9: 'नौ', 10: 'दस',
  11: 'ग्यारह', 12: 'बारह', 13: 'तेरह', 14: 'चौदह', 15: 'पंद्रह', 16: 'सोलह', 17: 'सत्रह', 18: 'अठारह', 19: 'उन्नीस', 20: 'बीस',
  21: 'इक्कीस', 22: 'बाईस', 23: 'तेईस', 24: 'चौबीस', 25: 'पच्चीस', 26: 'छब्बीस', 27: 'सत्ताईस', 28: 'अट्ठाईस', 29: 'उनतीस', 30: 'तीस',
  31: 'इकतीस', 32: 'बत्तीस', 33: 'तैंतीस', 34: 'चौंतीस', 35: 'पैंतीस', 36: 'छत्तीस', 37: 'सैंतीस', 38: 'अड़तीस', 39: 'उनतालीस', 40: 'चालीस',
  41: 'इकतालीस', 42: 'बयालीस', 43: 'तैंतालीस', 44: 'चवालीस', 45: 'पैंतालीस', 46: 'छियालीस', 47: 'सैंतालीस', 48: 'अड़तालीस', 49: 'उनचास', 50: 'पचास',
  51: 'इक्यावन', 52: 'बावन', 53: 'तिरेपन', 54: 'चौवन', 55: 'पचपन', 56: 'छप्पन', 57: 'सत्तावन', 58: 'अट्ठावन', 59: 'उनसठ', 60: 'साठ',
  61: 'इकसठ', 62: 'बासठ', 63: 'तिरेसठ', 64: 'चौंसठ', 65: 'पैंसठ', 66: 'छियासठ', 67: 'सरसठ', 68: 'अड़सठ', 69: 'उनहत्तर', 70: 'सत्तर',
  71: 'इकहत्तर', 72: 'बहत्तर', 73: 'तिहत्तर', 74: 'चौहत्तर', 75: 'पचहत्तर', 76: 'छिहत्तर', 77: 'सतहत्तर', 78: 'अठहत्तर', 79: 'उनासी', 80: 'अस्सी',
  81: 'इक्यासी', 82: 'बयासी', 83: 'तिरासी', 84: 'चौरासी', 85: 'पचासी', 86: 'छियासी', 87: 'सत्तासी', 88: 'अट्ठासी', 89: 'नवासी', 90: 'नब्बे',
  91: 'इक्यानवे', 92: 'बानवे', 93: 'तिरानवे', 94: 'चौरानवे', 95: 'पंचानवे', 96: 'छियानवे', 97: 'सत्तानवे', 98: 'अट्ठानवे', 99: 'निन्यानवे', 100: 'सौ',
};

// Common Hinglish / English phonetic map
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
  whiteboard: 'व्हाइटबोर्ड',
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
  riya: 'रिया',
  didi: 'दीदी',
  math: 'गणित',
  maths: 'गणित',
  science: 'विज्ञान',
  english: 'अंग्रेजी',
};

function convertNumbersAndMathToHindi(text: string): string {
  // Convert fractions and units first
  let out = text
    .replace(/1\/2/g, ' आधा ')
    .replace(/1\/4/g, ' चौथाई ')
    .replace(/3\/4/g, ' तीन चौथाई ')
    .replace(/\b([0-9]+)\s*kg\b/gi, '$1 किलोग्राम ')
    .replace(/\b([0-9]+)\s*g\b/gi, '$1 ग्राम ')
    .replace(/\b([0-9]+)\s*km\/h\b/gi, '$1 किलोमीटर प्रति घंटा ')
    .replace(/\b([0-9]+)\s*km\b/gi, '$1 किलोमीटर ')
    .replace(/\b([0-9]+)\s*m\b/gi, '$1 मीटर ')
    .replace(/\b([0-9]+)\s*cm\b/gi, '$1 सेंटीमीटर ');

  // Convert isolated numbers (0-100) into authentic Hindi words
  out = out.replace(/\b([0-9]{1,3})\b/g, (match) => {
    const n = parseInt(match, 10);
    if (!isNaN(n) && HINDI_NUMBERS[n] !== undefined) {
      return HINDI_NUMBERS[n];
    }
    return match;
  });

  // Convert math symbols to authentic Hindi spoken words
  out = out
    .replace(/\+/g, ' प्लस ')
    .replace(/([0-9\u0966-\u096F]+)\s*[-–—]\s*([0-9\u0966-\u096F]+)/g, '$1 माइनस $2')
    .replace(/\s+[-–—]\s+/g, ' माइनस ')
    .replace(/[-–—]/g, ' ') // Any remaining compound word hyphens become natural pause/space
    .replace(/[×*]/g, ' गुणा ')
    .replace(/[÷]/g, ' भाग ')
    .replace(/([0-9\u0966-\u096F]+)\s*\/\s*([0-9\u0966-\u096F]+)/g, '$1 बटा $2')
    .replace(/=/g, ' बराबर ')
    .replace(/≠/g, ' बराबर नहीं है ')
    .replace(/%/g, ' प्रतिशत ')
    .replace(/⟹|→/g, ' इससे प्राप्त हुआ ');

  return out;
}

function cleanAndPhoneticizeHindi(text: string, lang = 'hi'): string {
  let cleaned = text
    .replace(/<[^>]*>/g, '')
    .replace(/[*_#`~]/g, '')
    .replace(/WhatsApp\s*Image[a-zA-Z0-9_.\-\s]+\.(jpe?g|png)/gi, 'आपकी कॉपी का सवाल')
    .replace(/[a-zA-Z0-9_\-]+\.(jpe?g|png|pdf)/gi, 'आपका पेज')
    .replace(/✅/g, ' सही उत्तर ')
    .replace(/❌/g, ' गलत ')
    .replace(/🎯|📝|⭐|💡|👍|👏/g, ' ')
    .replace(/^(Sharma Sir|Neha Mam|Riya Didi|Kabir Bhaiya):\s*/i, '')
    .replace(/\s+/g, ' ')
    .trim();

  // If requesting English voice or language is English, do not translate English words into Hindi phonetics
  if (lang !== 'en' && lang !== 'en-IN') {
    // Convert Hinglish phonetic words if mostly latin script
    const devanagariCount = (cleaned.match(/[\u0900-\u097F]/g) || []).length;
    if (devanagariCount <= cleaned.length * 0.4) {
      const words = cleaned.split(/(\s+|[.,!?।])/);
      const converted = words.map((w) => {
        const cleanWord = w.toLowerCase().replace(/[^a-z]/g, '');
        if (HINGLISH_MAP[cleanWord]) {
          return HINGLISH_MAP[cleanWord];
        }
        return w;
      });
      cleaned = converted.join('');
    }

    // Convert numbers & math symbols to Hindi
    cleaned = convertNumbersAndMathToHindi(cleaned);
  }

  return cleaned.trim();
}

// Split text into chunks of <= 150 chars along sentence or phrase boundaries
function splitIntoChunks(text: string, maxLen = 150): string[] {
  if (text.length <= maxLen) return [text];

  const sentences = text.split(/(?<=[.!?।,\n])\s+/);
  const chunks: string[] = [];
  let current = '';

  for (const sentence of sentences) {
    if (!sentence.trim()) continue;
    if ((current + ' ' + sentence).trim().length <= maxLen) {
      current = (current ? current + ' ' : '') + sentence;
    } else {
      if (current) chunks.push(current);
      if (sentence.length > maxLen) {
        // Break long sentence by space
        const words = sentence.split(/\s+/);
        let sub = '';
        for (const w of words) {
          if ((sub + ' ' + w).trim().length <= maxLen) {
            sub = (sub ? sub + ' ' : '') + w;
          } else {
            if (sub) chunks.push(sub);
            sub = w;
          }
        }
        current = sub;
      } else {
        current = sentence;
      }
    }
  }

  if (current.trim()) {
    chunks.push(current.trim());
  }

  return chunks.slice(0, 6); // Max 6 chunks (~900 chars) to prevent excessive latency
}

async function fetchGoogleTTSAudio(textChunk: string, targetLang = 'hi'): Promise<Buffer | null> {
  try {
    const googleTtsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(
      textChunk
    )}&tl=${targetLang}&client=tw-ob`;

    const res = await fetch(googleTtsUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Referer: 'https://translate.google.com/',
      },
      next: { revalidate: 86400 },
    });

    if (!res.ok) return null;
    const arrayBuffer = await res.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch (err) {
    console.warn('[TTS] Fetch chunk error:', err);
    return null;
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const rawText = searchParams.get('text') || '';
    const lang = searchParams.get('lang') || 'hi';

    if (!rawText.trim()) {
      return new NextResponse('Text is required', { status: 400 });
    }

    const targetLang = lang === 'en' || lang === 'en-IN' ? 'en-IN' : 'hi';
    const cleanText = cleanAndPhoneticizeHindi(rawText, targetLang);

    // Break text into natural spoken chunks
    const chunks = splitIntoChunks(cleanText, 150);

    if (chunks.length === 0) {
      return new NextResponse('Empty text', { status: 400 });
    }

    // Fetch all audio chunks in parallel
    const audioBuffers = await Promise.all(
      chunks.map((chunk) => fetchGoogleTTSAudio(chunk, targetLang))
    );

    const validBuffers = audioBuffers.filter((b): b is Buffer => b !== null && b.length > 0);

    if (validBuffers.length === 0) {
      return new NextResponse('TTS generation failed', { status: 502 });
    }

    // Concatenate MPEG frames into one contiguous MP3 stream
    const combinedBuffer = Buffer.concat(validBuffers);

    return new NextResponse(combinedBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'public, max-age=86400, s-maxage=86400',
        'Content-Length': combinedBuffer.length.toString(),
      },
    });
  } catch (error: any) {
    console.error('TTS Route Error:', error);
    return new NextResponse(error.message || 'Server error', { status: 500 });
  }
}
