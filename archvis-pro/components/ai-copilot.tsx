'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, X, Send, Bot, User } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';

export function AICopilot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: 'user' | 'model', content: string }[]>([
    { role: 'model', content: 'Hello! I am your ArchVis AI. How can I assist with your rendering, materials, or Revit workflows today?' }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;

    const userMessage = input.trim();
    const newMessages = [...messages, { role: 'user', content: userMessage }] as Array<{ role: 'user' | 'model', content: string }>;
    setMessages(newMessages);
    setInput('');
    setIsTyping(true);

    try {
      const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
      if (!apiKey) {
        setMessages(prev => [...prev, { role: 'model', content: 'Please configure NEXT_PUBLIC_GEMINI_API_KEY in your environment.' }]);
        return;
      }

      const ai = new GoogleGenAI({ apiKey });
      
      const prompt = `You are an expert Architectural Visualization AI Assistant integrated into "ArchVis Pro". 
You assist architects and 3D artists. Keep responses concise and helpful (max 3-4 sentences).
Here is the conversation history:
${newMessages.map(m => `${m.role}: ${m.content}`).join('\n')}

Respond to the user's latest message as the AI assistant.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.1-flash-lite",
        contents: prompt,
      });

      setMessages(prev => [...prev, { role: 'model', content: response.text || 'I could not process that request.' }]);
    } catch (e) {
      console.error('AI Error:', e);
      setMessages(prev => [...prev, { role: 'model', content: 'Sorry, I encountered an error connecting to the AI.' }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <>
      <div className="fixed bottom-24 lg:bottom-8 right-4 lg:right-8 z-[100]">
        <button
          onClick={() => setIsOpen(true)}
          className={`flex items-center justify-center p-4 rounded-full bg-primary text-on-primary shadow-lg hover:shadow-primary/50 transition-all hover:scale-110 active:scale-95 ${isOpen ? 'hidden' : ''}`}
          title="Open AI Assistant"
        >
          <Sparkles className="w-6 h-6" />
        </button>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="absolute bottom-0 right-0 w-[350px] sm:w-[400px] h-[550px] max-h-[80vh] bg-surface-container-high border border-outline-variant shadow-2xl rounded-2xl flex flex-col overflow-hidden origin-bottom-right"
            >
              {/* Header */}
              <div className="bg-primary/10 border-b border-primary/20 p-4 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="bg-primary/20 p-2 rounded-lg text-primary">
                    <Bot className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-sm">ArchVis AI</h3>
                    <p className="font-mono text-[10px] text-primary opacity-80">Online • Gemini Engine</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 hover:bg-surface-variant/50 rounded-lg text-on-surface-variant hover:text-on-surface transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 display-scrollbar">
                {messages.map((msg, i) => (
                  <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-primary text-on-primary' : 'bg-surface-variant text-on-surface-variant'}`}>
                      {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                    </div>
                    <div className={`px-4 py-3 rounded-2xl max-w-[80%] text-sm ${
                      msg.role === 'user' 
                        ? 'bg-primary text-on-primary rounded-tr-sm' 
                        : 'bg-surface-container text-on-surface border border-outline-variant rounded-tl-sm'
                    }`}>
                      {msg.content}
                    </div>
                  </div>
                ))}
                {isTyping && (
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-surface-variant text-on-surface-variant flex items-center justify-center shrink-0">
                      <Bot className="w-4 h-4" />
                    </div>
                    <div className="px-4 py-4 rounded-2xl bg-surface-container border border-outline-variant rounded-tl-sm flex items-center gap-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                      <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse delay-75" />
                      <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse delay-150" />
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="p-4 bg-surface-container border-t border-outline-variant">
                <form
                  onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                  className="flex gap-2 items-end relative"
                >
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask about rendering or settings..."
                    className="flex-1 bg-background border border-outline-variant focus:border-primary px-4 py-3 rounded-xl text-sm outline-none transition-colors pr-12"
                  />
                  <button
                    type="submit"
                    disabled={!input.trim() || isTyping}
                    className="absolute right-2 bottom-2 p-1.5 bg-primary text-on-primary rounded-lg disabled:opacity-50 disabled:bg-surface-variant disabled:text-on-surface-variant transition-all"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
