import { GoogleGenerativeAI, Part } from '@google/generative-ai';
import { config } from '../config';
import { getTeacherPrompt } from '../prompts/teachers';
import { cacheService } from './cacheService';

export interface AIResponsePayload {
  reply: string;
  whiteboardSteps: Array<{
    step: string;
    formula: string;
    annotation: string;
  }>;
  cached: boolean;
  tokensUsed?: number;
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

    // 2. Prepare Multimodal Contents
    const promptParts: (string | Part)[] = [];

    // Add homework image if scanned
    if (imageBuffer) {
      promptParts.push({
        inlineData: {
          mimeType: imageMimeType,
          data: imageBuffer.toString('base64'),
        },
      });
      promptParts.push(
        `Check this student's scanned notebook page line-by-line. Identify any sign or calculation mistakes and provide simple step-by-step feedback. Student asks: "${question || 'Please check my homework solution.'}"`
      );
    } else {
      promptParts.push(question);
    }

    // 3. Call Google Gemini Flash
    let rawText = '';
    const tokensEstimate = 120;

    if (this.genAI && config.geminiApiKey) {
      try {
        const model = this.genAI.getGenerativeModel({
          model: config.geminiModel || 'gemini-1.5-flash',
          systemInstruction: teacherConfig.systemInstruction,
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
        rawText = this.getFallbackReply(teacherId, question);
      }
    } else {
      // Offline/Local Simulated Response
      rawText = this.getFallbackReply(teacherId, question);
    }

    // 4. Parse Smart Whiteboard Tags (<whiteboard step="..." formula="..." annotation="..." />)
    const { cleanReply, whiteboardSteps } = this.extractWhiteboardTags(rawText);

    const payload: AIResponsePayload = {
      reply: cleanReply,
      whiteboardSteps,
      cached: false,
      tokensUsed: tokensEstimate,
    };

    // 5. Save to Cache for subsequent students asking same NCERT question
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
   * Safe Fallback response for offline sandbox or zero-balance safety
   */
  private getFallbackReply(teacherId: string, _query: string): string {
    if (teacherId === 'neha_mam') {
      return `Shabash beta! Science me ye concept bilkul simple hai. <whiteboard step="Step 1" formula="6CO2 + 6H2O -> C6H12O6 + 6O2" annotation="Photosynthesis in green leaves" /> Plants sunlight aur water use karke food banate hain.`;
    }
    return `Namaste beta! Chalo milkar solve karte hain. <whiteboard step="Step 1" formula="LCM(2, 4) = 4" annotation="Denominators same banaye" /> Pehle fractions ko common base par layenge, phir add karenge.`;
  }
}

export const aiService = new AIService();
