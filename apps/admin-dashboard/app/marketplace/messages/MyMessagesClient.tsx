'use client';

import React, { useState, useEffect, useRef } from 'react';
import MarketplaceHeader from '../components/MarketplaceHeader';
import MarketplaceFooter from '../components/MarketplaceFooter';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  MessageSquare, Send, Search, User, Box, ShieldCheck, 
  PhoneOff, MailWarning, ArrowLeft, Store
} from 'lucide-react';
import { 
  getTradeConversationsAction, 
  getTradeMessagesAction, 
  sendTradeMessageAction,
  getUserNotificationsAction,
  markNotificationAsReadAction
} from '../../actions';
import { sanitizeUrl } from '../../lib/imageUtils';

export default function MyMessagesClient({ store }: any) {
  const searchParams = useSearchParams();
  const userIdParam = searchParams.get('userId');
  
  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    if (conversations.length > 0 && userIdParam) {
      const found = conversations.find(c => c.otherUser.id === userIdParam);
      if (found) setSelectedConversation(found);
    }
  }, [conversations, userIdParam]);

  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation.otherUser.id);
    }
  }, [selectedConversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Polling for new messages every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      loadConversations();
      if (selectedConversation) {
        loadMessages(selectedConversation.otherUser.id);
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [selectedConversation]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadConversations = async () => {
    try {
      const data = await getTradeConversationsAction();
      setConversations(data);
      if (data.length > 0 && !selectedConversation) {
        setSelectedConversation(data[0]);
      }

      // Mark message notifications as read
      const notifs = await getUserNotificationsAction();
      const messageNotifs = notifs.filter((n: any) => n.type === 'MESSAGE');
      for (const n of messageNotifs) {
        await markNotificationAsReadAction(n.id);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const loadMessages = async (otherUserId: string) => {
    try {
      const data = await getTradeMessagesAction(otherUserId);
      setMessages(data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversation || isSending) return;

    setIsSending(true);
    try {
      const res = await sendTradeMessageAction({
        receiverId: selectedConversation.otherUser.id,
        productId: selectedConversation.lastMessage?.productId,
        content: newMessage
      });

      if (res.success) {
        setNewMessage('');
        await loadMessages(selectedConversation.otherUser.id);
        await loadConversations();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSending(false);
    }
  };

  if (isLoading) {
    return (
      <div style={{ background: '#F9FAFB', minHeight: '100vh' }}>
        <MarketplaceHeader store={store} />
        <div className="flex items-center justify-center h-[calc(100vh-200px)]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: '#F9FAFB', minHeight: '100vh', fontFamily: 'Inter, system-ui, sans-serif' }}>
      <MarketplaceHeader store={store} />

      <main style={{ maxWidth: '1400px', margin: '40px auto', padding: '0 24px' }}>
        <div className="bg-white rounded-[32px] border border-slate-200 overflow-hidden shadow-xl shadow-slate-200/50 flex h-[700px]">
          
          {/* Sidebar */}
          <div className="w-[380px] border-r border-slate-100 flex flex-col bg-slate-50/30">
            <div className="p-8 border-b border-slate-100">
               <div className="flex items-center gap-3 mb-6">
                 <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-red-200">
                   <MessageSquare size={20} />
                 </div>
                 <h1 className="text-2xl font-black text-slate-900">TradeMessager</h1>
               </div>
               <div className="relative">
                 <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                 <input 
                   type="text" 
                   placeholder="Rechercher un fournisseur..." 
                   className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm outline-none focus:ring-4 focus:ring-red-500/10 transition-all font-medium"
                 />
               </div>
            </div>

            <div className="flex-1 overflow-y-auto no-scrollbar">
              {conversations.length === 0 ? (
                <div className="p-12 text-center">
                  <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4 opacity-50">
                    <MessageSquare size={24} className="text-slate-400" />
                  </div>
                  <p className="text-sm font-bold text-slate-400">Aucun message pour le moment.</p>
                </div>
              ) : (
                conversations.map((conv) => (
                  <div 
                    key={conv.otherUser.id}
                    onClick={() => setSelectedConversation(conv)}
                    className={`p-6 cursor-pointer border-b border-slate-50 transition-all ${
                      selectedConversation?.otherUser.id === conv.otherUser.id 
                      ? 'bg-white shadow-md z-10 scale-[1.02] rounded-2xl mx-3 my-2 border-none' 
                      : 'hover:bg-white/60'
                    }`}
                  >
                    <div className="flex gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center shrink-0 border border-slate-200 overflow-hidden">
                        {conv.otherUser.image ? (
                          <img src={conv.otherUser.image} className="w-full h-full object-cover" alt="" />
                        ) : (
                          <Store size={24} className="text-slate-400" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start mb-1">
                          <h4 className="font-black text-slate-900 truncate text-[15px]">
                            {conv.otherUser.name}
                          </h4>
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                            {new Date(conv.lastMessage.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
                          </span>
                        </div>
                        <p className="text-sm text-slate-500 truncate font-medium">
                          {conv.lastMessage.isFiltered ? conv.lastMessage.filteredContent : conv.lastMessage.content}
                        </p>
                        {conv.lastMessage.product && (
                          <div className="mt-3 flex items-center gap-2 text-[10px] text-red-600 font-black bg-red-50 px-3 py-1 rounded-lg w-fit uppercase tracking-widest">
                            <Box size={12} />
                            <span className="truncate max-w-[150px]">{conv.lastMessage.product.name}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Chat area */}
          <div className="flex-1 flex flex-col bg-white">
            {selectedConversation ? (
              <>
                <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                   <div className="flex items-center gap-4">
                     <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center border border-slate-100">
                        <Store size={24} className="text-slate-900" />
                     </div>
                     <div>
                       <h3 className="text-lg font-black text-slate-900">{selectedConversation.otherUser.name}</h3>
                       <div className="flex items-center gap-2">
                         <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                         <span className="text-[10px] font-black text-green-600 uppercase tracking-widest">Vendeur Vérifié</span>
                       </div>
                     </div>
                   </div>
                   <div className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest">
                      <ShieldCheck size={14} className="text-red-500" />
                      Transaction Sécurisée
                   </div>
                </div>

                <div className="flex-1 overflow-y-auto p-8 space-y-8 bg-slate-50/20 no-scrollbar">
                  {messages.map((msg, idx) => {
                    const isMine = msg.senderId !== selectedConversation.otherUser.id;
                    return (
                      <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[70%] flex flex-col ${isMine ? 'items-end' : 'items-start'}`}>
                          {msg.product && idx === 0 && (
                            <div className="mb-3 p-4 bg-white rounded-[24px] border border-slate-200 shadow-sm flex gap-4 items-center">
                              <div className="w-12 h-12 rounded-xl bg-slate-100 overflow-hidden shrink-0 border border-slate-100">
                                 <img src={sanitizeUrl(msg.product.image)} className="w-full h-full object-cover" alt="" />
                              </div>
                              <div className="min-w-0">
                                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">À propos de</p>
                                <p className="text-sm font-black text-slate-900 truncate">{msg.product.name}</p>
                              </div>
                            </div>
                          )}
                          
                          <div className={`p-5 rounded-[24px] text-sm font-semibold shadow-sm leading-relaxed ${
                            isMine 
                            ? 'bg-red-600 text-white rounded-tr-none' 
                            : 'bg-white text-slate-700 border border-slate-100 rounded-tl-none'
                          }`}>
                            {msg.isFiltered ? msg.filteredContent : msg.content}
                            
                            {msg.isFiltered && (
                              <div className={`mt-4 p-3 rounded-xl text-[11px] flex items-center gap-3 border ${
                                isMine 
                                ? 'bg-red-700 border-red-500 text-red-100' 
                                : 'bg-red-50 border-red-100 text-red-600'
                              }`}>
                                 <PhoneOff size={14} />
                                 <span className="font-bold">Coordonnées masquées : Restez sur la plateforme pour être protégé.</span>
                              </div>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-400 font-bold uppercase mt-2 px-2 tracking-widest">
                            {new Date(msg.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>

                <div className="p-6 border-t border-slate-100">
                   <form onSubmit={handleSendMessage} className="flex gap-4">
                      <input 
                        value={newMessage}
                        onChange={e => setNewMessage(e.target.value)}
                        placeholder="Répondez au fournisseur..."
                        className="flex-1 px-8 py-4 bg-slate-50 border border-slate-100 rounded-[24px] text-sm outline-none focus:ring-4 focus:ring-red-500/10 transition-all font-bold text-slate-900"
                      />
                      <button 
                        type="submit"
                        disabled={isSending || !newMessage.trim()}
                        className="w-14 h-14 bg-red-600 text-white rounded-[24px] flex items-center justify-center hover:bg-red-700 transition-all shadow-xl shadow-red-200 disabled:opacity-50 active:scale-95"
                      >
                        <Send size={24} />
                      </button>
                   </form>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-12 text-center bg-slate-50/10">
                <div className="w-24 h-24 bg-white rounded-[40px] flex items-center justify-center mb-8 shadow-xl shadow-slate-200">
                  <MessageSquare size={48} className="text-slate-200" />
                </div>
                <h3 className="text-2xl font-black text-slate-900 mb-3">Vos Discussions B2B</h3>
                <p className="text-slate-500 max-w-xs font-medium">
                  Sélectionnez un fournisseur pour finaliser vos négociations et sécuriser vos achats.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>

      <MarketplaceFooter />
    </div>
  );
}
