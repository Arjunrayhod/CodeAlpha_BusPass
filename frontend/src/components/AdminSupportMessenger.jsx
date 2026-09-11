import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  MessageSquare, Send, CheckCircle2, Search, User, ShieldCheck, 
  Clock, CheckCheck, Sparkles, Filter, RefreshCw, ChevronLeft, HelpCircle, ArrowLeft
} from 'lucide-react';
import api from '../api';

export default function AdminSupportMessenger({ supportQueries = [], onDataReload }) {
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTab, setFilterTab] = useState('all'); // 'all', 'open', 'resolved'
  const [replyText, setReplyText] = useState('');
  const [replySubject, setReplySubject] = useState('Support Response');
  const [sending, setSending] = useState(false);
  const [actionSuccess, setActionSuccess] = useState('');
  const [actionError, setActionError] = useState('');
  const [mobileShowChat, setMobileShowChat] = useState(false);
  const chatContainerRef = useRef(null);

  // Safe avatar color generator
  const getAvatarColor = (name) => {
    const safeName = String(name || 'Passenger');
    const colors = [
      'bg-emerald-600', 'bg-blue-600', 'bg-indigo-600', 
      'bg-purple-600', 'bg-rose-600', 'bg-amber-600', 'bg-teal-600'
    ];
    let hash = 0;
    for (let i = 0; i < safeName.length; i++) {
      hash = safeName.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  // Safe initials generator (prevents undefined slice/toUpperCase crashes)
  const getInitials = (name) => {
    if (!name) return 'P';
    const str = String(name).trim();
    if (!str) return 'P';
    const parts = str.split(/\s+/).filter(Boolean);
    if (parts.length === 0) return 'P';
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return ((parts[0][0] || '') + (parts[1]?.[0] || '')).toUpperCase();
  };

  // Safe time / date string helpers
  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    const s = String(dateStr);
    return s.length >= 16 ? s.slice(11, 16) : s;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const s = String(dateStr);
    return s.length >= 10 ? s.slice(0, 10) : s;
  };

  // Group support queries by user_id safely
  const conversations = useMemo(() => {
    if (!Array.isArray(supportQueries)) return [];
    const map = {};
    supportQueries.forEach((msg) => {
      if (!msg) return;
      const uId = msg.user_id || 0;
      if (!map[uId]) {
        map[uId] = {
          user_id: uId,
          user_name: String(msg.user_name || `Passenger #${uId}`),
          user_email: String(msg.user_email || `user${uId}@passenger.com`),
          messages: [],
          hasOpen: false,
          openCount: 0,
          lastMessageTime: String(msg.created_at || ''),
          lastMessageText: String(msg.message || ''),
          lastSender: msg.sender_role || 'user'
        };
      }
      map[uId].messages.push(msg);
      if (msg.status === 'OPEN') {
        map[uId].hasOpen = true;
        map[uId].openCount += 1;
      }
    });

    // Sort messages chronologically for each user (oldest first)
    Object.values(map).forEach((conv) => {
      conv.messages.sort((a, b) => {
        const timeA = a?.created_at ? new Date(a.created_at).getTime() : 0;
        const timeB = b?.created_at ? new Date(b.created_at).getTime() : 0;
        return timeA - timeB;
      });
      const lastMsg = conv.messages[conv.messages.length - 1];
      if (lastMsg) {
        conv.lastMessageTime = String(lastMsg.created_at || '');
        conv.lastMessageText = String(lastMsg.message || '');
        conv.lastSender = lastMsg.sender_role || 'user';
      }
    });

    // Sort conversations: those with open queries first, then by latest message timestamp
    return Object.values(map).sort((a, b) => {
      if (a.hasOpen && !b.hasOpen) return -1;
      if (!a.hasOpen && b.hasOpen) return 1;
      const timeA = a.lastMessageTime ? new Date(a.lastMessageTime).getTime() : 0;
      const timeB = b.lastMessageTime ? new Date(b.lastMessageTime).getTime() : 0;
      return timeB - timeA;
    });
  }, [supportQueries]);

  // Set default selected user if none selected
  useEffect(() => {
    if (!selectedUserId && conversations.length > 0) {
      setSelectedUserId(conversations[0].user_id);
    }
  }, [conversations, selectedUserId]);

  const activeConversation = conversations.find(c => c.user_id === selectedUserId);

  // Scroll only the internal chat box to bottom when active user or message count changes
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [selectedUserId, activeConversation?.messages?.length]);

  // Filter conversations by search and status safely
  const filteredConversations = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return conversations.filter((c) => {
      const name = String(c.user_name || '').toLowerCase();
      const email = String(c.user_email || '').toLowerCase();
      const matchesSearch = 
        !q || 
        name.includes(q) || 
        email.includes(q) || 
        c.messages.some(m => m && String(m.message || '').toLowerCase().includes(q));

      if (!matchesSearch) return false;
      if (filterTab === 'open') return c.hasOpen;
      if (filterTab === 'resolved') return !c.hasOpen;
      return true;
    });
  }, [conversations, searchQuery, filterTab]);

  const handleSelectUser = (uId) => {
    setSelectedUserId(uId);
    setMobileShowChat(true);
  };

  const handleSendReply = async (e) => {
    if (e) e.preventDefault();
    if (!replyText.trim() || !activeConversation || sending) return;

    setSending(true);
    setActionError('');
    try {
      await api.post('/admin/support/reply', {
        user_id: activeConversation.user_id,
        subject: replySubject || 'Support Resolution',
        message: replyText.trim()
      });
      setReplyText('');
      setActionSuccess(`Message sent to ${activeConversation.user_name}`);
      setTimeout(() => setActionSuccess(''), 3000);
      if (onDataReload) onDataReload();
    } catch (err) {
      setActionError(err.response?.data?.error || 'Failed to send reply');
    } finally {
      setSending(false);
    }
  };

  const handleResolveAllForUser = async () => {
    if (!activeConversation) return;
    try {
      const openMsgs = activeConversation.messages.filter(m => m && m.status === 'OPEN');
      await Promise.all(openMsgs.map(m => api.put(`/admin/support/${m.id}/resolve`)));
      setActionSuccess(`All queries marked as resolved for ${activeConversation.user_name}`);
      setTimeout(() => setActionSuccess(''), 3000);
      if (onDataReload) onDataReload();
    } catch (err) {
      setActionError('Failed to resolve queries');
    }
  };

  const quickReplies = [
    "Your bus pass is verified and active.",
    "Your cancellation has been processed and seat is freed.",
    "Student 50% discount is applied to your pass.",
    "Please download your updated ticket PDF from 'My Passes'."
  ];

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden flex flex-col h-[calc(100vh-16.5rem)] min-h-[480px] max-h-[760px] animate-fadeIn">
      
      {/* Top Banner Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 px-4 py-2.5 sm:px-5 sm:py-3 text-white flex items-center justify-between shrink-0 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0">
            <MessageSquare className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold flex items-center gap-2">
              <span>CloudBus Live Helpdesk</span>
              <span className="px-2 py-0.5 rounded-full text-[9px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                WhatsApp View
              </span>
            </h2>
            <p className="text-[11px] text-slate-300">
              {conversations.length} Passenger Chats • {conversations.filter(c => c.hasOpen).length} Pending Inquiries
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {actionSuccess && (
            <span className="text-[11px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2.5 py-0.5 rounded-lg font-semibold animate-pulse">
              ✓ {actionSuccess}
            </span>
          )}
          {actionError && (
            <span className="text-[11px] bg-rose-500/20 text-rose-300 border border-rose-500/40 px-2.5 py-0.5 rounded-lg font-semibold">
              {actionError}
            </span>
          )}
          <button
            onClick={onDataReload}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition cursor-pointer flex items-center gap-1 text-[11px] font-semibold"
            title="Refresh messages"
          >
            <RefreshCw className="w-3 h-3" />
            <span className="hidden sm:inline">Sync</span>
          </button>
        </div>
      </div>

      {/* Main WhatsApp Split Body */}
      <div className="flex-1 flex overflow-hidden relative">
        
        {/* LEFT SIDEBAR: Conversations List */}
        <div className={`w-full md:w-80 lg:w-96 border-r border-slate-200 flex flex-col bg-white shrink-0 h-full ${
          mobileShowChat ? 'hidden md:flex' : 'flex'
        }`}>
          
          {/* Search & Filter Header */}
          <div className="p-3.5 space-y-2.5 border-b border-slate-200 bg-slate-50/70">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search passenger or message..."
                className="w-full pl-9 pr-3.5 py-2 text-xs bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs"
              />
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1 text-[11px] font-bold">
              <button
                onClick={() => setFilterTab('all')}
                className={`flex-1 py-1.5 rounded-xl transition cursor-pointer text-center ${
                  filterTab === 'all' 
                    ? 'bg-blue-600 text-white shadow-sm' 
                    : 'bg-slate-200/80 text-slate-600 hover:bg-slate-200'
                }`}
              >
                All ({conversations.length})
              </button>
              <button
                onClick={() => setFilterTab('open')}
                className={`flex-1 py-1.5 rounded-xl transition cursor-pointer text-center flex items-center justify-center gap-1 ${
                  filterTab === 'open' 
                    ? 'bg-amber-500 text-white shadow-sm' 
                    : 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200'
                }`}
              >
                <span>Pending</span>
                <span className="px-1.5 py-0.2 bg-black/10 rounded-full text-[10px]">
                  {conversations.filter(c => c.hasOpen).length}
                </span>
              </button>
              <button
                onClick={() => setFilterTab('resolved')}
                className={`flex-1 py-1.5 rounded-xl transition cursor-pointer text-center ${
                  filterTab === 'resolved' 
                    ? 'bg-emerald-600 text-white shadow-sm' 
                    : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                }`}
              >
                Resolved
              </button>
            </div>
          </div>

          {/* Conversations Scroll List */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 custom-scrollbar">
            {filteredConversations.length === 0 ? (
              <div className="p-8 text-center text-slate-400 space-y-2">
                <HelpCircle className="w-8 h-8 mx-auto text-slate-300" />
                <p className="text-xs font-semibold">No passenger conversations found</p>
                <p className="text-[11px] text-slate-400">When passengers send queries from the helpdesk, they will appear here.</p>
              </div>
            ) : (
              filteredConversations.map((conv) => {
                const isSelected = conv.user_id === selectedUserId;
                const initials = getInitials(conv.user_name);

                return (
                  <div
                    key={conv.user_id}
                    onClick={() => handleSelectUser(conv.user_id)}
                    className={`p-3.5 flex items-start gap-3 cursor-pointer transition-all duration-150 ${
                      isSelected 
                        ? 'bg-blue-50/90 border-l-4 border-blue-600' 
                        : 'hover:bg-slate-50 bg-white'
                    }`}
                  >
                    {/* User Avatar */}
                    <div className="relative shrink-0">
                      <div className={`w-11 h-11 rounded-2xl ${getAvatarColor(conv.user_name)} text-white font-black text-xs flex items-center justify-center shadow-sm`}>
                        {initials}
                      </div>
                      {conv.hasOpen && (
                        <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-amber-500 border-2 border-white rounded-full animate-pulse" />
                      )}
                    </div>

                    {/* Chat Snippet Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-slate-900 truncate">
                          {conv.user_name}
                        </h4>
                        <span className="text-[10px] text-slate-400 shrink-0 ml-1">
                          {formatTime(conv.lastMessageTime)}
                        </span>
                      </div>

                      <div className="flex items-center justify-between gap-1 mt-1">
                        <p className="text-[11px] text-slate-500 truncate leading-tight">
                          {conv.lastSender === 'admin' ? (
                            <span className="text-blue-600 font-bold">You: </span>
                          ) : null}
                          {conv.lastMessageText || 'No message content'}
                        </p>
                        {conv.hasOpen ? (
                          <span className="px-1.5 py-0.5 bg-amber-500 text-white font-black text-[9px] rounded-full shrink-0">
                            {conv.openCount}
                          </span>
                        ) : (
                          <CheckCheck className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* RIGHT PANE: WhatsApp Active Chat Window */}
        {activeConversation ? (
          <div className={`flex-1 flex flex-col bg-slate-100/70 h-full min-w-0 ${
            mobileShowChat ? 'flex' : 'hidden md:flex'
          }`}>
            
            {/* WhatsApp Chat Header */}
            <div className="px-3.5 sm:px-4 py-2 bg-white border-b border-slate-200 flex items-center justify-between shrink-0 shadow-2xs">
              <div className="flex items-center gap-2.5">
                {/* Mobile Back Button */}
                <button
                  onClick={() => setMobileShowChat(false)}
                  className="md:hidden p-1 -ml-1 text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                  title="Back to conversations"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>

                <div className={`w-8 h-8 rounded-xl ${getAvatarColor(activeConversation.user_name)} text-white font-bold text-[11px] flex items-center justify-center shadow-inner shrink-0`}>
                  {getInitials(activeConversation.user_name)}
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-xs sm:text-sm text-slate-900 truncate flex items-center gap-1.5">
                    <span>{activeConversation.user_name}</span>
                    <span className="text-[10px] font-normal text-slate-400 hidden sm:inline truncate">
                      ({activeConversation.user_email})
                    </span>
                  </h3>
                  <div className="flex items-center gap-1.5 text-[9px] sm:text-[10px]">
                    <span className="flex items-center gap-1 font-semibold text-emerald-600">
                      <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                      Online
                    </span>
                    <span>•</span>
                    <span className={`font-bold ${activeConversation.hasOpen ? 'text-amber-600' : 'text-emerald-600'}`}>
                      {activeConversation.hasOpen ? `${activeConversation.openCount} Pending` : '✓ Resolved'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {activeConversation.hasOpen && (
                  <button
                    onClick={handleResolveAllForUser}
                    className="flex items-center gap-1 px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl text-[11px] font-bold transition cursor-pointer shadow-2xs"
                  >
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    <span>Resolve</span>
                  </button>
                )}
              </div>
            </div>

            {/* Chat Body (WhatsApp Message Stream) */}
            <div 
              ref={chatContainerRef}
              className="flex-1 p-3 sm:p-4 overflow-y-auto space-y-2.5 custom-scrollbar bg-slate-100/90"
              style={{
                backgroundImage: 'radial-gradient(#cbd5e1 0.75px, transparent 0.75px)',
                backgroundSize: '16px 16px'
              }}
            >
              {/* Date Header Chip */}
              <div className="text-center my-0.5">
                <span className="px-3 py-0.5 bg-white/90 backdrop-blur-sm border border-slate-200 rounded-full text-[9px] font-bold text-slate-500 shadow-2xs">
                  Chat with {activeConversation.user_name}
                </span>
              </div>

              {activeConversation.messages.map((m) => {
                const isAdmin = m && m.sender_role === 'admin';
                return (
                  <div
                    key={m?.id || Math.random()}
                    className={`flex flex-col ${isAdmin ? 'items-end' : 'items-start'}`}
                  >
                    {/* Meta Label */}
                    <div className="flex items-center gap-1 text-[9px] text-slate-400 mb-0.5 px-1">
                      {isAdmin ? (
                        <>
                          <ShieldCheck className="w-3 h-3 text-emerald-600" />
                          <span className="font-bold text-emerald-700">Admin</span>
                        </>
                      ) : (
                        <>
                          <User className="w-3 h-3 text-slate-500" />
                          <span className="font-bold text-slate-700">{activeConversation.user_name}</span>
                        </>
                      )}
                      <span>•</span>
                      <span>{formatTime(m?.created_at)}</span>
                    </div>

                    {/* Chat Message Bubble */}
                    <div
                      className={`max-w-[85%] sm:max-w-[70%] md:max-w-[55%] p-2.5 sm:p-3 rounded-2xl text-xs leading-relaxed shadow-sm relative ${
                        isAdmin
                          ? 'bg-emerald-700 text-white rounded-tr-xs shadow-emerald-900/10'
                          : 'bg-white text-slate-800 border border-slate-200 rounded-tl-xs shadow-slate-200/50'
                      }`}
                    >
                      {/* Subject Chip */}
                      {m?.subject && (
                        <div className={`text-[9px] font-bold uppercase mb-1 pb-0.5 border-b ${
                          isAdmin 
                            ? 'border-emerald-600/50 text-emerald-200' 
                            : 'border-slate-100 text-blue-600'
                        }`}>
                          {m.subject}
                        </div>
                      )}

                      <p className="whitespace-pre-wrap">{m?.message || ''}</p>

                      {/* Bubble Bottom Info */}
                      <div className={`flex items-center justify-end gap-1 mt-0.5 text-[9px] ${
                        isAdmin ? 'text-emerald-200' : 'text-slate-400'
                      }`}>
                        <span>{formatDate(m?.created_at)}</span>
                        {isAdmin && <CheckCheck className="w-3 h-3 text-emerald-300" />}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Quick Answer Suggestions */}
            <div className="px-3 py-1 bg-white border-t border-slate-200 flex items-center gap-1 overflow-x-auto text-[10px] shrink-0 custom-scrollbar">
              <span className="text-[9px] font-bold text-slate-400 uppercase shrink-0">Quick:</span>
              {quickReplies.map((qr, idx) => (
                <button
                  key={idx}
                  onClick={() => setReplyText(qr)}
                  className="px-2 py-0.5 bg-slate-100 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 border border-slate-200 text-slate-700 rounded-lg whitespace-nowrap transition text-[10px] cursor-pointer"
                >
                  {qr}
                </button>
              ))}
            </div>

            {/* WhatsApp Bottom Input Box */}
            <form onSubmit={handleSendReply} className="p-2 sm:p-2.5 bg-white border-t border-slate-200 shrink-0 space-y-1.5">
              <div className="flex items-center gap-1.5">
                <span className="text-[9px] font-bold text-slate-400 uppercase">Tag:</span>
                <select
                  value={replySubject}
                  onChange={(e) => setReplySubject(e.target.value)}
                  className="px-2 py-0.5 text-[11px] bg-slate-50 border border-slate-200 rounded-lg font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="Support Response">Support Response</option>
                  <option value="Pass Issue Resolved">Pass Issue Resolved</option>
                  <option value="Cancellation / Refund Notice">Cancellation / Refund Notice</option>
                  <option value="Bus Route & Schedule Update">Bus Route & Schedule Update</option>
                  <option value="General Information">General Information</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <textarea
                  rows={1}
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendReply();
                    }
                  }}
                  placeholder={`Type reply to ${activeConversation.user_name}... (Enter to send)`}
                  className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:bg-white focus:outline-none resize-none custom-scrollbar"
                />
                <button
                  type="submit"
                  disabled={sending || !replyText.trim()}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-md transition disabled:opacity-50 flex items-center gap-1.5 cursor-pointer shrink-0"
                >
                  <span>{sending ? '...' : 'Send'}</span>
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>

          </div>
        ) : (
          /* No User Selected Screen */
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-slate-50">
            <div className="w-16 h-16 rounded-3xl bg-blue-100 text-blue-600 flex items-center justify-center mb-3 shadow-inner">
              <MessageSquare className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-slate-800">Select a Conversation</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm">
              Select a passenger from the left panel to view their complete message thread and send instant replies in WhatsApp view.
            </p>
          </div>
        )}

      </div>

    </div>
  );
}
