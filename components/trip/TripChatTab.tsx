"use client";

import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { format } from "date-fns";
import { MessageSquare, Send } from "lucide-react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import UserAvatar from "../UserAvatar";

export default function TripChatTab({ tripId }: { tripId: Id<"trips"> }) {
  const [msg, setMsg] = useState("");
  const messages = useQuery(api.messages.list, { tripId });
  const sendMessage = useMutation(api.messages.send);
  const [isSending, setIsSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages?.length]);

  const handleSubmit = async () => {
    if (!msg.trim()) {
      return;
    }

    setIsSending(true);
    setSendError(null);

    try {
      await sendMessage({ tripId, text: msg });
      setMsg("");
    } catch (error) {
      console.error(error);
      setSendError("Message could not be sent. Please try again.");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-[#171717] text-white shadow-[0_24px_60px_rgba(0,0,0,0.28)]">
      <div className="flex h-[clamp(32rem,62vh,40rem)] flex-col">
        <div className="border-b border-white/10 px-5 py-4 sm:px-6">
          <p className="section-kicker">Chat</p>
        </div>

        <div className="hide-scrollbar flex-1 overflow-y-auto p-5 sm:p-6">
          {messages === undefined ? (
            <div className="flex h-full items-center justify-center">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-stone-300 border-t-stone-900/60" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <div className="trip-glass-icon-button flex h-14 w-14 items-center justify-center text-white">
                <MessageSquare className="h-6 w-6" />
              </div>
              <p className="mt-4 font-serif text-3xl tracking-[-0.04em] text-white">
                No messages yet
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message) => (
                <article
                  key={message._id}
                  className="grid grid-cols-[auto_1fr] gap-3 rounded-[1.5rem] border border-white/10 bg-white/[0.05] px-4 py-4"
                >
                  <UserAvatar
                    name={message.senderName}
                    image={message.senderImage}
                    seed={message.senderUserId || message.senderName}
                    size={42}
                  />

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                      <p className="text-sm font-semibold text-white">
                        {message.senderName}
                      </p>
                      <span className="text-xs uppercase tracking-[0.14em] text-white/36">
                        {format(new Date(message._creationTime), "HH:mm")}
                      </span>
                    </div>

                    <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-white/72">
                      {message.text}
                    </p>
                  </div>
                </article>
              ))}
              <div ref={bottomRef} />
            </div>
          )}
        </div>

        <div className="border-t border-white/10 bg-white/[0.03] p-4 sm:p-5">
          <form
            onSubmit={(event) => {
              event.preventDefault();
              void handleSubmit();
            }}
            className="grid gap-3 sm:grid-cols-[1fr_auto]"
          >
            <textarea
              rows={2}
              value={msg}
              onChange={(event) => setMsg(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  void handleSubmit();
                }
              }}
              placeholder="Write to the group"
              aria-label="Write to the group"
              disabled={isSending}
              className="editorial-input editorial-textarea min-h-[7rem]"
            />

            <button
              type="submit"
              disabled={isSending}
              className="trip-glass-button h-[3.5rem] justify-center self-end px-5 py-3 text-[0.68rem] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSending ? "Sending..." : "Send"}
              <Send className="h-4 w-4" />
            </button>
          </form>

          {sendError ? (
            <p
              className="mt-3 text-sm text-rose-600"
              role="status"
              aria-live="polite"
            >
              {sendError}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
