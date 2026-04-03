import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Paperclip,
  Send,
  Bot,
  Sparkles,
  Terminal,
  Activity,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/api";

type Message = {
  id: string;
  role: "user" | "ai";
  content: string;
  displayContent?: string;
  timestamp: string;
  isHitl?: boolean;
  isError?: boolean;
  isStreaming?: boolean;
};

type ContentBlock =
  | { type: "heading"; level: number; text: string }
  | { type: "paragraph"; text: string }
  | { type: "list"; ordered: boolean; items: string[] }
  | { type: "code"; text: string }
  | { type: "spacer" };

const STREAM_INTERVAL_MS = 18;
const STREAM_CHUNK = 3;
const GREETING_PATTERN =
  /^(hi|hello|hey|hi there|hello there|good (morning|afternoon|evening))\b/i;

function now() {
  return new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function isHitlMessage(text: string): boolean {
  return text.startsWith("\u23f8") || text.includes("Pending Action ID:");
}

function normalizeAiResponse(text: string, lastUserMessage?: string) {
  let cleaned = text.trim();
  if (lastUserMessage && GREETING_PATTERN.test(lastUserMessage.trim())) {
    cleaned = cleaned.replace(/^understood\b[.!,:-]?\s*/i, "");
  }
  return cleaned;
}

function stripInlineMarkdown(text: string) {
  let output = text;
  output = output.replace(/`{1,3}([^`]+)`{1,3}/g, "$1");
  output = output.replace(/\*\*(.*?)\*\*/g, "$1");
  output = output.replace(/__(.*?)__/g, "$1");
  output = output.replace(/\*(.*?)\*/g, "$1");
  output = output.replace(/_(.*?)_/g, "$1");
  output = output.replace(/!\[(.*?)\]\((.*?)\)/g, "$1");
  output = output.replace(/\[(.*?)\]\((.*?)\)/g, "$1");
  return output;
}

function parseContentBlocks(content: string): ContentBlock[] {
  const lines = content.split(/\r?\n/);
  const blocks: ContentBlock[] = [];
  let i = 0;

  while (i < lines.length) {
    const rawLine = lines[i];
    const trimmed = rawLine.trim();

    if (!trimmed) {
      blocks.push({ type: "spacer" });
      i += 1;
      continue;
    }

    if (trimmed.startsWith("```")) {
      const codeLines: string[] = [];
      i += 1;
      while (i < lines.length && !lines[i].trim().startsWith("```")) {
        codeLines.push(lines[i]);
        i += 1;
      }
      if (i < lines.length) {
        i += 1;
      }
      blocks.push({ type: "code", text: codeLines.join("\n") });
      continue;
    }

    const headingMatch = rawLine.match(/^\s*(#{1,4})\s+(.*)$/);
    if (headingMatch) {
      blocks.push({
        type: "heading",
        level: headingMatch[1].length,
        text: stripInlineMarkdown(headingMatch[2].trim()),
      });
      i += 1;
      continue;
    }

    const orderedMatch = rawLine.match(/^\s*\d+[.)]\s+(.*)$/);
    if (orderedMatch) {
      const items: string[] = [];
      while (i < lines.length) {
        const match = lines[i].match(/^\s*\d+[.)]\s+(.*)$/);
        if (!match) break;
        items.push(stripInlineMarkdown(match[1].trim()));
        i += 1;
      }
      blocks.push({ type: "list", ordered: true, items });
      continue;
    }

    const unorderedMatch = rawLine.match(/^\s*[-*+]\s+(.*)$/);
    if (unorderedMatch) {
      const items: string[] = [];
      while (i < lines.length) {
        const match = lines[i].match(/^\s*[-*+]\s+(.*)$/);
        if (!match) break;
        items.push(stripInlineMarkdown(match[1].trim()));
        i += 1;
      }
      blocks.push({ type: "list", ordered: false, items });
      continue;
    }

    if (trimmed.startsWith(">")) {
      blocks.push({
        type: "paragraph",
        text: stripInlineMarkdown(trimmed.replace(/^>\s?/, "")),
      });
      i += 1;
      continue;
    }

    const paragraphLines: string[] = [stripInlineMarkdown(trimmed)];
    i += 1;
    while (i < lines.length) {
      const nextLine = lines[i];
      const nextTrimmed = nextLine.trim();
      if (!nextTrimmed) break;
      if (
        nextTrimmed.startsWith("```") ||
        /^\s*(#{1,4})\s+/.test(nextLine) ||
        /^\s*[-*+]\s+/.test(nextLine) ||
        /^\s*\d+[.)]\s+/.test(nextLine) ||
        nextTrimmed.startsWith(">")
      ) {
        break;
      }
      paragraphLines.push(stripInlineMarkdown(nextTrimmed));
      i += 1;
    }
    blocks.push({ type: "paragraph", text: paragraphLines.join(" ") });
  }

  const compacted: ContentBlock[] = [];
  for (const block of blocks) {
    if (
      block.type === "spacer" &&
      (compacted.length === 0 ||
        compacted[compacted.length - 1].type === "spacer")
    ) {
      continue;
    }
    compacted.push(block);
  }

  return compacted;
}

