"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { db } from "@/lib/firebase";
import { collection, getDocs, addDoc, query, orderBy, onSnapshot, serverTimestamp, doc, updateDoc, where } from "firebase/firestore";
import { useAuth } from "@/contexts/AuthContext";
import toast from "react-hot-toast";
import { Ticket, MessageSquare, Send, Plus, X, ChevronRight } from "lucide-react";

export default function SupportPage() {
  const { userData } = useAuth();
  const [tickets, setTickets] = useState<any[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [message, setMessage] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [newSubject, setNewSubject] = useState("");
  const [newCategory, setNewCategory] = useState("General");
  const [newDescription, setNewDescription] = useState("");
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!userData) return;
    const q = query(collection(db, "tickets"), where("userId", "==", userData.uid), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snapshot) => {
      setTickets(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return unsub;
  }, [userData]);

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

  const createTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubject.trim() || !newDescription.trim()) {
      toast.error("Please fill in all fields");
      return;
    }
    try {
      const docRef = await addDoc(collection(db, "tickets"), {
        subject: newSubject,
        category: newCategory,
        description: newDescription,
        status: "open",
        userId: userData?.uid,
        userName: userData?.displayName,
        userEmail: userData?.email,
        createdAt: serverTimestamp(),
        lastMessage: newDescription,
        lastMessageAt: serverTimestamp(),
      });
      await addDoc(collection(db, "tickets", docRef.id, "messages"), {
        text: newDescription,
        senderId: userData?.uid,
        senderName: userData?.displayName,
        senderRole: userData?.role,
        createdAt: serverTimestamp(),
      });
      toast.success("Ticket created! Support will respond shortly.");
      setShowNew(false);
      setNewSubject("");
      setNewDescription("");
    } catch (err) {
      toast.error("Failed to create ticket");
    }
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
    } catch (err) {
      toast.error("Failed to send message");
    }
  };

  const statusColors: Record<string, string> = {
    open: "text-green-400 bg-green-500/10",
    active: "text-blue-400 bg-blue-500/10",
    closed: "text-zinc-400 bg-zinc-500/10",
  };

  return (
    <div className="h-[calc(100vh-6rem)] flex gap-4">
      <div className="w-72 flex-shrink-0 space-y-3 overflow-y-auto scrollbar-hide">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">My Tickets</h2>
          <button onClick={() => setShowNew(!showNew)}
            className="p-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 transition-colors">
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {showNew && (
          <motion.form initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
            onSubmit={createTicket} className="p-3 rounded-xl bg-purple-600/10 border border-purple-500/30 space-y-2"
          >
            <input type="text" value={newSubject} onChange={(e) => setNewSubject(e.target.value)}
              placeholder="Subject" className="w-full px-3 py-2 bg-white/5 border border-zinc-700 rounded-lg text-white text-sm focus:outline-none focus:border-purple-500" />
            <select value={newCategory} onChange={(e) => setNewCategory(e.target.value)}
              className="w-full px-3 py-2 bg-white/5 border border-zinc-700 rounded-lg text-white text-sm focus:outline-none focus:border-purple-500">
              <option value="General">General</option>
              <option value="Technical">Technical</option>
              <option value="Billing">Billing</option>
              <option value="Distribution">Distribution</option>
              <option value="Other">Other</option>
            </select>
            <textarea value={newDescription} onChange={(e) => setNewDescription(e.target.value)}
              placeholder="Describe your issue..." rows={3}
              className="w-full px-3 py-2 bg-white/5 border border-zinc-700 rounded-lg text-white text-sm focus:outline-none focus:border-purple-500" />
            <button type="submit" className="w-full py-2 bg-purple-600 hover:bg-purple-500 rounded-lg text-sm">Submit</button>
          </motion.form>
        )}

        {loading ? (
          <div className="text-center py-8 text-zinc-500">Loading...</div>
        ) : tickets.length === 0 && !showNew ? (
          <div className="text-center py-8 text-zinc-500">
            <Ticket className="w-8 h-8 mx-auto mb-2 text-zinc-600" />
            <p className="text-sm">No tickets yet</p>
            <button onClick={() => setShowNew(true)} className="text-xs text-purple-400 mt-2">Create one →</button>
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
              <p className="text-xs text-zinc-500 truncate">{ticket.lastMessage?.slice(0, 50)}</p>
            </div>
          ))
        )}
      </div>

      <div className="flex-1 rounded-xl bg-white/[0.03] border border-white/[0.06] flex flex-col overflow-hidden">
        {selectedTicket ? (
          <>
            <div className="p-4 border-b border-zinc-800">
              <h3 className="font-semibold">{selectedTicket.subject}</h3>
              <p className="text-xs text-zinc-500">{selectedTicket.category} • {selectedTicket.status}</p>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-hide">
              {messages.map((msg, i) => (
                <div key={msg.id || i} className={`flex ${msg.senderId === userData?.uid ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[70%] p-3 rounded-xl ${
                    msg.senderId === userData?.uid
                      ? "bg-purple-600/20 border border-purple-500/20"
                      : "bg-zinc-800/50 border border-zinc-700/30"
                  }`}>
                    <p className="text-xs text-zinc-400 mb-1">
                      {msg.senderName} {msg.senderRole !== userData?.role && "(Support)"}
                    </p>
                    <p className="text-sm">{msg.text}</p>
                    <p className="text-[10px] text-zinc-600 mt-1">
                      {msg.createdAt?.toDate?.()?.toLocaleTimeString() || ""}
                    </p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {selectedTicket.status !== "closed" && (
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
            )}
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-zinc-500">
            <div className="text-center">
              <MessageSquare className="w-12 h-12 mx-auto mb-3 text-zinc-700" />
              <p>Select a ticket or create a new one</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
