'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  MessageSquare, Send, Search, ChevronRight, 
  User, Box, Clock, ShieldCheck, PhoneOff, MailWarning, ShoppingCart, Plus, Trash2 
} from 'lucide-react';
import { 
  getTradeConversationsAction, 
  getTradeMessagesAction, 
  sendTradeMessageAction,
  getUserNotificationsAction,
  markNotificationAsReadAction,
  vendorConvertDiscussionToOrderAction,
  getVendorProductsForUpsellAction
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
  const [orderItems, setOrderItems] = useState<{ productId: string; name: string; quantity: string; price: string }[]>([]);
  const [catalogProducts, setCatalogProducts] = useState<any[]>([]);
  const [isConverting, setIsConverting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const handleConvertOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedConversation) return;

    if (orderItems.some(i => !i.productId || !i.quantity || !i.price)) {
      alert("Veuillez remplir correctement tous les produits de la commande.");
      return;
    }

    setIsConverting(true);
    setErrorMsg(null);
    try {
      const payloadItems = orderItems.map(i => ({
        productId: i.productId,
        quantity: Number(i.quantity),
        price: Number(i.price)
      }));

      const res = await vendorConvertDiscussionToOrderAction({
        buyerUserId: selectedConversation.otherUser.id,
        items: payloadItems
      });
      if (res.success) {
        setShowSuccess(true);
        setShowOrderForm(false);
        setOrderItems([]);
        
        const total = payloadItems.reduce((acc, i) => acc + (i.quantity * i.price), 0);
        await sendTradeMessageAction({
          receiverId: selectedConversation.otherUser.id,
          productId: payloadItems[0].productId,
          content: `J'ai créé une commande confirmée pour un total de ${total.toFixed(2)} DT comprenant ${payloadItems.length} produit(s). Vous la retrouverez dans vos commandes.`
        });
        await loadMessages(selectedConversation.otherUser.id);
        
        // Auto-hide success after 3s
        setTimeout(() => setShowSuccess(false), 3000);
      } else {
        setErrorMsg(res.error || "Erreur lors de la création de la commande.");
      }
    } catch (e: any) {
      setErrorMsg(e.message || "Erreur lors de la création de la commande.");
    } finally {
      setIsConverting(false);
    }
  };

  const updateOrderItem = (index: number, field: string, value: string) => {
    const newItems = [...orderItems];
    newItems[index] = { ...newItems[index], [field]: value };
    if (field === 'productId') {
      const p = catalogProducts.find(cp => cp.id === value);
      if (p) {
        newItems[index].name = p.name;
        newItems[index].price = String(p.price || '');
      }
    }
    setOrderItems(newItems);
  };

  const addOrderItem = () => {
    setOrderItems([...orderItems, { productId: '', name: '', quantity: '', price: '' }]);
  };

  const removeOrderItem = (index: number) => {
    setOrderItems(orderItems.filter((_, i) => i !== index));
  };

  useEffect(() => {
    loadConversations();
    getVendorProductsForUpsellAction().then(setCatalogProducts).catch(console.error);
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
                     onClick={() => {
                       if (!showOrderForm) {
                         setOrderItems([{
                           productId: selectedConversation.lastMessage.productId,
                           name: selectedConversation.lastMessage.product.name,
                           quantity: '',
                           price: String(selectedConversation.lastMessage.product.price || '')
                         }]);
                       }
                       setShowOrderForm(!showOrderForm);
                       setErrorMsg(null);
                     }}
                     className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors"
                   >
                     <ShoppingCart size={14} />
                     Convertir en commande
                   </button>
                 )}
              </div>
            </div>

            {/* Error Message */}
            {errorMsg && (
              <div className="mx-6 mt-4 p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-3 text-rose-600 text-sm font-bold animate-in fade-in slide-in-from-top-2">
                <MailWarning size={18} />
                {errorMsg}
                <button onClick={() => setErrorMsg(null)} className="ml-auto text-rose-400 hover:text-rose-600">✕</button>
              </div>
            )}

            {/* Order Form (Upsell support) */}
            {showOrderForm && selectedConversation.lastMessage?.product && (
              <div className="p-4 bg-indigo-50 dark:bg-indigo-950/30 border-b border-indigo-100 dark:border-indigo-900/50 flex flex-col gap-3">
                <div className="text-xs font-bold text-indigo-800 dark:text-indigo-300">
                  Composer une commande pour {selectedConversation.otherUser.name}
                </div>
                <form onSubmit={handleConvertOrder} className="flex flex-col gap-3">
                  {orderItems.map((item, index) => (
                    <div key={index} className="flex gap-3 items-end p-3 bg-white dark:bg-slate-900 rounded-xl border border-indigo-100 dark:border-indigo-800/50 shadow-sm">
                      <div className="flex-1">
                        <label className="block text-[10px] font-bold text-indigo-600 dark:text-indigo-400 mb-1 uppercase tracking-wider">Produit</label>
                        <select 
                          value={item.productId}
                          onChange={e => updateOrderItem(index, 'productId', e.target.value)}
                          className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm outline-none font-medium"
                        >
                          <option value="">Sélectionner un produit</option>
                          {catalogProducts.map(p => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                          ))}
                        </select>
                      </div>
                      <div className="w-20">
                        <label className="block text-[10px] font-bold text-indigo-600 dark:text-indigo-400 mb-1 uppercase tracking-wider">Qté</label>
                        <input 
                          type="number" min="1" value={item.quantity} onChange={e => updateOrderItem(index, 'quantity', e.target.value)}
                          placeholder="Qté"
                          className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm outline-none"
                        />
                      </div>
                      <div className="w-24">
                        <label className="block text-[10px] font-bold text-indigo-600 dark:text-indigo-400 mb-1 uppercase tracking-wider">Prix (DT)</label>
                        <input 
                          type="number" step="0.01" min="0" value={item.price} onChange={e => updateOrderItem(index, 'price', e.target.value)}
                          placeholder="Prix"
                          className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm outline-none"
                        />
                      </div>
                      {orderItems.length > 1 && (
                        <button type="button" onClick={() => removeOrderItem(index)} className="p-2.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg mb-[1px]">
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  ))}
                  
                  <div className="flex justify-between items-center px-1">
                    <button type="button" onClick={addOrderItem} className="text-[11px] font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5 hover:text-indigo-800 dark:hover:text-indigo-300">
                      <Plus size={14} strokeWidth={3} /> Ajouter un produit (Upsell)
                    </button>
                    <div className="text-sm font-black text-indigo-900 dark:text-indigo-100">
                      Total: {orderItems.reduce((acc, item) => acc + (Number(item.quantity) * Number(item.price)), 0).toFixed(2)} DT
                    </div>
                  </div>

                  <button 
                    type="submit"
                    disabled={isConverting || orderItems.some(i => !i.productId || !i.quantity || !i.price)}
                    className="w-full mt-2 px-4 py-3 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 disabled:opacity-50 transition-all active:scale-95 shadow-lg shadow-indigo-500/20"
                  >
                    {isConverting ? (
                      <div className="flex items-center justify-center gap-2">
                        <Clock className="animate-spin" size={16} />
                        Confirmation en cours...
                      </div>
                    ) : 'Créer et confirmer la commande'}
                  </button>
                </form>
              </div>
            )}

            {/* Success Overlay */}
            {showSuccess && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in">
                <div className="bg-white dark:bg-slate-900 rounded-[32px] p-8 shadow-2xl border border-slate-100 dark:border-slate-800 flex flex-col items-center text-center max-w-sm animate-in zoom-in-95 duration-300">
                  <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-6 text-green-600 dark:text-green-400">
                    <ShieldCheck size={48} />
                  </div>
                  <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-2">Succès !</h3>
                  <p className="text-slate-500 dark:text-slate-400 font-medium mb-6">
                    La commande a été créée, confirmée et les fonds ont été déduits avec succès.
                  </p>
                  <button 
                    onClick={() => setShowSuccess(false)}
                    className="w-full py-3 bg-slate-900 dark:bg-white dark:text-slate-900 text-white rounded-2xl font-bold hover:opacity-90 transition-opacity"
                  >
                    Continuer
                  </button>
                </div>
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
