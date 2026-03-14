import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Paperclip, Send } from "lucide-react";
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
    <div className="space-y-3">
      {blocks.map((block, index) => {
        if (block.type === "heading") {
          const size =
            block.level === 1
              ? "text-lg"
              : block.level === 2
                ? "text-base"
                : "text-sm";
          return (
            <div
              key={`${block.type}-${index}`}
              className={`${size} font-semibold text-slate-100 tracking-tight`}
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
              className={`${listClass} pl-5 space-y-1 text-[15px] leading-6 text-slate-200`}
            >
              {block.items.map((item, itemIndex) => (
                <li key={`${index}-item-${itemIndex}`}>{item}</li>
              ))}
            </ul>
          );
        }
        if (block.type === "code") {
          return (
            <pre
              key={`${block.type}-${index}`}
              className="rounded-lg border border-white/10 bg-slate-950/80 px-3 py-2 text-[13px] leading-5 text-slate-200 overflow-x-auto"
            >
              {block.text}
            </pre>
          );
        }
        if (block.type === "spacer") {
          return <div key={`${block.type}-${index}`} className="h-2" />;
        }
        return (
          <p
            key={`${block.type}-${index}`}
            className="text-[15px] leading-7 text-slate-200 whitespace-pre-wrap"
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
        "Hello! I am your AI Admin Assistant. I can help analyze audit logs, manage user roles, and monitor system security. How can I assist you today?",
      displayContent:
        "Hello! I am your AI Admin Assistant. I can help analyze audit logs, manage user roles, and monitor system security. How can I assist you today?",
      timestamp: now(),
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(
    null
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
            : msg
        )
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
        lastUserMessageRef.current ?? undefined
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
        toast.warning("An action has been queued for your approval", {
          description: "Open Pending Actions to review it.",
          duration: 6000,
        });
      }
    } catch {
      const errMsg: Message = {
        id: (Date.now() + 2).toString(),
        role: "ai",
        content:
          "Warning: I encountered an error while processing your request. Please try again or check the backend logs.",
        displayContent:
          "Warning: I encountered an error while processing your request. Please try again or check the backend logs.",
        timestamp: now(),
        isError: true,
      };
      setMessages((prev) => [...prev, errMsg]);
      toast.error("Failed to reach the AI Agent");
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      <div className="flex flex-wrap items-end justify-between gap-4 mb-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-100">
            Admin Assistant
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Secure, streaming chat for IAM operations and audit insights.
          </p>
        </div>
        <div className="text-xs text-slate-400 border border-white/10 rounded-full px-3 py-1 bg-white/5">
          Session: {user?.username ?? "admin"}
        </div>
      </div>

      <Card className="relative flex-1 flex flex-col overflow-hidden rounded-3xl border border-white/10 bg-slate-950/60 shadow-[0_25px_80px_-40px_rgba(0,0,0,0.8)]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(148,163,184,0.12),_transparent_55%)]" />

        <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-6">
          <div className="mx-auto w-full max-w-3xl space-y-6">
            {messages.map((msg) => {
              const messageText = msg.displayContent ?? msg.content;
              return (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  key={msg.id}
                  className={`flex gap-3 ${
                    msg.role === "user" ? "flex-row-reverse" : ""
                  }`}
                >
                  <div
                    className={`shrink-0 w-9 h-9 rounded-full border flex items-center justify-center text-xs font-semibold ${
                      msg.role === "user"
                        ? "bg-slate-800 text-slate-200 border-white/10"
                        : msg.isError
                          ? "bg-red-500/15 text-red-300 border-red-500/30"
                          : msg.isHitl
                            ? "bg-amber-500/15 text-amber-300 border-amber-500/30"
                            : "bg-white/10 text-slate-100 border-white/10"
                    }`}
                  >
                    {msg.role === "user" ? "You" : msg.isError ? "!" : "AI"}
                  </div>

                  <div
                    className={`max-w-[80%] rounded-2xl px-5 py-4 shadow-sm ${
                      msg.role === "user"
                        ? "bg-slate-800 text-slate-100 border border-white/10 rounded-tr-none"
                        : msg.isHitl
                          ? "bg-amber-500/5 text-slate-100 border border-amber-500/20 rounded-tl-none"
                          : msg.isError
                            ? "bg-red-500/5 text-slate-100 border border-red-500/20 rounded-tl-none"
                            : "bg-white/5 text-slate-100 border border-white/10 rounded-tl-none"
                    }`}
                  >
                    {msg.isHitl && (
                      <div className="text-[10px] uppercase tracking-[0.2em] text-amber-300 mb-2">
                        Approval Required
                      </div>
                    )}
                    <MessageContent content={messageText} />
                    <div
                      className={`text-[10px] mt-3 text-slate-400 ${
                        msg.role === "user" ? "text-right" : "text-left"
                      }`}
                    >
                      {msg.timestamp}
                    </div>
                  </div>
                </motion.div>
              );
            })}

            {isTyping && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex gap-3"
              >
                <div className="shrink-0 w-9 h-9 rounded-full bg-white/10 border border-white/10 flex items-center justify-center text-xs font-semibold text-slate-100">
                  AI
                </div>
                <div className="bg-white/5 border border-white/10 rounded-2xl rounded-tl-none px-5 py-4 flex items-center gap-1.5">
                  {[0, 0.2, 0.4].map((delay, i) => (
                    <motion.div
                      key={i}
                      animate={{ y: [0, -5, 0] }}
                      transition={{ duration: 0.6, repeat: Infinity, delay }}
                      className="w-1.5 h-1.5 bg-slate-300/70 rounded-full"
                    />
                  ))}
                </div>
              </motion.div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        <div className="border-t border-white/10 bg-slate-950/70 px-4 sm:px-8 py-4">
          <form
            onSubmit={handleSendMessage}
            className="mx-auto flex w-full max-w-3xl items-center gap-3 rounded-full border border-white/10 bg-white/5 px-3 py-2 shadow-inner focus-within:ring-1 focus-within:ring-white/20"
          >
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="text-slate-400 hover:text-slate-200 rounded-full shrink-0"
              title="Attach file (coming soon)"
            >
              <Paperclip size={18} />
            </Button>
            <Input
              value={inputValue}
              onChange={(event) => setInputValue(event.target.value)}
              placeholder="Ask the AI agent... for example: List all users"
              className="flex-1 bg-transparent border-none focus-visible:ring-0 shadow-none px-2 h-10 placeholder:text-slate-500"
              disabled={isTyping}
            />
            <Button
              type="submit"
              disabled={!inputValue.trim() || isTyping}
              className="rounded-full w-10 h-10 p-0 shrink-0 bg-white text-slate-950 hover:bg-slate-200"
            >
              <Send size={16} className="ml-0.5" />
            </Button>
          </form>
          <div className="text-center mt-3">
            <span className="text-[10px] text-slate-500">
              Mutating operations require administrator approval via Pending
              Actions.
            </span>
          </div>
        </div>
      </Card>
    </div>
  );
}
