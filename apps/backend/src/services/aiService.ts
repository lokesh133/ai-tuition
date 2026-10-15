import { GoogleGenerativeAI, Part } from '@google/generative-ai';
import { config } from '../config';
import { getTeacherPrompt } from '../prompts/teachers';
import { cacheService } from './cacheService';
import { matchRbseClass4Syllabus } from '../data/rbseClass4Syllabus';

export interface AIResponsePayload {
  reply: string;
  whiteboardSteps: Array<{
    step: string;
    formula: string;
    annotation: string;
  }>;
  cached: boolean;
  tokensUsed?: number;
  syllabusMatch?: {
    board: string;
    classGrade: string;
    medium: string;
    chapterTitle?: string;
    chapterNumber?: number;
    subject?: string;
  };
}

export class AIService {
  private genAI: GoogleGenerativeAI | null = null;

  constructor() {
    if (config.geminiApiKey) {
      try {
        this.genAI = new GoogleGenerativeAI(config.geminiApiKey);
        console.log('✅ Google Generative AI SDK initialized with Gemini Flash.');
      } catch (err) {
        console.error('❌ Failed to initialize Google Generative AI SDK:', err);
      }
    } else {
      console.warn('⚠️ GEMINI_API_KEY not found. AIService running in simulated educational mode.');
    }
  }

  /**
   * Main Multimodal Query Handler
   * Supports Text doubts + Scanned Notebook Photos (Multimodal)
   */
  public async askTeacher(
    teacherId: string,
    question: string,
    imageBuffer?: Buffer,
    imageMimeType: string = 'image/jpeg'
  ): Promise<AIResponsePayload> {
    const teacherConfig = getTeacherPrompt(teacherId);

    // 1. Cost Optimization: Check Cache First (for text-only queries)
    const cacheKey = cacheService.normalizeKey(teacherId, question);
    if (!imageBuffer && question) {
      const cachedResult = await cacheService.get(cacheKey);
      if (cachedResult) {
        try {
          const parsed = JSON.parse(cachedResult);
          return { ...parsed, cached: true };
        } catch {
          // Proceed to AI if cache JSON parse fails
        }
      }
    }

    // 2. Syllabus Verification: Match against RBSE Rajasthan Class 4 English Medium
    const syllabusAlignment = matchRbseClass4Syllabus(question);

    // 3. Prepare Multimodal Contents
    const promptParts: (string | Part)[] = [];

    // Curriculum instruction header
    promptParts.push(
      `[CURRICULUM MANDATE]: Student is studying under "RBSE (Rajasthan Board of Secondary Education) - Class 4th (English Medium)". Relevant syllabus context: "${syllabusAlignment.contextText}". Only use concepts, formulas, and terminology taught in RBSE Class 4th English medium textbooks.`
    );

    // Add homework image/pdf if uploaded
    if (imageBuffer) {
      promptParts.push({
        inlineData: {
          mimeType: imageMimeType,
          data: imageBuffer.toString('base64'),
        },
      });
      const promptInstruction = imageMimeType === 'application/pdf'
        ? `Read this uploaded RBSE Class 4th textbook/homework PDF document. Extract and solve the questions or explain the concept clearly step-by-step for the student on the blackboard using whiteboard tags. Student asks: "${question || 'Please read this PDF and solve the questions step-by-step.'}"`
        : `Check this student's scanned notebook page line-by-line against RBSE Class 4th curriculum standards. Identify any sign or calculation mistakes and provide simple step-by-step feedback. Student asks: "${question || 'Please check my homework solution.'}"`;
      promptParts.push(promptInstruction);
    } else {
      promptParts.push(question);
    }

    // 4. Call Google Gemini Flash
    let rawText = '';
    const tokensEstimate = 120;

    if (this.genAI && config.geminiApiKey) {
      try {
        const model = this.genAI.getGenerativeModel({
          model: config.geminiModel || 'gemini-3.5-flash',
          systemInstruction: `${teacherConfig.systemInstruction}\nCURRICULUM: Strictly follow RBSE Class 4th (English Medium) Rajasthan State Board syllabus.`,
          generationConfig: {
            maxOutputTokens: teacherConfig.maxOutputTokens,
            temperature: teacherConfig.temperature,
          },
        });

        const result = await model.generateContent(promptParts);
        const response = await result.response;
        rawText = response.text() || '';
      } catch (apiError: any) {
        console.error('Gemini API Error:', apiError?.message || apiError);
        rawText = this.getFallbackReply(teacherId, question, syllabusAlignment);
      }
    } else {
      // Offline/Local Simulated Response aligned with RBSE Class 4
      rawText = this.getFallbackReply(teacherId, question, syllabusAlignment);
    }

    // 5. Parse Smart Whiteboard Tags (<whiteboard step="..." formula="..." annotation="..." />)
    const { cleanReply, whiteboardSteps } = this.extractWhiteboardTags(rawText);

    const payload: AIResponsePayload = {
      reply: cleanReply,
      whiteboardSteps,
      cached: false,
      tokensUsed: tokensEstimate,
      syllabusMatch: {
        board: syllabusAlignment.board,
        classGrade: syllabusAlignment.classGrade,
        medium: syllabusAlignment.medium,
        chapterTitle: syllabusAlignment.chapter?.title,
        chapterNumber: syllabusAlignment.chapter?.chapterNumber,
        subject: syllabusAlignment.chapter?.subject,
      },
    };

    // 6. Save to Cache for subsequent students asking same RBSE question
    if (!imageBuffer && question) {
      await cacheService.set(cacheKey, JSON.stringify(payload), 86400 * 7); // Cache for 7 days
    }

    return payload;
  }

