import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export interface ChatOptions {
  useSearch?: boolean;
  useMaps?: boolean;
  useUrlContext?: boolean;
  currentUrl?: string;
  image?: {
    data: string;
    mimeType: string;
  };
}

export async function generateChatResponse(
  prompt: string,
  history: { role: 'user' | 'model', text: string }[],
  options: ChatOptions
) {
  let modelName = "gemini-3-flash-preview";
  const tools: any[] = [];

  if (options.useSearch) {
    tools.push({ googleSearch: {} });
  } else if (options.useMaps) {
    tools.push({ googleMaps: {} });
  } else if (options.useUrlContext) {
    tools.push({ urlContext: {} });
  }

  if (options.image) {
    modelName = "gemini-3.1-pro-preview"; // Use pro for image analysis
  } else if (options.useSearch || options.useMaps || options.useUrlContext) {
    modelName = "gemini-3-flash-preview";
  } else {
    modelName = "gemini-3-flash-preview";
  }

  const parts: any[] = [];
  
  if (options.image) {
    const base64Data = options.image.data.includes(',') 
      ? options.image.data.split(',')[1] 
      : options.image.data;
      
    parts.push({
      inlineData: {
        data: base64Data,
        mimeType: options.image.mimeType
      }
    });
  }

  let finalPrompt = prompt;
  if (options.useUrlContext && options.currentUrl) {
    finalPrompt = `Context URL: ${options.currentUrl}\n\n${prompt}`;
  }

  parts.push({ text: finalPrompt });

  const contents = history.map(msg => ({
    role: msg.role,
    parts: [{ text: msg.text }]
  }));

  contents.push({
    role: 'user',
    parts
  });

  const config: any = {};
  if (tools.length > 0) {
    config.tools = tools;
  }

  const response = await ai.models.generateContent({
    model: modelName,
    contents,
    config
  });

  return {
    text: response.text,
    groundingChunks: response.candidates?.[0]?.groundingMetadata?.groundingChunks
  };
}
