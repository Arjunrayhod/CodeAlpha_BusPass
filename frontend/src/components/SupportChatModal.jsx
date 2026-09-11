import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, Send, X, ShieldCheck, User, CheckCircle2, Clock, HelpCircle, Sparkles, RefreshCw } from 'lucide-react';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

export default function SupportChatModal({ onClose, onNavigateLogin }) {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [subject, setSubject] = useState('Pass / Booking Query');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const chatContainerRef = useRef(null);

  const fetchMessages = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await api.get('/support/my-messages');
      setMessages(res.data.messages || []);
    } catch (err) {
      console.error('Failed to load support messages', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchMessages();
      const interval = setInterval(fetchMessages, 5000); // Polling every 5s for replies
      return () => clearInterval(interval);
    }
  }, [user]);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages.length]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    if (!user) {
      onClose();
      onNavigateLogin();
      return;
    }

    setSending(true);
    setError('');

    try {
      const res = await api.post('/support/send', {
        subject: subject,
        message: inputText.trim()
      });
      setInputText('');
      setMessages((prev) => [...prev, res.data.data]);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to send query. Please try again.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl border border-slate-200">
        
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-blue-700 via-indigo-800 to-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center shadow-inner">
              <MessageSquare className="w-5 h-5 text-blue-200" />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg">Passenger Help & Query Desk</h3>
              <p className="text-[11px] text-blue-200">Ask questions directly to the Transit Support & Admin team</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-white/10 rounded-xl text-blue-200 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Not Logged In State */}
        {!user ? (
          <div className="p-8 text-center space-y-4 my-auto">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
              <HelpCircle className="w-7 h-7" />
            </div>
            <div>
              <h4 className="font-bold text-slate-800 text-base">Login to Contact Support</h4>
              <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                Please sign in to send queries, track your issues, and receive direct replies from transit administrators.
              </p>
            </div>
            <button
              onClick={() => { onClose(); onNavigateLogin(); }}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-md transition"
            >
              Sign In to Continue
            </button>
          </div>
        ) : (
          <>
            {/* Subject Selector */}
            <div className="px-5 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs shrink-0">
              <span className="font-bold text-slate-500 text-[10px] uppercase">Category</span>
              <select
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="bg-white border border-slate-300 rounded-xl px-3 py-1 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="Pass / Booking Query">Pass / Booking Query</option>
                <option value="Route & Bus Timing Inquiry">Route & Bus Timing Inquiry</option>
                <option value="Student Concession Pass Help">Student Concession Pass Help</option>
                <option value="Cancellation & Seat Change">Cancellation & Seat Change</option>
                <option value="Other Assistance">Other Assistance</option>
              </select>
            </div>

            {/* Chat / Message Stream */}
            <div ref={chatContainerRef} className="flex-1 p-5 overflow-y-auto custom-scrollbar space-y-3.5 bg-slate-50/50">
              {loading && messages.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-xs">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-500" />
                  Loading your conversation history...
                </div>
              ) : messages.length === 0 ? (
                <div className="text-center py-12 px-4 space-y-2">
                  <Sparkles className="w-8 h-8 text-indigo-400 mx-auto" />
                  <p className="font-bold text-slate-700 text-sm">No queries yet</p>
                  <p className="text-xs text-slate-500 max-w-xs mx-auto">
                    Type your question below (e.g. "Can I change my travel date?", "How does the student discount work?").
                  </p>
                </div>
              ) : (
                messages.map((m) => {
                  const isAdmin = m.sender_role === 'admin';
                  return (
                    <div
                      key={m.id}
                      className={`flex flex-col ${isAdmin ? 'items-start' : 'items-end'}`}
                    >
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mb-1 px-1">
                        {isAdmin ? (
                          <>
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                            <span className="font-bold text-emerald-700">Support Admin</span>
                          </>
                        ) : (
                          <>
                            <span className="font-bold text-slate-600">You (Passenger)</span>
                            <User className="w-3 h-3 text-slate-400" />
                          </>
                        )}
                        <span>•</span>
                        <span>{m.created_at ? m.created_at.slice(11, 16) : 'Now'}</span>
                      </div>

                      <div
                        className={`max-w-[85%] p-3.5 rounded-2xl text-xs leading-relaxed shadow-sm ${
                          isAdmin
                            ? 'bg-white border border-slate-200 text-slate-800 rounded-tl-sm'
                            : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-tr-sm'
                        }`}
                      >
                        {m.subject && (
                          <div className={`text-[10px] font-bold uppercase mb-1 pb-1 border-b ${
                            isAdmin ? 'border-slate-100 text-emerald-600' : 'border-white/20 text-blue-200'
                          }`}>
                            {m.subject}
                          </div>
                        )}
                        <p className="whitespace-pre-wrap">{m.message}</p>
                      </div>

                      {isAdmin && (
                        <span className="text-[10px] text-emerald-600 font-bold mt-1 px-1 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Resolved by Admin
                        </span>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Error notice */}
            {error && (
              <div className="px-5 py-2 bg-red-50 text-red-700 text-xs font-medium border-t border-red-100">
                {error}
              </div>
            )}

            {/* Message Input Box */}
            <form onSubmit={handleSendMessage} className="p-3.5 bg-white border-t border-slate-200 flex gap-2 shrink-0">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Type your question or query here..."
                className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs focus:ring-2 focus:ring-blue-500 focus:bg-white focus:outline-none"
              />
              <button
                type="submit"
                disabled={sending || !inputText.trim()}
                className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-2xl shadow-md transition disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
              >
                <span>{sending ? '...' : 'Send'}</span>
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </>
        )}

      </div>
    </div>
  );
}
