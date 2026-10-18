import { NextRequest, NextResponse } from 'next/server';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const audioFile = formData.get('audio') as File | null;
    const languageHint = (formData.get('language') as string) || 'hi';

    if (!audioFile || audioFile.size === 0) {
      return NextResponse.json(
        { success: false, error: 'No audio file provided' },
        { status: 400 }
      );
    }

    const audioBytes = await audioFile.arrayBuffer();
    const audioBase64 = Buffer.from(audioBytes).toString('base64');
    const mimeType = audioFile.type || 'audio/webm';

    // 1. Primary Engine: Google Gemini 3.6 Flash (Fast Multimodal Audio)
    if (GEMINI_API_KEY) {
      try {
        const geminiRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${GEMINI_API_KEY}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [
                {
                  parts: [
                    {
                      text: `You are an expert Speech-to-Text transcriber for Indian school students.
Listen to this audio clip and transcribe EXACTLY what the child said in natural Devanagari Hindi or Hinglish (mixed Hindi-English words).
RULES:
1. If the child spoke Hindi, write in clear Hindi (Devanagari or Hinglish based on their flow).
2. If mathematical terms like "fraction", "multiply", "plus", "chapter" are spoken, transcribe them clearly.
3. Output ONLY the transcribed sentence with proper punctuation. Do not add any greeting, preamble, or markdown.`,
                    },
                    {
                      inline_data: {
                        mime_type: mimeType,
                        data: audioBase64,
                      },
                    },
                  ],
                },
              ],
              generationConfig: {
                temperature: 0.1,
                maxOutputTokens: 200,
              },
            }),
          }
        );

        if (geminiRes.ok) {
          const geminiData = await geminiRes.json();
          const transcript =
            geminiData?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';

          if (transcript) {
            return NextResponse.json({
              success: true,
              transcript,
              source: 'gemini_flash_audio',
            });
          }
        } else {
          console.error('Gemini audio transcribe failed:', await geminiRes.text());
        }
      } catch (geminiErr) {
        console.error('Gemini transcribe error:', geminiErr);
      }
    }

    // 2. Secondary Engine: OpenAI Whisper-1
    if (OPENAI_API_KEY) {
      try {
        const whisperData = new FormData();
        const whisperBlob = new Blob([audioBytes], { type: mimeType });
        whisperData.append('file', whisperBlob, 'student_voice.webm');
        whisperData.append('model', 'whisper-1');
        if (languageHint === 'hi') {
          whisperData.append('language', 'hi');
        }

        const whisperRes = await fetch('https://api.openai.com/v1/audio/transcriptions', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${OPENAI_API_KEY}`,
          },
          body: whisperData,
        });

        if (whisperRes.ok) {
          const wData = await whisperRes.json();
          if (wData?.text) {
            return NextResponse.json({
              success: true,
              transcript: wData.text.trim(),
              source: 'openai_whisper',
            });
          }
        }
      } catch (whisperErr) {
        console.error('Whisper transcribe error:', whisperErr);
      }
    }

    // 3. Fallback when API keys are not yet configured
    return NextResponse.json({
      success: false,
      error: 'NO_API_KEY',
      message: 'GEMINI_API_KEY is not configured yet in .env.local',
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Transcribe error' },
      { status: 500 }
    );
  }
}
