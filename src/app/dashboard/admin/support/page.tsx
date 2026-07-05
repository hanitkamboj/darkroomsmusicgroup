"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { db } from "@/lib/firebase";
import { collection, getDocs, doc, updateDoc, addDoc, query, orderBy, onSnapshot, serverTimestamp } from "firebase/firestore";
import { useAuth } from "@/contexts/AuthContext";
import toast from "react-hot-toast";
import { Ticket, MessageSquare, Send, User, Search, Clock, CheckCircle, AlertCircle } from "lucide-react";

export default function AdminSupportPage() {
  const { userData } = useAuth();
  const [tickets, setTickets] = useState<any[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadTickets();
  }, []);

  useEffect(() => {
    if (selectedTicket) {
      const q = query(collection(db, "tickets", selectedTicket.id, "messages"), orderBy("createdAt", "asc"));
      const unsub = onSnapshot(q, (snapshot) => {
        setMessages(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
      });
      return unsub;
    }
  }, [selectedTicket]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const loadTickets = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, "tickets"), orderBy("createdAt", "desc"));
      const snapshot = await getDocs(q);
      setTickets(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (err) {
      toast.error("Failed to load tickets");
    }
    setLoading(false);
  };

  const handleSendMessage = async () => {
    if (!message.trim() || !selectedTicket) return;
    try {
      await addDoc(collection(db, "tickets", selectedTicket.id, "messages"), {
        text: message,
        senderId: userData?.uid,
        senderName: userData?.displayName,
        senderRole: userData?.role,
        createdAt: serverTimestamp(),
      });
      await updateDoc(doc(db, "tickets", selectedTicket.id), {
        lastMessage: message,
        lastMessageAt: serverTimestamp(),
        status: "active",
      });
      setMessage("");
      loadTickets();
    } catch (err) {
      toast.error("Failed to send message");
    }
  };

  const handleCloseTicket = async (ticket: any) => {
    try {
      await updateDoc(doc(db, "tickets", ticket.id), { status: "closed" });
      toast.success("Ticket closed");
      loadTickets();
    } catch (err) {
      toast.error("Failed to close ticket");
    }
  };

  const statusColors: Record<string, string> = {
    open: "text-green-400 bg-green-500/10",
    active: "text-blue-400 bg-blue-500/10",
    closed: "text-zinc-400 bg-zinc-500/10",
  };

  return (
    <div className="h-[calc(100vh-6rem)] flex gap-4">
      <div className="w-80 flex-shrink-0 space-y-3 overflow-y-auto scrollbar-hide">
        <h2 className="text-lg font-bold">Support Tickets</h2>
        {loading ? (
          <div className="text-center py-8 text-zinc-500">Loading...</div>
        ) : tickets.length === 0 ? (
          <div className="text-center py-8 text-zinc-500">
            <Ticket className="w-8 h-8 mx-auto mb-2 text-zinc-600" />
            <p className="text-sm">No tickets yet</p>
          </div>
        ) : (
          tickets.map((ticket) => (
            <div key={ticket.id} onClick={() => setSelectedTicket(ticket)}
              className={`p-3 rounded-xl border cursor-pointer transition-all ${
                selectedTicket?.id === ticket.id
                  ? "bg-purple-600/10 border-purple-500/30"
                  : "bg-white/[0.03] border-white/[0.06] hover:border-purple-500/20"
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <h4 className="text-sm font-medium truncate">{ticket.subject}</h4>
                <span className={`px-2 py-0.5 rounded-full text-[10px] capitalize ${statusColors[ticket.status] || ""}`}>
                  {ticket.status}
                </span>
              </div>
              <p className="text-xs text-zinc-500 truncate">{ticket.userName}</p>
              <p className="text-[10px] text-zinc-600 mt-1">{ticket.lastMessage?.slice(0, 50)}...</p>
            </div>
          ))
        )}
      </div>

      <div className="flex-1 rounded-xl bg-white/[0.03] border border-white/[0.06] flex flex-col overflow-hidden">
        {selectedTicket ? (
          <>
            <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
              <div>
                <h3 className="font-semibold">{selectedTicket.subject}</h3>
                <p className="text-xs text-zinc-500">
                  {selectedTicket.userName} • {selectedTicket.category} • Created {selectedTicket.createdAt?.toDate?.()?.toLocaleDateString() || ""}
                </p>
              </div>
              {selectedTicket.status !== "closed" && (
                <button onClick={() => handleCloseTicket(selectedTicket)}
                  className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-xs flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" /> Close
                </button>
              )}
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-hide">
              {messages.length === 0 && (
                <div className="text-center py-12 text-zinc-500">
                  <MessageSquare className="w-8 h-8 mx-auto mb-2 text-zinc-600" />
                  <p className="text-sm">No messages yet. Start the conversation.</p>
                </div>
              )}
              {messages.map((msg, i) => (
                <div key={msg.id || i} className={`flex ${msg.senderId === userData?.uid ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[70%] p-3 rounded-xl ${
                    msg.senderId === userData?.uid
                      ? "bg-purple-600/20 border border-purple-500/20"
                      : "bg-zinc-800/50 border border-zinc-700/30"
                  }`}>
                    <p className="text-xs text-zinc-400 mb-1">{msg.senderName} ({msg.senderRole})</p>
                    <p className="text-sm">{msg.text}</p>
                    <p className="text-[10px] text-zinc-600 mt-1">
                      {msg.createdAt?.toDate?.()?.toLocaleTimeString() || ""}
                    </p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            <div className="p-4 border-t border-zinc-800">
              <div className="flex gap-3">
                <input type="text" value={message} onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                  placeholder="Type your message..."
                  className="flex-1 px-4 py-2.5 bg-white/5 border border-zinc-700 rounded-lg text-white text-sm focus:outline-none focus:border-purple-500" />
                <button onClick={handleSendMessage} disabled={!message.trim()}
                  className="px-4 py-2.5 bg-purple-600 hover:bg-purple-500 disabled:bg-purple-800 rounded-lg transition-colors">
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-zinc-500">
            <div className="text-center">
              <MessageSquare className="w-12 h-12 mx-auto mb-3 text-zinc-700" />
              <p>Select a ticket to view conversation</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
