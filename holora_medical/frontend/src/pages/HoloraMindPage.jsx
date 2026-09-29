import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowUp, Bot, Library, PanelLeft, Plus, Search, Sparkles, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";
import { holoraMindService } from "../services/holoraMindService";

const PATIENT_SUGGESTIONS = [
  { key: "prep", defaultValue: "I want to prepare for my upcoming appointment." },
  { key: "symptoms", defaultValue: "I have some symptoms and need initial guidance." },
  { key: "medication", defaultValue: "Can you explain my medication and possible side effects?" },
  { key: "wellness", defaultValue: "Give me general wellness and prevention tips." },
];

const DOCTOR_SUGGESTIONS = [
  { key: "differential", defaultValue: "Help me build a differential diagnosis for these symptoms." },
  { key: "protocol", defaultValue: "What is the latest treatment protocol for Type 2 Diabetes?" },
  { key: "imaging", defaultValue: "Analyze this lab result pattern and suggest next steps." },
  { key: "workflow", defaultValue: "Suggest ways to optimize my clinic workflow." },
];

const SIDEBAR_ITEMS = [
  { label: "Agents", icon: Bot },
  { label: "Search", icon: Search },
  { label: "Library", icon: Library },
];

const normalizeArray = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
};

/* accent helpers based on role */
const ACCENT = {
  doctor: { bg: "bg-cyan-500", hover: "hover:bg-cyan-600", hoverText: "hover:text-cyan-500", ring: "focus-within:ring-cyan-500/20", shadow: "shadow-cyan-500/20", text: "text-cyan-500", bgLight: "bg-cyan-500/10", border: "border-cyan-500/30", activeBg: "bg-[#0E3A52]" },
  patient: { bg: "bg-rose-500", hover: "hover:bg-rose-600", hoverText: "hover:text-rose-500", ring: "focus-within:ring-rose-500/20", shadow: "shadow-rose-500/20", text: "text-rose-500", bgLight: "bg-rose-500/10", border: "border-rose-500/30", activeBg: "bg-[#2B1D1F]" },
};

const HoloraMindPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const isDoctor = user?.role === "doctor";
  const a = isDoctor ? ACCENT.doctor : ACCENT.patient;
  const homePath = isDoctor ? "/doctor" : "/patient";
  const suggestions = isDoctor ? DOCTOR_SUGGESTIONS : PATIENT_SUGGESTIONS;

  const [chats, setChats] = useState([]);
  const [messages, setMessages] = useState([]);
  const [currentChatId, setCurrentChatId] = useState(null);
  const [input, setInput] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    if (typeof window === "undefined") return true;
    return window.innerWidth >= 1024;
  });
  const [isLoadingChats, setIsLoadingChats] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState("");

  const textareaRef = useRef(null);
  const messagesEndRef = useRef(null);

  const refreshChats = useCallback(async () => {
    setIsLoadingChats(true);
    try {
      const data = await holoraMindService.getChats();
      setChats(normalizeArray(data));
    } catch (err) {
      console.error("Failed to fetch chats:", err);
    } finally {
      setIsLoadingChats(false);
    }
  }, []);

  const selectChat = useCallback(async (chatId) => {
    setCurrentChatId(chatId);
    setError("");
    try {
      const data = await holoraMindService.getChatMessages(chatId);
      setMessages(normalizeArray(data));
      if (window.innerWidth < 1024) setIsSidebarOpen(false);
    } catch (_err) {
      console.error("Failed to fetch chat messages:", _err);
      setError(t("holoraMind.errorLoadChat", { defaultValue: "Could not load chat content." }));
    }
  }, [t]);

  const startNewChat = useCallback(() => {
    setCurrentChatId(null);
    setMessages([]);
    setInput("");
    setError("");
    if (window.innerWidth < 1024) setIsSidebarOpen(false);
  }, []);

  useEffect(() => {
    refreshChats();
  }, [refreshChats]);

  useEffect(() => {
    const syncSidebarByViewport = () => {
      setIsSidebarOpen(window.innerWidth >= 1024);
    };
    window.addEventListener("resize", syncSidebarByViewport);
    return () => window.removeEventListener("resize", syncSidebarByViewport);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isSending]);

  useEffect(() => {
    const node = textareaRef.current;
    if (!node) return;
    node.style.height = "auto";
    node.style.height = `${Math.min(node.scrollHeight, 200)}px`;
  }, [input]);

  const activeChatTitle = useMemo(() => {
    const active = chats.find((chat) => chat.id === currentChatId);
    return active?.title || "HoloraMind";
  }, [chats, currentChatId]);

  const handleSend = async (e) => {
    if (e) e.preventDefault();
    const content = input.trim();
    if (!content || isSending) return;

    setInput("");
    setError("");
    const optimisticUserMessage = {
      id: Date.now(),
      role: "user",
      content,
    };
    setMessages((prev) => [...prev, optimisticUserMessage]);
    setIsSending(true);

    try {
      const resp = await holoraMindService.sendMessage(currentChatId, content);
      if (!currentChatId && resp?.chat_id) {
        setCurrentChatId(resp.chat_id);
        refreshChats();
      }
      setMessages((prev) => [
        ...prev,
        { id: Date.now() + 1, role: "assistant", content: resp?.ai_message || "..." },
      ]);
    } catch {
      setError(t("holoraMind.errorConnection", { defaultValue: "API connection error. Please check the server." }));
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const hasMessages = messages.length > 0;

  return (
    <div className="flex h-screen w-full overflow-hidden bg-white text-gray-900 dark:bg-[#0F141F] dark:text-slate-100">
      
      {/* Background Ornaments */}
      <div className="pointer-events-none absolute inset-0 z-0">
        <div className={`absolute left-1/2 top-[-180px] h-[400px] w-[400px] -translate-x-1/2 rounded-full ${a.bgLight} blur-[100px]`} />
        <div className="absolute bottom-[-100px] left-[-80px] h-[250px] w-[250px] rounded-full bg-slate-500/10 blur-[80px]" />
      </div>

      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div 
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 z-[45] bg-black/40 backdrop-blur-[2px] lg:hidden"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex h-full flex-col bg-white/95 border-r border-gray-200 transition-[width,transform] duration-300 ease-in-out dark:bg-[#111827]/96 dark:border-slate-800 lg:relative ${
          isSidebarOpen ? "w-72 translate-x-0" : "w-0 -translate-x-full lg:translate-x-0"
        }`}
      >
        <div className={`flex h-full flex-col px-4 py-5 transition-opacity ${isSidebarOpen ? "opacity-100" : "opacity-0"}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-lg ${a.bg} flex items-center justify-center text-white font-bold`}>H</div>
              <span className="font-semibold text-lg tracking-tight">HoloraMind</span>
            </div>
            <button onClick={() => setIsSidebarOpen(false)} className={`lg:hidden p-2 text-gray-400 dark:text-slate-500 ${a.hoverText}`}>
              <X size={20} />
            </button>
          </div>

          <button
            onClick={startNewChat}
            className={`mt-6 flex items-center justify-center gap-2 rounded-xl ${a.bg} px-4 py-2.5 text-sm font-semibold text-white transition ${a.hover} shadow-lg ${a.shadow}`}
          >
            <Plus size={18} />
            {t("holoraMind.newChat", { defaultValue: "New Chat" })}
          </button>

          <div className="mt-8 flex-1 overflow-y-auto space-y-6 custom-scrollbar pr-1">
            {/* Quick Actions */}
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-slate-500 mb-3 px-1">WORKSPACE</p>
              <div className="space-y-1">
                {SIDEBAR_ITEMS.map((item) => (
                  <div key={item.label} className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800 transition cursor-pointer">
                    <item.icon size={16} />
                    <span>{item.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Chat History */}
            <div>
              <div className="flex items-center justify-between mb-3 px-1">
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-slate-500">HISTORY</p>
                <div className={`w-1.5 h-1.5 rounded-full ${a.bg} animate-pulse`}></div>
              </div>
              <div className="space-y-1.5">
                {isLoadingChats ? (
                  <div className="animate-pulse space-y-2">
                    {[1, 2, 3].map(i => <div key={i} className="h-9 bg-gray-100 dark:bg-slate-800 rounded-lg"></div>)}
                  </div>
                ) : chats.length === 0 ? (
                    <div className="text-xs text-slate-500 px-3 py-4 text-center bg-gray-50/50 dark:bg-slate-800/30 rounded-xl border border-dashed border-gray-200 dark:border-slate-700">
                      {t("holoraMind.noHistory", { defaultValue: "No chat history yet" })}
                    </div>
                ) : (
                  chats.map((chat) => (
                    <button
                      key={chat.id}
                      onClick={() => selectChat(chat.id)}
                      className={`w-full p-2.5 text-left text-xs rounded-xl transition border truncate
                        ${currentChatId === chat.id 
                          ? `bg-white/80 ${a.border} text-gray-900 dark:${a.activeBg} dark:text-white` 
                          : "border-transparent text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-800 dark:text-slate-400"
                        }`}
                    >
                      {chat.title || t("holoraMind.untitled", { defaultValue: "Untitled" })}
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="mt-auto pt-4 border-t dark:border-slate-800">
             <div className="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-800 transition cursor-pointer">
                <div className="w-8 h-8 rounded-lg bg-gray-200 dark:bg-slate-700 flex items-center justify-center text-sm font-bold">
                  {user?.full_name?.charAt(0) || "U"}
                </div>
                <div className="flex-1 overflow-hidden">
                  <p className="text-sm font-semibold truncate">{user?.full_name}</p>
                  <p className="text-[10px] text-gray-500 dark:text-slate-500 uppercase tracking-tight">{user?.role === "super_admin" ? "Master Admin" : user?.role}</p>
                </div>
             </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="relative z-10 flex flex-1 flex-col h-full bg-transparent overflow-hidden">
        
        {/* Header Area */}
        <header className="flex h-14 sm:h-16 shrink-0 items-center justify-between px-3 sm:px-6">
          <div className="flex items-center gap-2 sm:gap-4 min-w-0">
            {!isSidebarOpen && (
              <button 
                onClick={() => setIsSidebarOpen(true)}
                className={`p-2 rounded-lg bg-white border border-gray-200 text-gray-600 hover:${a.text} dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400 shrink-0`}
              >
                <PanelLeft size={18} />
              </button>
            )}
            <div className="min-w-0 hidden xs:block sm:block">
              <span className="text-sm font-semibold text-gray-900 dark:text-slate-100 truncate block max-w-[160px] sm:max-w-none">{activeChatTitle}</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <button onClick={() => navigate(homePath)} className="text-xs font-semibold px-2 sm:px-3 py-1.5 rounded-lg border dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800 whitespace-nowrap">
              <span className="hidden sm:inline">{t("holoraMind.backHome", { defaultValue: "Back Home" })}</span>
              <span className="sm:hidden">← Home</span>
            </button>
            <div className={`hidden xs:flex sm:flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full ${a.bgLight} ${a.text} text-[10px] font-bold uppercase tracking-wider`}>
               <Sparkles size={12} />
               Plus
            </div>
          </div>
        </header>

        {/* Messages Area - SCROLLABLE */}
        <section className="flex-1 overflow-y-auto custom-scrollbar px-3 sm:px-6 pt-3 sm:pt-4 pb-2">
          <div className="mx-auto max-w-3xl space-y-6">
            {!hasMessages ? (
              <div className="py-8 sm:py-20 flex flex-col items-center text-center">
                <div className={`w-12 h-12 sm:w-16 sm:h-16 rounded-2xl ${a.bg} flex items-center justify-center text-white mb-4 sm:mb-6 shadow-xl ${a.shadow}`}>
                  <Bot size={24} className="sm:hidden" />
                  <Bot size={32} className="hidden sm:block" />
                </div>
                <h1 className="text-xl sm:text-3xl font-bold tracking-tight mb-2 sm:mb-4">{t("holoraMind.greeting", { defaultValue: "Hello, I'm HoloraMind" })}</h1>
                <p className="text-sm text-gray-500 dark:text-slate-400 max-w-xs sm:max-w-md mb-6 sm:mb-10">{t("holoraMind.description", { defaultValue: "I can help you analyze symptoms, look up medications, or prepare for your upcoming appointment." })}</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 w-full max-w-2xl">
                  {suggestions.map(s => (
                    <button 
                      key={s.key} 
                      onClick={() => setInput(t(`holoraMind.suggestion.${s.key}`, { defaultValue: s.defaultValue }))}
                      className={`text-left p-3 sm:p-4 rounded-2xl border bg-white/50 backdrop-blur dark:bg-slate-800/30 dark:border-slate-700 hover:${a.border} transition text-xs sm:text-sm text-gray-600 dark:text-slate-300`}
                    >
                      {t(`holoraMind.suggestion.${s.key}`, { defaultValue: s.defaultValue })}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="pb-10 space-y-5">
                {messages.map((msg, i) => (
                  <div key={msg.id || i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div className={`p-4 rounded-2xl text-sm leading-relaxed max-w-[85%] shadow-sm ${
                      msg.role === "user" 
                        ? `${a.bg} text-white rounded-br-none` 
                        : "bg-white dark:bg-slate-800 border dark:border-slate-700 dark:text-slate-200 rounded-bl-none"
                    }`}>
                      {msg.content}
                    </div>
                  </div>
                ))}
                {isSending && (
                  <div className="flex justify-start">
                    <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border dark:border-slate-700 rounded-bl-none animate-pulse text-xs text-gray-500 dark:text-slate-400">
                       {t("holoraMind.thinking", { defaultValue: "HoloraMind is thinking..." })}
                    </div>
                  </div>
                )}
                {error && (
                  <div className="p-3 rounded-xl bg-red-50 text-red-600 border border-red-200 text-xs text-center">
                    {error}
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>
        </section>

        {/* Input Area - PINNED (FIXED AT BOTTOM) */}
        <footer className="shrink-0 px-3 py-3 sm:px-6 sm:py-4 bg-transparent">
          <div className="mx-auto max-w-3xl">
            <form
              onSubmit={handleSend}
              className={`relative rounded-3xl border border-gray-200 bg-white shadow-[0_20px_50px_rgba(0,0,0,0.05)] dark:bg-[#141B29] dark:border-slate-700 dark:shadow-[0_20px_60px_rgba(0,0,0,0.3)] transition-all ${a.ring}`}
            >
              <textarea
                ref={textareaRef}
                rows={1}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={t("holoraMind.placeholder", { defaultValue: "Ask anything..." })}
                className="w-full resize-none bg-transparent px-4 py-3 text-sm focus:outline-none custom-scrollbar max-h-40 min-h-[44px]"
              />
              <div className="flex items-center justify-between px-3 py-2 border-t border-gray-100 dark:border-slate-800">
                <span className="text-[10px] text-gray-400 dark:text-slate-500 font-medium truncate pr-2">
                  HoloraMind v1.0
                  <span className="hidden sm:inline"> • AI-Native Assistant</span>
                </span>
                <button
                  type="submit"
                  disabled={!input.trim() || isSending}
                  className={`inline-flex items-center justify-center rounded-full ${a.bg} w-9 h-9 text-white ${a.hover} active:scale-95 disabled:opacity-40 transition shadow-lg ${a.shadow} shrink-0`}
                >
                  <ArrowUp size={18} strokeWidth={2.5} />
                </button>
              </div>
            </form>
          </div>
        </footer>

      </main>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 5px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #E2E8F0; border-radius: 10px; }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #CBD5E1; }
      `}</style>
    </div>
  );
};

export default HoloraMindPage;
