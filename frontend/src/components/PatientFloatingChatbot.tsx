import React, { useState, useRef, useEffect } from 'react';
import { 
  Sparkles, X, Send, Bot, ShieldCheck, RefreshCw, Mic, MicOff, Volume2, VolumeX, Paperclip, FileText, UploadCloud, AlertCircle 
} from 'lucide-react';
import { sendPatientChatPrompt, bookSurgeryApi, orderScanApi } from '@/lib/api';
import { PatientLang, PATIENT_TRANSLATIONS } from '@/lib/i18n/patient_translations';
import { useDemoEngine, demoEngine } from '@/lib/demoEngine';

interface Message {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  timestamp: string;
  docAttached?: string;
}

interface PatientFloatingChatbotProps {
  patientId: string;
  cashThreshold: number;
  lang: PatientLang;
}

let globalChatMessages: Message[] | null = null;
let globalChatOpen: boolean = false;

export default function PatientFloatingChatbot({ patientId, cashThreshold, lang }: PatientFloatingChatbotProps) {
  const [isOpen, setIsOpenState] = useState<boolean>(() => globalChatOpen);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const setIsOpen = (open: boolean) => {
    globalChatOpen = open;
    setIsOpenState(open);
  };
  
  // Voice Agent State
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // File Upload State
  const [attachedDocName, setAttachedDocName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const t = PATIENT_TRANSLATIONS[lang] || PATIENT_TRANSLATIONS.en;

  // Demo Engine Integration
  const demo = useDemoEngine();
  const demoExecutedStepRef = useRef<number>(-1);

  const [messages, setMessagesState] = useState<Message[]>(() => {
    if (globalChatMessages && globalChatMessages.length > 0) {
      return globalChatMessages;
    }
    return [
      {
        id: 'm1',
        sender: 'bot',
        text: `Hello! I am your AI Healthcare Navigator. I can help guide you to the right clinic, book appointments, analyze medical claim documents, and check your insurance capability.\n\nYour Emergency Cash Threshold is set to ₹${cashThreshold.toLocaleString('en-IN')}. How can I assist you today?`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ];
  });

  const setMessages = (updater: React.SetStateAction<Message[]>) => {
    setMessagesState(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      globalChatMessages = next;
      return next;
    });
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  // Speech Synthesis (TTS - Text to Speech Out Loud)
  const speakText = (text: string) => {
    if (!isVoiceActive || typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      const cleanSpeech = text.replace(/[*#_`]/g, '');
      const utterance = new SpeechSynthesisUtterance(cleanSpeech);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.error('Speech synthesis error:', err);
    }
  };

  // Reset step execution tracker when demo is stopped or restarted
  useEffect(() => {
    if (!demo.isActive) {
      demoExecutedStepRef.current = -1;
    }
  }, [demo.isActive]);

  // Automated Demo Steps for Patient Care Navigator (Steps 1, 2, 4, 5 of Patient Demo)
  useEffect(() => {
    if (!demo.isActive || demo.demoMode !== 'PATIENT_DEMO' || demo.isPaused) return;
    if (demoExecutedStepRef.current === demo.currentStepIndex) return;

    // Step 1: Wake up & Conflict Detection
    if (demo.currentStepIndex === 0) {
      demoExecutedStepRef.current = 0;
      setIsOpen(true);
      setIsVoiceActive(true);
      demoEngine.setIsExecutingAction(true, 'AI Chatbot checking DB memory for existing appointments...');

      setTimeout(async () => {
        const uMsg: Message = {
          id: `usr_${Date.now()}`,
          sender: 'user',
          text: "Wake up and give demo. Book an appointment with Dr. Sarah Jenkins today at 10:30 AM",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        const bMsgText = "⚠️ **Appointment Conflict Detected**: I noticed in my database memory that you already have an appointment booked with Dr. Sarah Jenkins (Cardiology OPD Clinic 3) for Today at 10:30 AM. Would you like to keep this slot, or reschedule it to a different slot?";
        const bMsg: Message = {
          id: `bot_${Date.now()}`,
          sender: 'bot',
          text: bMsgText,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setMessages(prev => [...prev, uMsg, bMsg]);
        speakText(bMsgText);
        demoEngine.setIsExecutingAction(false);
      }, 800);
      return;
    }

    // Step 2: Reschedule to Aug 23 (10:00 AM) & 1st Time Intake
    if (demo.currentStepIndex === 1) {
      demoExecutedStepRef.current = 1;
      setIsOpen(true);
      demoEngine.setIsExecutingAction(true, 'Rescheduling to Aug 23 (10:00 AM) & recording 1st Time Patient visit...');

      setTimeout(async () => {
        const msg1: Message = {
          id: `usr_${Date.now()}`,
          sender: 'user',
          text: "Book on next day 10 am with description: I feel severe headache, sore throat, and vomiting sensation",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        const bot1: Message = {
          id: `bot_${Date.now()}`,
          sender: 'bot',
          text: "🗓️ Have you taken any recent medical scans, blood test reports, or hospital documents for this visit? Reply '1st time' if you don't have documents.",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        const msg2: Message = {
          id: `usr_${Date.now() + 1}`,
          sender: 'user',
          text: "No, 1st time",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        const bot2Text = "✅ **Appointment Confirmed**: Your appointment with Dr. Sarah Jenkins (Cardiology OPD Clinic 3) is confirmed for **Aug 23 at 10:00 AM**.\n\nRecorded 1st Time Patient visit with symptoms: Severe headache, sore throat, and vomiting sensation. Your Care Dashboard and Doctor Calendar have been updated!";
        const bot2: Message = {
          id: `bot_${Date.now() + 2}`,
          sender: 'bot',
          text: bot2Text,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };

        setMessages(prev => [...prev, msg1, bot1, msg2, bot2]);
        speakText(bot2Text);

        try {
          await bookSurgeryApi({
            doctor_id: 'DOC001',
            doctor_name: 'Dr. Sarah Jenkins',
            patient_id: 'pat001',
            patient_name: 'Robert Johnson',
            procedure_name: 'Cardiology Consultation',
            operating_theater: 'OPD Clinic 3',
            scheduled_time: 'Aug 23 at 10:00 AM',
            patient_notes: 'First Time Patient — Severe headache, sore throat, and vomiting sensation',
            is_first_time: 1,
            readiness_score: 95,
            status: 'SCHEDULED'
          });
        } catch (e) {
          console.error(e);
        }

        demoEngine.setIsExecutingAction(false);
      }, 800);
      return;
    }

    // Step 4: Return to Patient & Query Dental Implantation Insurance
    if (demo.currentStepIndex === 3) {
      demoExecutedStepRef.current = 3;
      setIsOpen(true);
      demoEngine.setIsExecutingAction(true, 'Analyzing Star Health PPO policy for Dental Implantation coverage & costs...');

      setTimeout(async () => {
        const qMsg: Message = {
          id: `usr_${Date.now()}`,
          sender: 'user',
          text: "I am in a plan of dental implantation. How much will it cost and will my insurance cover that?",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };

        const aMsgText = "💳 **Insurance Scheme & Financial Cost Analysis**:\n• **Procedure**: Dental Implantation & Maxillofacial Alignment\n• **Estimated Treatment Cost**: ₹45,000\n• **Active Coverage**: Star Health Comprehensive Gold PPO (₹5,00,000 limit)\n• **Policy Scheme Rule**: Dental implantation is excluded under standard health insurance coverage (requires cosmetic/trauma add-on clause).\n• **Out-of-Pocket / External Cost (CI)**: ₹45,000 (Direct Patient Out-of-Pocket Payment Required)\n\nCan I book a session for a pre-op diagnostic scan for your dental evaluation?";
        const aMsg: Message = {
          id: `bot_${Date.now()}`,
          sender: 'bot',
          text: aMsgText,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };

        setMessages(prev => [...prev, qMsg, aMsg]);
        speakText(aMsgText);
        demoEngine.setIsExecutingAction(false);
      }, 800);
      return;
    }

    // Step 5: Confirm Pre-Op Dental Scan Order
    if (demo.currentStepIndex === 4) {
      demoExecutedStepRef.current = 4;
      setIsOpen(true);
      demoEngine.setIsExecutingAction(true, 'Ordering Pre-Op Dental & Maxillofacial CT Scan...');

      setTimeout(async () => {
        const confirmMsg: Message = {
          id: `usr_${Date.now()}`,
          sender: 'user',
          text: "Yes, book a scan",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };

        const scanDoneText = "🔬 **Pre-Op Diagnostic Scan Booked**: Pre-Op Dental & Maxillofacial CT Scan ordered for Robert Johnson and dispatched to Lab Tech Workspace! You will receive a notification when the report is ready.";
        const scanDoneMsg: Message = {
          id: `bot_${Date.now()}`,
          sender: 'bot',
          text: scanDoneText,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };

        setMessages(prev => [...prev, confirmMsg, scanDoneMsg]);
        speakText(scanDoneText);

        try {
          await orderScanApi({
            doctor_id: 'DOC001',
            doctor_name: 'Dr. Sarah Jenkins',
            patient_id: 'pat001',
            patient_name: 'Robert Johnson',
            scan_name: 'Pre-Op Dental & Maxillofacial CT Scan',
            body_part: 'Dental / Maxillofacial',
            priority: 'ROUTINE',
            status: 'PENDING',
            uploaded_by: 'Patient Chatbot AI'
          });
        } catch (e) {
          console.error(e);
        }

        demoEngine.setIsExecutingAction(false);
      }, 800);
      return;
    }
  }, [demo.isActive, demo.demoMode, demo.currentStepIndex, demo.isPaused]);

  // Web Speech API (STT - Speech to Text) with Bluetooth Headset MediaDevices Routing
  const toggleListening = async () => {
    if (typeof window === 'undefined') return;
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in this browser. Please use Google Chrome or Microsoft Edge.');
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          stream.getTracks().forEach(track => track.stop());
        } catch (e) {
          console.warn('Bluetooth/Microphone device permission requested:', e);
        }
      }

      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = lang === 'hi' ? 'hi-IN' : lang === 'ta' ? 'ta-IN' : 'en-US';

      recognition.onstart = () => setIsListening(true);
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
        setIsListening(false);
      };
      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);

      recognition.start();
    } catch (err) {
      console.error('Speech recognition error:', err);
      setIsListening(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAttachedDocName(file.name);
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const uploadPrompt = `[UPLOADED CLAIM DOCUMENT: ${file.name}]\nContent preview: ${content ? content.slice(0, 500) : "Medical bill claim form for cardiac procedure and diagnostic radiology scans."}\n\nPlease check my claim capability and calculate how much my policy covers versus my out-of-pocket cost.`;
      setInput(uploadPrompt);
    };
    reader.readAsText(file);
  };

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || loading) return;

    // Trigger Patient Demo if prompt is 'wake up and give demo'
    if (input.toLowerCase().includes("wake up") && input.toLowerCase().includes("demo")) {
      setInput('');
      if (!demo.isActive) {
        demoEngine.startDemo('PATIENT_DEMO');
      }
      return;
    }

    const currentDoc = attachedDocName;
    const userMsg: Message = {
      id: `usr_${Date.now()}`,
      sender: 'user',
      text: input,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      docAttached: currentDoc || undefined
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setAttachedDocName(null);
    setLoading(true);

    try {
      const res = await sendPatientChatPrompt(patientId, userMsg.text, cashThreshold, lang);
      const botResponseText = res.response || 'I am processing your inquiry.';
      const botMsg: Message = {
        id: `bot_${Date.now()}`,
        sender: 'bot',
        text: botResponseText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, botMsg]);
      
      speakText(botResponseText);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating Trigger Button (Bottom Right) - High-Contrast Dark Circle on Light Canvas */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          title="Open AI Healthcare Navigator"
          className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-zinc-900 text-white border border-zinc-700 shadow-2xl hover:bg-zinc-800 active:scale-95 transition-all"
        >
          <Sparkles className="h-6 w-6 text-white" />
        </button>
      )}

      {/* Chat Window Overlay */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-full max-w-md rounded-2xl border border-zinc-200 bg-white shadow-2xl overflow-hidden flex flex-col h-[580px] animate-slide-up text-zinc-900">
          {/* Header */}
          <div className="flex items-center justify-between bg-zinc-900 p-4 text-white">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-800 border border-zinc-700">
                <Bot className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-white">{t.chatbotHeader}</h3>
                <p className="text-[10px] text-zinc-400 flex items-center gap-1">
                  <ShieldCheck className="h-3 w-3 text-zinc-400" /> PII Masked • Redis Memory • 300s TTL Cache • ATS Shield
                </p>
              </div>
            </div>

            {/* Voice Toggle Button */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => {
                  const nextState = !isVoiceActive;
                  setIsVoiceActive(nextState);
                  if (!nextState && typeof window !== 'undefined') window.speechSynthesis.cancel();
                }}
                title={isVoiceActive ? "Disable Voice Agent Output" : "Enable Voice Agent Spoken Audio"}
                className={`p-1.5 rounded-lg border transition ${
                  isVoiceActive
                    ? 'bg-white border-white text-zinc-950 font-bold'
                    : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:text-white'
                }`}
              >
                {isVoiceActive ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
              </button>

              <button
                type="button"
                onClick={() => {
                  if (typeof window !== 'undefined') window.speechSynthesis.cancel();
                  setIsOpen(false);
                }}
                className="p-1 rounded-lg hover:bg-zinc-800 transition text-zinc-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Active Voice Wave Indicator Banner */}
          {(isListening || isSpeaking) && (
            <div className="bg-zinc-100 border-b border-zinc-200 px-4 py-2 flex items-center justify-between text-xs text-zinc-800 font-medium">
              <span className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-zinc-900 animate-ping" />
                {isListening ? 'Voice STT Listening...' : 'AI Spoken Voice Output Active'}
              </span>
              <span className="text-[10px] text-zinc-500 font-mono">Hands-Free</span>
            </div>
          )}

          {/* Messages Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#FAFBFD]">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex gap-2.5 ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {m.sender === 'bot' && (
                  <div className="h-7 w-7 rounded-lg bg-zinc-200 border border-zinc-300 text-zinc-800 flex items-center justify-center font-bold text-[10px] shrink-0 mt-1">
                    AI
                  </div>
                )}

                <div
                  className={`max-w-[84%] rounded-xl p-3.5 text-xs leading-relaxed space-y-2 ${
                    m.sender === 'user'
                      ? 'bg-zinc-900 text-white font-medium rounded-br-none shadow-sm'
                      : 'bg-white border border-zinc-200 text-zinc-800 font-normal rounded-bl-none shadow-[0_1px_2px_rgba(0,0,0,0.02)]'
                  }`}
                >
                  {m.docAttached && (
                    <div className={`flex items-center gap-1.5 text-[10px] font-medium p-1.5 rounded-md border ${
                      m.sender === 'user'
                        ? 'bg-zinc-800 text-zinc-200 border-zinc-700'
                        : 'bg-zinc-100 text-zinc-800 border-zinc-200'
                    }`}>
                      <FileText className="h-3.5 w-3.5 shrink-0" />
                      <span>Attached: {m.docAttached}</span>
                    </div>
                  )}

                  <p className="whitespace-pre-line">{m.text}</p>
                  <span
                    className={`block text-[9px] mt-1 text-right font-mono ${
                      m.sender === 'user' ? 'text-zinc-400' : 'text-zinc-400'
                    }`}
                  >
                    {m.timestamp}
                  </span>
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex items-center gap-2 text-xs text-zinc-600 bg-white p-3 rounded-xl border border-zinc-200 w-fit shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
                <RefreshCw className="h-3.5 w-3.5 animate-spin text-zinc-800" />
                <span>AI Agent analyzing doctor availability & claim capability...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Document Attachment Preview Badge */}
          {attachedDocName && (
            <div className="px-4 py-2 bg-zinc-50 border-t border-zinc-200 text-xs font-medium text-zinc-800 flex items-center justify-between">
              <span className="flex items-center gap-1.5 truncate">
                <FileText className="h-3.5 w-3.5 text-zinc-600 shrink-0" />
                <span className="truncate">Document Ready: {attachedDocName}</span>
              </span>
              <button
                type="button"
                onClick={() => setAttachedDocName(null)}
                className="text-zinc-400 hover:text-zinc-800 ml-2"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          {/* Default Quick Action Suggestion Pill Bar */}
          <div className="px-3 pt-2 pb-1 bg-white border-t border-zinc-100 flex items-center gap-1.5 overflow-x-auto">
            <button
              type="button"
              onClick={() => {
                if (!demo.isActive) {
                  demoEngine.startDemo('PATIENT_DEMO');
                }
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 text-white text-[11px] font-bold shadow-xs hover:bg-zinc-800 transition shrink-0 active:scale-95"
            >
              <Sparkles className="h-3.5 w-3.5 text-white" />
              <span>Wake up and give demo</span>
            </button>
          </div>

          {/* Hidden File Input */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".txt,.pdf,.csv,.doc,.docx,image/*"
            className="hidden"
          />

          {/* Input Footer */}
          <form onSubmit={handleSend} className="p-3 border-t border-zinc-100 bg-white flex items-center gap-2">
            {/* Attachment Button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              title="Upload Claim Document or Medical Bill"
              className="p-2.5 rounded-xl bg-zinc-100 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200 transition"
            >
              <Paperclip className="h-4 w-4" />
            </button>

            {/* STT Voice Input Mic Button */}
            <button
              type="button"
              onClick={toggleListening}
              title={isListening ? "Stop Voice Input" : "Speak to AI Agent (Voice STT)"}
              className={`p-2.5 rounded-xl transition ${
                isListening
                  ? 'bg-zinc-900 text-white font-bold animate-pulse'
                  : 'bg-zinc-100 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200'
              }`}
            >
              {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            </button>

            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Wake up and give demo..."
              className="flex-1 bg-zinc-50 border border-zinc-200 rounded-xl px-3.5 py-2 text-xs text-zinc-900 focus:border-zinc-500 focus:outline-none font-medium shadow-[0_1px_2px_rgba(0,0,0,0.02)]"
            />

            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="p-2.5 rounded-xl bg-zinc-900 text-white hover:bg-zinc-800 disabled:opacity-40 transition active:scale-95 shrink-0 shadow-sm"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
