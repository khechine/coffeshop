'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  MessageSquare, Send, Search, ChevronRight, 
  User, Box, Clock, ShieldCheck, PhoneOff, MailWarning, ShoppingCart 
} from 'lucide-react';
import { 
  getTradeConversationsAction, 
  getTradeMessagesAction, 
  sendTradeMessageAction,
  getUserNotificationsAction,
  markNotificationAsReadAction,
  vendorConvertDiscussionToOrderAction
} from '../../../actions';
import { sanitizeUrl } from '../../../lib/imageUtils';

export default function VendorMessagesClient() {
  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [showOrderForm, setShowOrderForm] = useState(false);
  const [orderQuantity, setOrderQuantity] = useState('');
  const [orderPrice, setOrderPrice] = useState('');
  const [isConverting, setIsConverting] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const handleConvertOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    const productId = selectedConversation?.lastMessage?.productId;
    if (!productId || !selectedConversation) return;

    if (!orderQuantity || !orderPrice) {
      alert("Veuillez saisir une quantité et un prix unitaire.");
      return;
    }

    setIsConverting(true);
    try {
      const res = await vendorConvertDiscussionToOrderAction({
        buyerUserId: selectedConversation.otherUser.id,
        productId,
        quantity: Number(orderQuantity),
        price: Number(orderPrice)
      });
      if (res.success) {
        alert("La commande a été créée et proposée au client avec succès !");
        setShowOrderForm(false);
        setOrderQuantity('');
        setOrderPrice('');
        // Optional: Send a message indicating an order was proposed
        await sendTradeMessageAction({
          receiverId: selectedConversation.otherUser.id,
          productId,
          content: `J'ai créé une proposition de commande pour ce produit (Qté: ${orderQuantity}, Prix: ${orderPrice} DT). Vous pouvez la consulter dans vos commandes.`
        });
        await loadMessages(selectedConversation.otherUser.id);
      }
    } catch (e: any) {
      alert(e.message || "Erreur lors de la création de la commande.");
    } finally {
      setIsConverting(false);
    }
  };

  useEffect(() => {
    loadConversations();
  }, []);

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
        // Refresh messages
        await loadMessages(selectedConversation.otherUser.id);
        // Refresh conversations to update last message
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
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-120px)] bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden">
      {/* Sidebar - Conversations List */}
      <div className="w-80 border-right border-slate-200 dark:border-slate-800 flex flex-col bg-slate-50/50 dark:bg-slate-950/20">
        <div className="p-6 border-b border-slate-200 dark:border-slate-800">
          <h2 className="text-xl font-black text-slate-900 dark:text-white mb-4">Messages</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="Rechercher..." 
              className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 ? (
            <div className="p-8 text-center text-slate-400">
              <MessageSquare size={32} className="mx-auto mb-4 opacity-20" />
              <p className="text-sm">Aucune discussion pour le moment.</p>
            </div>
          ) : (
            conversations.map((conv) => (
              <div 
                key={conv.otherUser.id}
                onClick={() => setSelectedConversation(conv)}
                className={`p-4 cursor-pointer border-b border-slate-100 dark:border-slate-800/50 transition-all ${
                  selectedConversation?.otherUser.id === conv.otherUser.id 
                  ? 'bg-white dark:bg-slate-900 shadow-sm' 
                  : 'hover:bg-white/50 dark:hover:bg-slate-900/50'
                }`}
              >
                <div className="flex gap-3">
                  <div className="w-12 h-12 rounded-full bg-indigo-100 dark:bg-indigo-950/30 flex items-center justify-center shrink-0 border border-indigo-200 dark:border-indigo-800">
                    {conv.otherUser.image ? (
                      <img src={conv.otherUser.image} className="w-full h-full rounded-full object-cover" alt="" />
                    ) : (
                      <User size={20} className="text-indigo-600" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-1">
                      <h4 className="font-bold text-slate-900 dark:text-white truncate text-sm">
                        {conv.otherUser.name}
                      </h4>
                      <span className="text-[10px] text-slate-400 font-medium">
                        {new Date(conv.lastMessage.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate font-medium">
                      {conv.lastMessage.isFiltered ? conv.lastMessage.filteredContent : conv.lastMessage.content}
                    </p>
                    {conv.lastMessage.product && (
                      <div className="mt-2 flex items-center gap-1.5 text-[10px] text-indigo-500 font-bold bg-indigo-50 dark:bg-indigo-950/30 px-2 py-0.5 rounded-md w-fit">
                        <Box size={10} />
                        <span className="truncate max-w-[120px]">{conv.lastMessage.product.name}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-white dark:bg-slate-900">
        {selectedConversation ? (
          <>
            {/* Header */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                  <User size={20} className="text-slate-500" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white">{selectedConversation.otherUser.name}</h3>
                  <div className="flex items-center gap-2 text-[10px] font-bold text-emerald-500 uppercase tracking-wider">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    En ligne
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                 <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-rose-50 dark:bg-rose-950/20 text-rose-600 rounded-xl text-[10px] font-black uppercase tracking-widest border border-rose-100 dark:border-rose-900/30">
                    <ShieldCheck size={12} />
                    TradeMessager Protection Active
                 </div>
                 {selectedConversation.lastMessage?.product && (
                   <button 
                     onClick={() => setShowOrderForm(!showOrderForm)}
                     className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors"
                   >
                     <ShoppingCart size={14} />
                     Convertir en commande
                   </button>
                 )}
              </div>
            </div>

            {/* Order Form */}
            {showOrderForm && selectedConversation.lastMessage?.product && (
              <div className="p-4 bg-indigo-50 dark:bg-indigo-950/30 border-b border-indigo-100 dark:border-indigo-900/50 flex flex-col gap-3">
                <div className="text-xs font-bold text-indigo-800 dark:text-indigo-300">
                  Proposer une commande pour : {selectedConversation.lastMessage.product.name}
                </div>
                <form onSubmit={handleConvertOrder} className="flex gap-3 items-end">
                  <div className="flex-1">
                    <label className="block text-[10px] font-bold text-indigo-600 dark:text-indigo-400 mb-1 uppercase tracking-wider">Quantité</label>
                    <input 
                      type="number" 
                      min="1"
                      value={orderQuantity}
                      onChange={e => setOrderQuantity(e.target.value)}
                      placeholder="Ex: 50"
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-800 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-[10px] font-bold text-indigo-600 dark:text-indigo-400 mb-1 uppercase tracking-wider">Prix unitaire (DT)</label>
                    <input 
                      type="number" 
                      step="0.01"
                      min="0"
                      value={orderPrice}
                      onChange={e => setOrderPrice(e.target.value)}
                      placeholder="Ex: 15.50"
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-800 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-[10px] font-bold text-indigo-600 dark:text-indigo-400 mb-1 uppercase tracking-wider">Total estimé</label>
                    <div className="px-3 py-2 bg-indigo-100 dark:bg-indigo-900/50 border border-transparent rounded-lg text-sm font-black text-indigo-900 dark:text-indigo-100">
                      {orderQuantity && orderPrice ? (Number(orderQuantity) * Number(orderPrice)).toFixed(2) + ' DT' : '0.00 DT'}
                    </div>
                  </div>
                  <button 
                    type="submit"
                    disabled={isConverting || !orderQuantity || !orderPrice}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold hover:bg-indigo-700 disabled:opacity-50 transition-colors h-[38px]"
                  >
                    {isConverting ? 'Création...' : 'Valider'}
                  </button>
                </form>
              </div>
            )}

            {/* Messages Feed */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/30 dark:bg-slate-950/10">
              <div className="flex flex-col gap-6">
                {messages.map((msg, idx) => {
                  const isMine = msg.senderId !== selectedConversation.otherUser.id;
                  return (
                    <div 
                      key={msg.id} 
                      className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-[80%] flex flex-col ${isMine ? 'items-end' : 'items-start'}`}>
                        {msg.product && idx === 0 && (
                          <div className="mb-2 p-3 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex gap-3 items-center">
                            <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-900 overflow-hidden shrink-0">
                               <img src={sanitizeUrl(msg.product.image)} className="w-full h-full object-cover" alt="" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Objet de la discussion</p>
                              <p className="text-xs font-black text-slate-900 dark:text-white truncate">{msg.product.name}</p>
                            </div>
                          </div>
                        )}
                        
                        <div className={`p-4 rounded-2xl text-sm font-medium shadow-sm leading-relaxed ${
                          isMine 
                          ? 'bg-indigo-600 text-white rounded-tr-none' 
                          : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-tl-none'
                        }`}>
                          {msg.isFiltered ? msg.filteredContent : msg.content}
                          
                          {msg.isFiltered && (
                            <div className={`mt-3 p-2 rounded-lg text-[10px] flex items-center gap-2 border ${
                              isMine 
                              ? 'bg-indigo-700/50 border-indigo-500/50 text-indigo-100' 
                              : 'bg-rose-50 dark:bg-rose-950/20 border-rose-100 dark:border-rose-900/30 text-rose-600'
                            }`}>
                               <PhoneOff size={12} />
                               Les coordonnées personnelles sont masquées pour votre sécurité.
                            </div>
                          )}
                        </div>
                        <span className="text-[9px] text-slate-400 font-bold uppercase mt-1 px-1">
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Input Area */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <div className="mb-3 px-4 py-2 bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30 rounded-xl flex items-center gap-3">
                 <MailWarning size={14} className="text-amber-600" />
                 <p className="text-[10px] text-amber-700 dark:text-amber-400 font-bold leading-none">
                    Conseil B2B : Ne partagez jamais vos informations de paiement en dehors de la plateforme.
                 </p>
              </div>
              
              <form onSubmit={handleSendMessage} className="flex gap-4">
                <input 
                  value={newMessage}
                  onChange={e => setNewMessage(e.target.value)}
                  placeholder="Écrivez votre message..."
                  className="flex-1 px-6 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-medium"
                />
                <button 
                  type="submit"
                  disabled={isSending || !newMessage.trim()}
                  className="p-3 bg-indigo-600 text-white rounded-2xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-500/30 disabled:opacity-50"
                >
                  <Send size={20} />
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
            <div className="w-20 h-20 bg-slate-50 dark:bg-slate-950 rounded-3xl flex items-center justify-center mb-6">
              <MessageSquare size={40} className="text-slate-300 dark:text-slate-700" />
            </div>
            <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2">Sélectionnez une discussion</h3>
            <p className="text-sm text-slate-500 max-w-xs">
              Choisissez un client dans la liste de gauche pour commencer à discuter de ses besoins.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