function MessageContent({ content }: { content: string }) {
  const blocks = parseContentBlocks(content);

  return (
    <div className="space-y-4">
      {blocks.map((block, index) => {
        if (block.type === "heading") {
          const size =
            block.level === 1
              ? "text-xl font-black"
              : block.level === 2
                ? "text-lg font-bold"
                : "text-base font-bold";
          return (
            <div
              key={`${block.type}-${index}`}
              className={`${size} text-white uppercase tracking-tight mt-4 first:mt-0`}
            >
              {block.text}
            </div>
          );
        }
        if (block.type === "list") {
          const listClass = block.ordered ? "list-decimal" : "list-disc";
          return (
            <ul
              key={`${block.type}-${index}`}
              className={`${listClass} pl-6 space-y-2 text-[15px] leading-relaxed text-slate-300`}
            >
              {block.items.map((item, itemIndex) => (
                <li key={`${index}-item-${itemIndex}`} className="pl-1">
                  {item}
                </li>
              ))}
            </ul>
          );
        }
        if (block.type === "code") {
          return (
            <div key={`${block.type}-${index}`} className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/20 to-purple-500/20 rounded-xl blur opacity-30" />
              <pre className="relative rounded-xl border border-white/10 bg-black/60 px-5 py-4 text-[13px] font-mono leading-relaxed text-emerald-400/90 overflow-x-auto custom-scrollbar">
                {block.text}
              </pre>
            </div>
          );
        }
        if (block.type === "spacer") {
          return <div key={`${block.type}-${index}`} className="h-4" />;
        }
        return (
          <p
            key={`${block.type}-${index}`}
            className="text-[15px] leading-relaxed text-slate-200/90 whitespace-pre-wrap"
          >
            {block.text}
          </p>
        );
      })}
    </div>
  );
}

