import { NextRequest, NextResponse } from 'next/server';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';

const TEACHER_MAP: Record<string, { id: string; name: string; emoji: string }> = {
  math: { id: 'sharma', name: 'Sharma Sir', emoji: '📐' },
  evs: { id: 'neha', name: 'Neha Mam', emoji: '🔬' },
  science: { id: 'neha', name: 'Neha Mam', emoji: '🔬' },
  hindi: { id: 'pooja', name: 'Pooja Mam', emoji: '✍️' },
  english: { id: 'riya', name: 'Riya Didi', emoji: '📚' },
};

export async function POST(req: NextRequest) {
  try {
    const {
      board = 'RBSE',
      className = 'Class 4th',
      subjectId = 'math',
      promptHint = '',
    } = await req.json();

    const normalizedSubject = subjectId.toLowerCase().includes('evs')
      ? 'evs'
      : subjectId.toLowerCase().includes('science')
      ? 'science'
      : subjectId.toLowerCase().includes('hindi')
      ? 'hindi'
      : subjectId.toLowerCase().includes('english')
      ? 'english'
      : 'math';

    const teacherInfo = TEACHER_MAP[normalizedSubject] || TEACHER_MAP.math;

    const systemPrompt = `You are an expert textbook author and syllabus coordinator for the Rajasthan Board of Secondary Education (RBSE / RSTB / RSCERT) and NCERT.
Task: Generate the complete, official, authentic curriculum for:
- Board: ${board} (Rajasthan State Board)
- Class: ${className}
- Subject: ${subjectId.toUpperCase()} (${teacherInfo.name})
${promptHint ? `Additional Instructions / Chapter Focus: ${promptHint}` : ''}

CRITICAL RULES:
1. Provide authentic chapter titles in both Hindi (Devanagari) and English as used in official RBSE / NCERT Rajasthan textbooks.
2. For Class 4th RBSE:
   - EVS: Book is "अपना परिवेश (Apna Parivesh)" (21 chapters)
   - Math: Book is "गणित (Class 4)" (14 chapters)
   - Hindi: Book is "हिंदी (Class 4)" (10 chapters + व्याकरण)
   - English: Book is "My Picture Book / English Reader" (7 chapters + Grammar)
3. For each chapter, include:
   - "chapterNumber": number
   - "titleHindi": e.g. "अध्याय 1: ..."
   - "titleEnglish": English title
   - "concepts": array of 3-5 core concepts in Hindi/English
   - "keyFormulas": array of 1-3 formulas, rules or important points
   - "term": "half_yearly" or "annual"
   - "estimatedMinutes": number (usually 40-50)
   - "sampleQuestions": array of 1-2 authentic questions with question, type ("mcq" or "solve"), options (for mcq), correctAnswer, and explanation.

OUTPUT FORMAT:
Return ONLY raw valid JSON (no markdown formatting, no code fence backticks) adhering strictly to this schema:
{
  "subjectId": "${normalizedSubject}",
  "subjectName": "${subjectId}",
  "subjectHindi": "${normalizedSubject === 'math' ? 'गणित (Math)' : normalizedSubject === 'evs' ? 'पर्यावरण अध्ययन (EVS)' : normalizedSubject === 'science' ? 'विज्ञान (Science)' : normalizedSubject === 'hindi' ? 'हिंदी (Hindi)' : 'अंग्रेजी (English)'}",
  "bookName": "Official Textbook Name",
  "teacherId": "${teacherInfo.id}",
  "teacherName": "${teacherInfo.name}",
  "emoji": "${teacherInfo.emoji}",
  "chapters": [
    {
      "id": "generated-id-1",
      "chapterNumber": 1,
      "titleHindi": "पाठ 1: ...",
      "titleEnglish": "Chapter 1: ...",
      "concepts": ["Concept 1", "Concept 2"],
      "keyFormulas": ["Formula 1"],
      "term": "half_yearly",
      "estimatedMinutes": 45,
      "sampleQuestions": [
        {
          "question": "Question text...",
          "type": "mcq",
          "options": ["A", "B", "C", "D"],
          "correctAnswer": "A",
          "explanation": "Why A is correct..."
        }
      ]
    }
  ]
}`;

    if (!GEMINI_API_KEY) {
      return NextResponse.json(
        {
          success: false,
          message: 'GEMINI_API_KEY is not configured in .env.local',
        },
        { status: 400 }
      );
    }

    const candidateModels = [
      'gemini-3.1-flash-lite',
      'gemini-3.5-flash-lite',
      'gemini-flash-lite-latest',
      'gemini-3.8-flash',
    ];

    let rawReply = '';
    let usedModel = '';

    for (const modelName of candidateModels) {
      try {
        const geminiRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${GEMINI_API_KEY}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: systemPrompt }] }],
              generationConfig: {
                temperature: 0.1,
                maxOutputTokens: 6000,
                responseMimeType: 'application/json',
              },
            }),
          }
        );

        if (geminiRes.ok) {
          const geminiData = await geminiRes.json();
          rawReply = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text || '';
          if (rawReply) {
            usedModel = modelName;
            break;
          }
        } else {
          const errBody = await geminiRes.json().catch(() => ({}));
          console.warn(
            `[API /syllabus/generate] Model ${modelName} returned status ${geminiRes.status}:`,
            errBody?.error?.message || ''
          );
        }
      } catch (err) {
        console.error(`Gemini model ${modelName} call failed:`, err);
      }
    }

    if (!rawReply) {
      return NextResponse.json(
        {
          success: false,
          message: 'Failed to generate curriculum with Gemini API models.',
        },
        { status: 500 }
      );
    }

    // Clean JSON response (strip markdown fences if present)
    let cleanJson = rawReply.trim();
    if (cleanJson.startsWith('```json')) {
      cleanJson = cleanJson.replace(/^```json\s*/i, '').replace(/\s*```$/, '');
    } else if (cleanJson.startsWith('```')) {
      cleanJson = cleanJson.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }

    const parsedData = JSON.parse(cleanJson);

    // Ensure IDs are unique
    if (Array.isArray(parsedData.chapters)) {
      parsedData.chapters.forEach((ch: any, idx: number) => {
        ch.chapterNumber = ch.chapterNumber || idx + 1;
        ch.id = `${board.toLowerCase()}-${className.replace(/\s+/g, '').toLowerCase()}-${normalizedSubject}-${ch.chapterNumber}`;
      });
    }

    return NextResponse.json({
      success: true,
      model: usedModel,
      generatedSubject: parsedData,
    });
  } catch (err: any) {
    console.error('[API Syllabus Generate] Error:', err);
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
