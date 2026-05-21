// OpenAI service that proxies through our backend to avoid CORS issues

export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export const sendMessageToOpenAI = async (
  prompt: string,
  history: Message[] = []
): Promise<string> => {
  try {
    const messages: Message[] = [
      {
        role: 'system',
        content: "You are 'Eddit AI', a helpful assistant for the eddit.site video platform. You are witty, modern, and helpful. Keep answers concise unless asked for details."
      },
      ...history,
      {
        role: 'user',
        content: prompt
      }
    ];

    const response = await fetch('http://localhost:3000/api/v1/openai/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ messages }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.statusText}`);
    }

    const data = await response.json();
    if (data.content) {
      return data.content;
    }
    
    return "I couldn't generate a response at this time.";
  } catch (error) {
    console.error("OpenAI API Error:", error);
    return "Sorry, something went wrong with the AI connection. Please make sure the server is running.";
  }
};