export default function AIChatPage() {
  const { user } = useAuth();
  const chatId = String(user?.id ?? user?.username ?? "admin");

  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "ai",
      content:
        "Greetings, Administrator. Core Intelligence Module initialized. I am your specialized Agentic-IAM assistant, prepared to facilitate secure audit analysis, role governance, and predictive system monitoring. State your objective.",
      displayContent:
        "Greetings, Administrator. Core Intelligence Module initialized. I am your specialized Agentic-IAM assistant, prepared to facilitate secure audit analysis, role governance, and predictive system monitoring. State your objective.",
      timestamp: now(),
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(
    null,
  );

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const streamTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const streamingPayloadRef = useRef<{ id: string; text: string } | null>(null);
  const lastUserMessageRef = useRef<string | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  useEffect(() => {
    if (!streamingMessageId || !streamingPayloadRef.current) return;
    const { id, text } = streamingPayloadRef.current;
    let index = 0;

    if (streamTimerRef.current) {
      clearInterval(streamTimerRef.current);
    }

    streamTimerRef.current = setInterval(() => {
      index = Math.min(index + STREAM_CHUNK, text.length);
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === id
            ? {
                ...msg,
                displayContent: text.slice(0, index),
                isStreaming: index < text.length,
              }
            : msg,
        ),
      );
      if (index >= text.length) {
        if (streamTimerRef.current) {
          clearInterval(streamTimerRef.current);
        }
        streamTimerRef.current = null;
        streamingPayloadRef.current = null;
        setStreamingMessageId(null);
      }
    }, STREAM_INTERVAL_MS);

    return () => {
      if (streamTimerRef.current) {
        clearInterval(streamTimerRef.current);
      }
    };
  }, [streamingMessageId]);

  const handleSendMessage = async (event: React.FormEvent) => {
    event.preventDefault();
    const text = inputValue.trim();
    if (!text || isTyping) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: text,
      displayContent: text,
      timestamp: now(),
    };

    lastUserMessageRef.current = text;
    setMessages((prev) => [...prev, userMsg]);
    setInputValue("");
    setIsTyping(true);

    try {
      const { data } = await api.post<{ response: string }>("/agent/chat", {
        chatId,
        message: text,
      });

      const cleaned = normalizeAiResponse(
        data.response,
        lastUserMessageRef.current ?? undefined,
      );

      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "ai",
        content: cleaned,
        displayContent: "",
        timestamp: now(),
        isHitl: isHitlMessage(cleaned),
        isStreaming: true,
      };

      setMessages((prev) => [...prev, aiMsg]);
      streamingPayloadRef.current = { id: aiMsg.id, text: cleaned };
      setStreamingMessageId(aiMsg.id);

      if (aiMsg.isHitl) {
        toast.warning("Strategic Override Queued", {
          description: "Approval required in Pending Actions.",
          duration: 6000,
        });
      }
    } catch {
      const errMsg: Message = {
        id: (Date.now() + 2).toString(),
        role: "ai",
        content:
          "ERR_PROTOCOL_REJECTED: Intelligence interface disrupted. Re-authenticate or audit kernel status.",
        displayContent:
          "ERR_PROTOCOL_REJECTED: Intelligence interface disrupted. Re-authenticate or audit kernel status.",
        timestamp: now(),
        isError: true,
      };
      setMessages((prev) => [...prev, errMsg]);
      toast.error("Transmission Interrupted");
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-10rem)]">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20 shadow-[0_0_20px_rgba(139,92,246,0.2)]">
              <Bot className="h-5 w-5 text-primary" />
            </div>
            <h1 className="text-3xl font-black uppercase tracking-tight text-white">
              Neural Interface
            </h1>
          </div>
          <p className="text-slate-500 font-medium ml-1 flex items-center gap-2">
            <Sparkles className="h-3 w-3 text-primary animate-pulse" />
            Active Session:{" "}
            <span className="font-mono text-primary/80 uppercase tracking-wider">
              {user?.username ?? "admin"}
            </span>
          </p>
        </div>

        <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-white/5 border border-white/10 backdrop-blur-md">
          <div className="flex items-center gap-2">
            <Activity className="h-3 w-3 text-primary animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
              Secure Protocol v2.4
            </span>
          </div>
        </div>
      </header>

      <Card className="flex-1 flex flex-col overflow-hidden glass-card border-white/10 rounded-3xl bg-black/40 shadow-3xl relative">
        {/* Immersive glow effects */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-32 bg-primary/5 blur-[100px] pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-64 h-64 bg-purple-500/5 blur-[120px] pointer-events-none" />

        <div className="flex-1 overflow-y-auto px-6 py-10 custom-scrollbar">
          <div className="max-w-4xl mx-auto space-y-10">
            <AnimatePresence initial={false}>
              {messages.map((msg, idx) => {
                const messageText = msg.displayContent ?? msg.content;
                const isUser = msg.role === "user";
                return (
                  <motion.div
                    initial={{ opacity: 0, y: 20, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{
                      duration: 0.3,
                      delay: idx === messages.length - 1 ? 0 : 0,
                    }}
                    key={msg.id}
                    className={`flex gap-6 ${isUser ? "flex-row-reverse" : "flex-row"}`}
                  >
                    <div
                      className={`shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center border transition-all duration-500 ${
                        isUser
                          ? "bg-primary/10 border-primary/30 text-primary shadow-[0_0_15px_rgba(139,92,246,0.1)]"
                          : msg.isError
                            ? "bg-red-500/10 border-red-500/30 text-red-400"
                            : msg.isHitl
                              ? "bg-amber-500/10 border-amber-500/30 text-amber-400"
                              : "bg-white/5 border-white/10 text-white shadow-[0_0_20px_rgba(255,255,255,0.02)]"
                      }`}
                    >
                      {isUser ? (
                        <div className="font-black text-xs">YOU</div>
                      ) : (
                        <Bot
                          size={22}
                          className={msg.isStreaming ? "animate-pulse" : ""}
                        />
                      )}
                    </div>

                    <div
                      className={`flex flex-col space-y-2 max-w-[85%] ${isUser ? "items-end" : "items-start"}`}
                    >
                      <div
                        className={`p-6 rounded-3xl shadow-2xl relative group transition-all duration-300 ${
                          isUser
                            ? "bg-primary/10 text-white border border-primary/20 rounded-tr-none"
                            : msg.isHitl
                              ? "bg-amber-500/5 text-slate-100 border border-amber-500/20 rounded-tl-none ring-1 ring-amber-500/10"
                              : msg.isError
                                ? "bg-red-500/5 text-slate-100 border border-red-500/20 rounded-tl-none ring-1 ring-red-500/10"
                                : "bg-white/[0.04] text-slate-100 border border-white/10 rounded-tl-none"
                        }`}
                      >
                        {msg.isHitl && (
                          <div className="flex items-center gap-2 mb-4">
                            <div className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-ping" />
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-500">
                              Security Override Required
                            </span>
                          </div>
                        )}

                        <MessageContent content={messageText} />

                        <div
                          className={`absolute top-0 ${isUser ? "-right-1" : "-left-1"} w-2 h-4 overflow-hidden`}
                        >
                          {/* Bubble tail */}
                        </div>
                      </div>

                      <div className="flex items-center gap-3 px-2">
                        <span className="text-[9px] font-mono font-bold text-slate-600 uppercase tracking-widest">
                          {msg.timestamp}
                        </span>
                        {msg.isStreaming && (
                          <div className="flex gap-1">
                            <span className="w-1 h-1 rounded-full bg-primary/40 animate-bounce" />
                            <span className="w-1 h-1 rounded-full bg-primary/40 animate-bounce [animation-delay:0.2s]" />
                            <span className="w-1 h-1 rounded-full bg-primary/40 animate-bounce [animation-delay:0.4s]" />
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>

            {isTyping && !streamingMessageId && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex gap-6"
              >
                <div className="shrink-0 w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
                  <Bot size={22} className="text-slate-500 animate-pulse" />
                </div>
                <div className="bg-white/5 border border-white/10 rounded-3xl rounded-tl-none px-8 py-6 flex items-center gap-3 shadow-xl">
                  {[0, 0.2, 0.4].map((delay, i) => (
                    <motion.div
                      key={i}
                      animate={{ scale: [1, 1.5, 1], opacity: [0.3, 1, 0.3] }}
                      transition={{ duration: 1, repeat: Infinity, delay }}
                      className="w-2 h-2 bg-primary/60 rounded-full"
                    />
                  ))}
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-2 italic">
                    Thinking...
                  </span>
                </div>
              </motion.div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        <div className="p-8 bg-black/20 border-t border-white/5 backdrop-blur-3xl">
          <div className="max-w-4xl mx-auto">
            <form
              onSubmit={handleSendMessage}
              className="relative flex items-center group"
            >
              <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/40 to-purple-500/40 rounded-[2rem] blur opacity-20 group-focus-within:opacity-40 transition-opacity duration-500" />

              <div className="relative flex-1 flex items-center gap-3 bg-white/[0.03] border border-white/10 hover:border-white/20 transition-all rounded-[1.8rem] px-4 py-2 ring-1 ring-white/5 focus-within:ring-primary/30">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="text-slate-500 hover:text-primary rounded-2xl shrink-0 transition-colors"
                >
                  <Paperclip size={20} />
                </Button>

                <Input
                  value={inputValue}
                  onChange={(event) => setInputValue(event.target.value)}
                  placeholder="Transmit objective command..."
                  className="flex-1 bg-transparent border-none focus-visible:ring-0 shadow-none px-2 h-12 text-slate-200 placeholder:text-slate-600 font-medium"
                  disabled={isTyping}
                />

                <Button
                  type="submit"
                  disabled={!inputValue.trim() || isTyping}
                  className="rounded-2xl w-12 h-12 p-0 shrink-0 bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20 transition-transform active:scale-95 disabled:grayscale disabled:opacity-50"
                >
                  <Send
                    size={18}
                    className="translate-x-0.5 -translate-y-0.5"
                  />
                </Button>
              </div>
            </form>

            <div className="flex items-center justify-center gap-4 mt-4">
              <div className="flex items-center gap-2 opacity-40">
                <Terminal size={10} className="text-slate-400" />
                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500">
                  Kernel: LLD_IAM_v4
                </span>
              </div>
              <div className="h-1 w-1 rounded-full bg-slate-800" />
              <div className="flex items-center gap-2 opacity-40">
                <AlertCircle size={10} className="text-slate-400" />
                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500">
                  Mutations restricted to admin tier
                </span>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
