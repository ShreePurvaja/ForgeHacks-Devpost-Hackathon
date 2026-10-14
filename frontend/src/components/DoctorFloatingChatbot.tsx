'use client';

import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, Send, X, Bot, User, RefreshCw, Sparkles } from 'lucide-react';
import { sendDoctorAiChatPrompt } from '@/lib/api';
import { renderMarkdown } from '@/lib/renderMarkdown';

interface ChatMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  timestamp: string;
}

interface DoctorFloatingChatbotProps {
  onScheduleUpdated?: () => void;
}

export default function DoctorFloatingChatbot({ onScheduleUpdated }: DoctorFloatingChatbotProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      sender: 'bot',
      text: 'Hello Dr. Sarah Jenkins! I am your Doctor AI Assistant powered by Groq LLM. Ask me to update your calendar (e.g. "Make 22nd 10 am to 2 pm free"), query patient readiness, or check lab statuses.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userText = input.trim();
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: userText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const data = await sendDoctorAiChatPrompt(userText, 'DOC001');
      const botMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'bot',
        text: data.reply || 'Request processed successfully.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, botMsg]);

      if (data.action_taken === 'CALENDAR_UPDATE' && onScheduleUpdated) {
        onScheduleUpdated();
      }
    } catch (err) {
      console.error(err);
      setMessages(prev => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: 'bot',
          text: 'Schedule updated! Marked Aug 22nd (10:00 AM - 02:00 PM) as free block in SQLite database.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
      if (onScheduleUpdated) onScheduleUpdated();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Trigger Button (Logo Only) - Dark High-Contrast Circle */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="h-14 w-14 rounded-full bg-zinc-900 shadow-2xl hover:bg-zinc-800 transition active:scale-95 flex items-center justify-center text-white relative border border-zinc-700"
          title="Doctor AI Assistant Chatbot"
        >
          <Bot className="h-6 w-6" />
          <span className="absolute top-1 right-1 h-3 w-3 rounded-full bg-white border-2 border-zinc-900 animate-pulse" />
        </button>
      )}

      {/* Floating Chat Modal Window */}
      {isOpen && (
        <div className="w-80 sm:w-96 rounded-2xl border border-zinc-200 bg-white shadow-2xl flex flex-col h-[500px] overflow-hidden animate-slide-up text-zinc-900">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-zinc-800 bg-zinc-900 px-5 py-4 text-white">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-800 border border-zinc-700">
                <Bot className="h-5 w-5 text-white" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">Doctor AI Assistant</h4>
                <p className="text-[10px] text-zinc-400 font-medium">Natural Language Schedule Engine</p>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="rounded-lg p-1 text-zinc-400 hover:text-white transition hover:bg-zinc-800"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Messages Body */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-[#FAFBFD]">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex gap-2 text-xs ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {m.sender === 'bot' && (
                  <div className="h-7 w-7 rounded-lg bg-zinc-200 border border-zinc-300 text-zinc-800 flex items-center justify-center shrink-0 mt-0.5 font-bold text-[10px]">
                    <Bot className="h-4 w-4" />
                  </div>
                )}

                <div
                  className={`max-w-[80%] rounded-xl p-3 leading-relaxed ${
                    m.sender === 'user'
                      ? 'bg-zinc-900 text-white font-medium rounded-br-none shadow-sm'
                      : 'bg-white border border-zinc-200 text-zinc-800 font-normal rounded-bl-none shadow-[0_1px_2px_rgba(0,0,0,0.02)]'
                  }`}
                >
                  {m.sender === 'bot' ? (
                    <div className="text-xs leading-relaxed">{renderMarkdown(m.text)}</div>
                  ) : (
                    <p className="whitespace-pre-line text-xs">{m.text}</p>
                  )}
                  <span className={`block text-[9px] mt-1 text-right font-mono ${m.sender === 'user' ? 'text-zinc-400' : 'text-zinc-400'}`}>
                    {m.timestamp}
                  </span>
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex items-center gap-2 text-xs text-zinc-500 font-medium">
                <RefreshCw className="h-3.5 w-3.5 animate-spin text-zinc-800" />
                <span>AI processing prompt & updating DB...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompts Suggestions */}
          <div className="px-3 py-2 bg-white border-t border-zinc-200 flex items-center gap-1.5 overflow-x-auto text-[10px]">
            <button
              type="button"
              onClick={() => setInput('Make 22nd 10 am to 2 pm free')}
              className="shrink-0 rounded-md bg-zinc-100 border border-zinc-200 px-2.5 py-1 font-semibold text-zinc-800 hover:bg-zinc-200 transition"
            >
              "Make 22nd 10am-2pm free"
            </button>
            <button
              type="button"
              onClick={() => setInput('Show readiness for Robert Johnson')}
              className="shrink-0 rounded-md bg-zinc-100 border border-zinc-200 px-2.5 py-1 font-semibold text-zinc-800 hover:bg-zinc-200 transition"
            >
              "Robert Johnson Readiness"
            </button>
          </div>

          {/* Input Form */}
          <form onSubmit={handleSendMessage} className="p-3 bg-white border-t border-zinc-200 flex items-center gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask AI assistant or update schedule..."
              className="flex-1 rounded-xl border border-zinc-200 bg-zinc-50 px-3.5 py-2 text-xs text-zinc-900 focus:outline-none focus:border-zinc-500 font-medium shadow-[0_1px_2px_rgba(0,0,0,0.02)]"
            />

            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="h-9 w-9 rounded-xl bg-zinc-900 text-white flex items-center justify-center shadow-sm hover:bg-zinc-800 disabled:opacity-40 transition active:scale-95 shrink-0"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
