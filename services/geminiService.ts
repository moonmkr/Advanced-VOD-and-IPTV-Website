import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.API_KEY || ''; // Ideally from env

export const sendMessageToGemini = async (
  prompt: string,
  history: { role: string; parts: { text: string }[] }[] = []
): Promise<string> => {
  if (!apiKey) {
    return "Error: API Key is missing. Please configure process.env.API_KEY.";
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    
    // Using gemini-3-pro-preview as requested for complex tasks with thinking budget
    const modelId = 'gemini-3-pro-preview';

    const response = await ai.models.generateContent({
      model: modelId,
      contents: [
        ...history.map(h => ({ role: h.role, parts: h.parts })),
        { role: 'user', parts: [{ text: prompt }] }
      ],
      config: {
        thinkingConfig: { thinkingBudget: 32768 }, // Max thinking budget
        systemInstruction: "You are 'Eddit AI', a helpful assistant for the eddit.site video platform. You are witty, modern, and helpful. Keep answers concise unless asked for details.",
      }
    });

    if (response.text) {
      return response.text;
    }
    
    return "I couldn't generate a response at this time.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Sorry, something went wrong with the AI connection.";
  }
};
