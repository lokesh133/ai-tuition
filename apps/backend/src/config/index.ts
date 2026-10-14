import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: process.env.PORT ? parseInt(process.env.PORT, 10) : 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  geminiApiKey: process.env.GEMINI_API_KEY || '',
  geminiModel: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
  redisUrl: process.env.REDIS_URL || '',
  deepgramApiKey: process.env.DEEPGRAM_API_KEY || '',
  clientOrigin: process.env.CLIENT_ORIGIN ? process.env.CLIENT_ORIGIN.split(',') : ['*'],
};
