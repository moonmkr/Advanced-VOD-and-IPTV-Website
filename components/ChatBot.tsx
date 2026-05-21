import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Bot, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChatMessage } from '../types';
import { sendMessageToOpenAI, type Message } from '../services/openaiService';

const ChatBot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'assistant', text: 'Hi! I am Eddit AI powered by ChatGPT. Ask me anything about the movies or just chat!' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg: ChatMessage = { role: 'user', text: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    // Prepare history for API - convert to OpenAI format
    const history: Message[] = messages.map(m => ({
      role: m.role === 'assistant' ? 'assistant' : 'user',
      content: m.text
    }));

    const responseText = await sendMessageToOpenAI(userMsg.text, history);

    const modelMsg: ChatMessage = { role: 'assistant', text: responseText };
    setMessages(prev => [...prev, modelMsg]);
    setIsLoading(false);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end pointer-events-none">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="mb-4 w-80 sm:w-96 bg-gray-900/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.5)] overflow-hidden pointer-events-auto flex flex-col"
            style={{ maxHeight: '600px', height: '70vh' }}
          >
            {/* Header */}
            <div className="p-4 bg-dodgerblue/10 border-b border-white/5 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Bot className="w-5 h-5 text-dodgerblue" />
                <span className="font-semibold text-white">Eddit AI</span>
                <span className="text-[10px] bg-dodgerblue/20 text-dodgerblue px-2 py-0.5 rounded-full border border-dodgerblue/20">GPT-4 Turbo</span>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div 
                    className={`max-w-[85%] p-3 rounded-2xl text-sm leading-relaxed ${
                      msg.role === 'user' 
                        ? 'bg-dodgerblue text-white rounded-tr-none' 
                        : 'bg-white/10 text-gray-200 rounded-tl-none'
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-white/10 p-3 rounded-2xl rounded-tl-none flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-dodgerblue" />
                    <span className="text-xs text-gray-400">Thinking...</span>
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <div className="p-4 border-t border-white/5 bg-black/20">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Ask something..."
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-dodgerblue/50 focus:bg-white/10 transition-all placeholder:text-gray-600"
                />
                <button 
                  onClick={handleSend}
                  disabled={isLoading || !input.trim()}
                  className="bg-dodgerblue hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-white p-2.5 rounded-xl transition-colors"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 rounded-full bg-dodgerblue shadow-[0_0_20px_rgba(30,144,255,0.4)] flex items-center justify-center text-white pointer-events-auto border border-white/20 z-50 relative"
      >
        {isOpen ? <X className="w-6 h-6" /> : <MessageSquare className="w-6 h-6" />}
        {/* Pulse effect */}
        {!isOpen && (
            <span className="absolute -inset-1 rounded-full border border-dodgerblue animate-ping opacity-20 pointer-events-none"></span>
        )}
      </motion.button>
    </div>
  );
};

export default ChatBot;
