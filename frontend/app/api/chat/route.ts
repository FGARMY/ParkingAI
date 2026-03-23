import { google } from '@ai-sdk/google';
import { streamText } from 'ai';

export const maxDuration = 30; // Vercel constraint config

export async function POST(req: Request) {
  try {
    console.log('[API Request] POST /api/chat - Incoming request starting');
    
    // 2. Validate Env Vars: Development, Preview, Production handling logic
    const GEMINI_KEY = process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY;
    if (!GEMINI_KEY) {
      console.error('[API Error] Missing API Key: GEMINI_API_KEY or OPENAI_API_KEY is not defined');
      return Response.json(
        { error: 'API key not configured in environment (Development/Preview/Production)', fallback: 'System is currently unavailable. Please check API keys.' },
        { status: 500 }
      );
    }
    
    let body;
    try {
      body = await req.json();
    } catch(err) {
      return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const { messages } = body;
    if (!messages) {
      return Response.json({ error: 'Missing messages in request' }, { status: 400 });
    }

    console.log(`[API Request] Received ${messages.length} messages`);

    // 5. VALIDATE MODEL NAME AND PROVIDER
    const provider = google;
    const modelName = 'gemini-1.5-flash';
    console.log(`[API Config] Provider: Google, Model: ${modelName}`);

    // Call the model and handle streaming correctly
    const result = streamText({
      model: provider(modelName),
      messages,
      onError: (error) => {
        console.error('[API Error] Model streaming failed:', error);
      }
    });

    console.log('[API Response] Initiating response stream');
    return result.toTextStreamResponse();
  } catch (error) {
    // 4. ERROR HANDLING
    console.error('[API Error] Critical failure in /api/chat:', error);
    
    // Return fallback response if API fails
    return Response.json(
      { error: 'Internal Server Error', fallback: 'Sorry, the AI is temporarily unavailable. Please try again later.' },
      { status: 500 }
    );
  }
}
