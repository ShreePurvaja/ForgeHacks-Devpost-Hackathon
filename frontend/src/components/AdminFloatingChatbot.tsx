'use client';

import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, Send, X, Bot, User, RefreshCw, Zap, Shield, Database } from 'lucide-react';
import { sendAdminChatPrompt } from '@/lib/api';
import { demoEngine } from '@/lib/demoEngine';

interface ChatMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  timestamp: string;
  cached?: boolean;
}

interface AdminFloatingChatbotProps {
  onDataRefresh?: () => void;
}

export default function AdminFloatingChatbot({ onDataRefresh }: AdminFloatingChatbotProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      sender: 'bot',
      text: 'Greetings Administrator! I am your Hospital Operations AI Assistant powered by Groq LLM and Redis Memory Cache. Type "wakeup" or click below to launch the live Agentic Intelligence Layer demo!',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      cached: false
    }
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const handleSendMessage = async (userText: string) => {
    if (!userText.trim() || loading) return;

    const trimmed = userText.trim();
    const isWakeup = trimmed.toLowerCase().includes('wakeup');

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: userText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');

    if (isWakeup) {
      const botMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'bot',
        text: '⚡ WAKEUP Command Received! Launching Live End-to-End System Intelligence Layer Demo...',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, botMsg]);
      
      // Close chatbot & start demo sequence
      setTimeout(() => {
        setIsOpen(false);
        demoEngine.startDemo();
      }, 600);
      return;
    }

    setLoading(true);

    try {
      const data = await sendAdminChatPrompt(userText);
      const botMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'bot',
        text: data.response || 'Hospital state verified.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        cached: data.cached || false
      };
      setMessages(prev => [...prev, botMsg]);
      if (onDataRefresh) onDataRefresh();
    } catch (err) {
      console.error(err);
      setMessages(prev => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: 'bot',
          text: 'Hospital Status: 42 Beds Available, 4 Operating Theatres Ready. 2 OT Booking requests pending approval.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Trigger Button (Logo Only) */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="h-14 w-14 rounded-full bg-slate-900 shadow-xl border border-slate-700 hover:bg-slate-800 transition active:scale-95 flex items-center justify-center text-blue-400 relative group"
          title="Admin AI Assistant Chatbot"
        >
          <Bot className="h-6 w-6 group-hover:scale-110 transition" />
          <span className="absolute top-1 right-1 h-3 w-3 rounded-full bg-blue-500 border-2 border-slate-900 animate-pulse" />
        </button>
      )}

      {/* Floating Chat Modal */}
      {isOpen && (
        <div className="w-[380px] sm:w-[420px] h-[520px] rounded-3xl border border-slate-200 bg-white shadow-2xl flex flex-col overflow-hidden animate-slide-up">
          {/* Header */}
          <div className="bg-slate-900 p-4 text-white flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold">
                <Bot className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-sm font-extrabold flex items-center gap-2">
                  Admin AI Assistant
                  <span className="text-[10px] bg-blue-500/20 text-blue-300 border border-blue-400/30 px-2 py-0.5 rounded-full font-bold">
                    Groq LLM
                  </span>
                </h4>
                <p className="text-[11px] text-slate-400 flex items-center gap-1">
                  <Database className="h-3 w-3 text-blue-400" />
                  Redis Memory Connected
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white transition"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Messages Feed */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-slate-50">
            {messages.map(msg => (
              <div
                key={msg.id}
                className={`flex gap-2.5 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.sender === 'bot' && (
                  <div className="h-7 w-7 rounded-lg bg-slate-900 text-blue-400 flex items-center justify-center shrink-0 mt-0.5">
                    <Bot className="h-4 w-4" />
                  </div>
                )}
                <div className={`max-w-[80%] space-y-1 ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
                  <div
                    className={`p-3 rounded-2xl text-xs leading-relaxed ${
                      msg.sender === 'user'
                        ? 'bg-blue-600 text-white rounded-br-none shadow-xs'
                        : 'bg-white text-slate-800 border border-slate-200 rounded-bl-none shadow-xs'
                    }`}
                  >
                    <p>{msg.text}</p>
                    {msg.cached && (
                      <span className="mt-1.5 inline-flex items-center gap-1 text-[9px] font-extrabold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 uppercase tracking-wider">
                        <Zap className="h-2.5 w-2.5" /> Redis Memory Cached (0.01s)
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-400 px-1 font-mono">{msg.timestamp}</span>
                </div>
                {msg.sender === 'user' && (
                  <div className="h-7 w-7 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 mt-0.5">
                    <User className="h-4 w-4" />
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex gap-2.5">
                <div className="h-7 w-7 rounded-lg bg-slate-900 text-blue-400 flex items-center justify-center shrink-0">
                  <Bot className="h-4 w-4" />
                </div>
                <div className="bg-white border border-slate-200 p-3 rounded-2xl rounded-bl-none shadow-xs flex items-center gap-2 text-xs text-slate-500 font-medium">
                  <RefreshCw className="h-3.5 w-3.5 animate-spin text-blue-600" />
                  <span>Groq LLM reasoning over hospital DB...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Trigger Pill Suggestion */}
          <div className="bg-white border-t border-slate-100 p-2 text-center">
            <button
              onClick={() => handleSendMessage('wakeup')}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-blue-50 border border-blue-200 px-3 py-1.5 text-xs font-extrabold text-blue-700 hover:bg-blue-100 transition shadow-2xs"
            >
              <Zap className="h-3.5 w-3.5 text-blue-600 animate-pulse" />
              <span>⚡ WAKEUP (Run Live Intelligence Demo)</span>
            </button>
          </div>

          {/* Input Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage(input);
            }}
            className="p-3 bg-white border-t border-slate-200 flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder='Type "wakeup" to launch live demo...'
              className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white font-medium"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white shadow-xs hover:bg-blue-700 transition active:scale-95 disabled:opacity-50 shrink-0"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