  /**
   * Helper to parse whiteboard tags for live canvas rendering
   */
  private extractWhiteboardTags(text: string) {
    const steps: Array<{ step: string; formula: string; annotation: string }> = [];
    const tagRegex = /<whiteboard\s+step="([^"]*)"\s+formula="([^"]*)"\s+annotation="([^"]*)"\s*\/>/gi;

    let match;
    while ((match = tagRegex.exec(text)) !== null) {
      steps.push({
        step: match[1] || 'Step 1',
        formula: match[2] || '',
        annotation: match[3] || '',
      });
    }

    const cleanReply = text.replace(tagRegex, '').trim();

    // Default step fallback if none generated
    if (steps.length === 0) {
      steps.push({
        step: 'Step 1',
        formula: 'Solution Overview',
        annotation: 'Concept explained step-by-step',
      });
    }

    return { cleanReply, whiteboardSteps: steps };
  }

  /**
   * Safe Fallback response aligned with RBSE Class 4th English Medium Syllabus
   */
  private getFallbackReply(teacherId: string, query: string, alignment?: any): string {
    const qLower = (query || '').toLowerCase();

    // Check if query is about Rajasthan / EVS / Amrita
    if (qLower.includes('amrita') || qLower.includes('khejri') || qLower.includes('tree') || qLower.includes('bishnoi') || teacherId === 'neha_mam') {
      return `Shabash beta! RBSE Class 4th EVS Chapter 4 "The Story of Amrita" ke hisaab se Khejarli gaon Jodhpur (Rajasthan) me hai. <whiteboard step="Step 1: Khejri Tree Importance" formula="State Tree of Rajasthan = Khejri" annotation="Drought-resistant tree with medicinal bark and edible beans (Sangri)" /> Bishnoi community ne pedon ko bachane ke liye apna balidan diya tha. Yaad rakhna beta!`;
    }

    // Check if query is about Bricks / Architecture
    if (qLower.includes('brick') || qLower.includes('pattern') || qLower.includes('building')) {
      return `Namaste beta! RBSE Class 4th Math Chapter 1 "Building with Bricks" me brick ke 6 faces hote hain. <whiteboard step="Step 1: Brick Geometry" formula="Faces = 6, Edges = 12, Vertices = 8" annotation="Rajasthan ki traditional Havelis me sundar brick jaalis aur arches hote hain" /> Is pattern ko dhyan se note karein!`;
    }

    // Default RBSE Class 4 Math Fractions (Chapter 9: Halves and Quarters)
    return `Namaste beta! RBSE Class 4th Math Chapter 9 "Halves and Quarters" ke method se solve karte hain. <whiteboard step="Step 1: Find Common Denominator" formula="LCM(2, 4) = 4" annotation="Equivalent fraction: 1/2 = 2/4. Dono base 4 ban gaye" /> Pehle fractions ko common base par layenge, phir add karenge. Itna samajh aaya beta?`;
  }
}

export const aiService = new AIService();
