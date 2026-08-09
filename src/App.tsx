import React, { useCallback, useEffect, useState } from 'react';
import { HashRouter, Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import { ChatWindow } from './components/ChatWindow';
import { HistoryModal } from './components/HistoryModal';
import { ProfileModal } from './components/ProfileModal';
import { ShopRegistrationForm } from './components/ShopRegistrationForm';
import { AuthGate } from './components/AuthGate';
import { ShopsPage } from './pages/ShopsPage';
import { DashboardPage } from './pages/DashboardPage';
import {
  Attachment,
  AuthSession,
  AuthUser,
  Chat,
  HistoryEntry,
  InterestEntry,
  Message,
  ProfileData,
  ShopItem,
} from './types';
import { CURRENT_USER_AVATAR, now } from './data';
import {
  clearAllSiteData,
  expressInterest,
  getChatMessages,
  getMe,
  getMyHistory,
  getMyInterests,
  getMyShops,
  getSession,
  removeInterest,
  sendChat,
  setSession as persistSession,
  updateMerchantProfile,
} from './api';
import { ChatMessage, ProductResult } from './types';

function getSectionPriority(label: string): number {
  const normalized = label.toLowerCase();
  if (normalized.includes('exact')) return 0;
  if (normalized.includes('matching')) return 1;
  if (normalized.includes('related')) return 2;
  return 3;
}

function mergeSearchResultMessages(messages: ChatMessage[]): ChatMessage[] {
  const searchMessages = messages.filter((message) => message.type === 'search_results');
  if (searchMessages.length <= 1) return messages;

  const mergedLabel = searchMessages.reduce((current, message) => {
    const label = message.label?.trim() ?? '';
    if (!label) return current;
    if (current && current.toLowerCase().includes('exact')) return current;
    if (label.toLowerCase().includes('exact')) return label;
    return current || label;
  }, '');

  const resultMap = new Map<number, { result: ProductResult; priority: number }>();

  searchMessages.forEach((message) => {
    const priority = getSectionPriority(message.label ?? '');
    (message.results ?? []).forEach((result) => {
      const existing = resultMap.get(result.product_id);
      if (
        !existing ||
        priority < existing.priority ||
        (priority === existing.priority && result.score > existing.result.score)
      ) {
        resultMap.set(result.product_id, { result, priority });
      }
    });
  });

  const mergedResults = Array.from(resultMap.values())
    .map((entry) => entry.result)
    .sort((a, b) => b.score - a.score);

  const firstResultIndex = messages.findIndex((message) => message.type === 'search_results');
  const before = messages.slice(0, firstResultIndex).filter((message) => message.type !== 'search_results');
  const after = messages.slice(firstResultIndex).filter((message) => message.type !== 'search_results');

  const mergedMessage: ChatMessage = {
    type: 'search_results',
    label: mergedLabel || 'Search results',
    total: mergedResults.length,
    results: mergedResults,
  };

  return [...before, mergedMessage, ...after];
}

const CHAT_STORAGE_KEY = 'wa_chat_messages';
const AI_AVATAR = '/79fd36db-6d51-44a5-af73-bc63277d2b95.jpg';

function saveChat(messages: Message[]) {
  try {
    const slim = messages.map(({ id, sender, text, imageUrl, imageCaption, products, resultCode, followUp, timestamp, status }) => ({
      id, sender, text, imageUrl: imageUrl?.startsWith('http') ? imageUrl : undefined, imageCaption, products, resultCode, followUp, timestamp, status,
      hasImage: !!imageUrl,
    }));
    localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(slim));
  } catch { /* quota exceeded, ignore */ }
}

function loadChat(): Message[] {
  try {
    const raw = localStorage.getItem(CHAT_STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as Message[];
  } catch { return []; }
}

export function App() {
  return (
    <HashRouter>
      <Shell />
    </HashRouter>
  );
}

function Shell() {
  const navigate = useNavigate();
  const [session, setSession] = useState<AuthSession | null>(getSession());
  const [user, setUser] = useState<AuthUser | null>(session?.user ?? null);
  const [chat, setChat] = useState<Chat>({ id: 'main', name: 'Lisa', avatar: AI_AVATAR, about: 'Your AI shopping assistant', online: true, messages: [] });
  const [contextLoaded, setContextLoaded] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [profile, setProfile] = useState<ProfileData>({
    displayName: session?.user?.name ?? 'You',
    phoneNumber: session?.user?.phone ?? '',
    about: 'Available',
    location: '',
    avatarUrl: CURRENT_USER_AVATAR,
  });
  const [shops, setShops] = useState<ShopItem[]>([]);
  const [interests, setInterests] = useState<InterestEntry[]>([]);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isShopFormOpen, setIsShopFormOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [pendingAccountAction, setPendingAccountAction] = useState<'shop' | 'profile' | 'history' | 'interest' | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [deferredInstallPrompt, setDeferredInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isAppInstalled, setIsAppInstalled] = useState(false);

  const showToast = useCallback((message: string) => {
    setToastMessage(message);
    window.setTimeout(() => setToastMessage(null), 3500);
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const me = await getMe();
      setUser(me);
      setProfile((current) => ({
        ...current,
        displayName: me.name ?? current.displayName,
        phoneNumber: me.phone,
      }));
      const myShops = await getMyShops();
      setShops(myShops);
    } catch {
      /* ignore */
    }
  }, []);

  const handleAuthenticated = (newSession: AuthSession) => {
    const pending = pendingAccountAction;
    persistSession(newSession);
    setSession(newSession);
    setUser(newSession.user);
    setIsAuthOpen(false);
    setPendingAccountAction(null);
    setProfile((current) => ({
      ...current,
      displayName: newSession.user.name ?? current.displayName,
      phoneNumber: newSession.user.phone,
    }));
    void refreshUser();
    if (pending === 'shop') setIsShopFormOpen(true);
    if (pending === 'profile') setIsProfileOpen(true);
    if (pending === 'history') void openHistory();
  };

  const handleLogout = () => {
    clearAllSiteData();
    localStorage.removeItem(CHAT_STORAGE_KEY);
    setSession(null);
    setUser(null);
    setShops([]);
    setInterests([]);
    setHistory([]);
    setChat({ id: 'main', name: 'Lisa', avatar: AI_AVATAR, about: 'Your AI shopping assistant', online: true, messages: [] });
    setContextLoaded(false);
    setIsShopFormOpen(false);
    setIsProfileOpen(false);
    setIsHistoryOpen(false);
    setIsAuthOpen(false);
    setPendingAccountAction(null);
    navigate('/');
  };

  const requireAccount = (action: string, pending: 'shop' | 'profile' | 'history' | 'interest') => {
    showToast(`Create an account to ${action}. Your guest chat will remain here.`);
    setPendingAccountAction(pending);
    setIsAuthOpen(true);
  };

  const handleSend = async (text: string, attachment?: Attachment, retryMessageId?: string) => {
    const isImage = attachment?.mimeType.startsWith('image/');
    const newMessageId = retryMessageId ?? `user-${Date.now()}`;
    const userMessage: Message = {
      id: newMessageId,
      sender: 'user',
      text: isImage ? undefined : text || undefined,
      imageUrl: isImage ? attachment?.url : undefined,
      imageCaption: isImage ? text || undefined : undefined,
      attachment: isImage ? undefined : attachment,
      timestamp: now(),
      status: 'sent',
    };

    if (retryMessageId) {
      setChat((c) => ({
        ...c,
        messages: c.messages.map((message) =>
          message.id === retryMessageId ? { ...message, status: 'sent' } : message,
        ),
      }));
    } else {
      setChat((c) => ({ ...c, messages: [...c.messages, userMessage] }));
    }

    setIsTyping(true);

    try {
      const reply = await sendChat({ text: text || '', file: attachment?.file });

      if (reply.image_urls?.[0]) {
        setChat((c) => ({
          ...c,
          messages: c.messages.map((message) =>
            message.id === userMessage.id
              ? { ...message, imageUrl: reply.image_urls?.[0] }
              : message,
          ),
        }));
      }

      if (reply.messages && reply.messages.length > 0) {
        const responseText = reply.response_text?.trim();
        const serverMessages = reply.messages.filter(
          (message) => !(reply.follow_up && message.text?.trim() === reply.follow_up.prompt.trim()),
        );
        const normalizedMessages = mergeSearchResultMessages(serverMessages);
        const firstResultsIndex = normalizedMessages.findIndex((message) => message.type === 'search_results');
        const messages = [...normalizedMessages];
        if (responseText && !messages.some((message) => message.text?.trim() === responseText)) {
          messages.splice(
            firstResultsIndex >= 0 ? firstResultsIndex : messages.length,
            0,
            { type: 'text', text: responseText },
          );
        }
        const lastResultsIndex = messages.reduce(
          (last, message, index) => message.type === 'search_results' ? index : last,
          -1,
        );

        for (let i = 0; i < messages.length; i++) {
          const m = messages[i];
          setChat((c) => ({
            ...c,
            messages: [...c.messages, {
              id: `assistant-${Date.now()}-${i}`, sender: 'ai',
              text: m.type === 'text' ? m.text : undefined,
              products: m.type === 'search_results' ? [{ label: m.label || '', total: m.total || 0, results: m.results || [] }] : undefined,
              resultCode: i === lastResultsIndex ? reply.result_code : undefined,
              followUp: i === lastResultsIndex ? reply.follow_up : undefined,
              timestamp: now(),
            }],
          }));
        }
      } else {
        setChat((c) => ({
          ...c,
          messages: [...c.messages, {
            id: `assistant-${Date.now()}`, sender: 'ai',
            text: reply.text ?? reply.response_text,
            products: reply.sections,
            resultCode: reply.result_code,
            followUp: reply.follow_up,
            timestamp: now(),
          }],
        }));
      }
    } catch (error) {
      const failedMessageId = retryMessageId ?? newMessageId;
      setChat((c) => ({
        ...c,
        messages: c.messages.map((message) =>
          message.id === failedMessageId ? { ...message, status: 'failed' } : message,
        ),
      }));
      setChat((c) => ({
        ...c,
        messages: [...c.messages, {
          id: `error-${Date.now()}`, sender: 'ai',
          text: `Sorry: ${error instanceof Error ? error.message : 'unknown error'}`,
          timestamp: now(),
        }],
      }));
    } finally {
      setIsTyping(false);
    }
  };

  const addUserMessage = (msg: Message) => {
    setChat((c) => ({ ...c, messages: [...c.messages, msg] }));
  };

  const handleFollowUp = (prompt: string) => {
    void handleSend(prompt);
  };

  const handleResend = async (messageId: string) => {
    const message = chat.messages.find((item) => item.id === messageId && item.sender === 'user');
    if (!message || !message.text) return;
    await handleSend(message.text, message.attachment, messageId);
  };

  const handleInterest = async (productId: number, name: string, resultCode?: string) => {
    if (!session || !user) {
      requireAccount('save an interest', 'interest');
      return;
    }
    try {
      const result = await expressInterest(productId, resultCode);
      addUserMessage({
        id: `user-interest-${Date.now()}`, sender: 'user',
        text: `I'm interested in "${name}". Could you help me with it?`,
        timestamp: now(), status: 'read',
      });
      const p = result.product;
      const m = result.merchant;
      const price = p ? `${p.price.toLocaleString()} ${p.currency}` : 'N/A';
      const details = [
        p ? `*${p.name}* — ${price}` : '',
        p?.brand ? `Brand: ${p.brand}` : '',
        p?.category ? `Category: ${p.category}` : '',
        p?.stock_qty != null ? `In stock: ${p.stock_qty}` : '',
        m ? `Seller: *${m.business_name}* (${m.phone_number})` : '',
        result.result_code ? `Reference: *${result.result_code}*` : '',
      ].filter(Boolean).join('\n');
      setChat((c) => ({
        ...c,
        messages: [...c.messages, {
          id: `assistant-detail-${Date.now()}`, sender: 'ai',
          text: `Here are the details:\n\n${details}`,
          timestamp: now(),
        }],
      }));
      showToast('Interest sent to the seller');
      setInterests(await getMyInterests());
    } catch (error) {
      showToast(`Could not send interest: ${error instanceof Error ? error.message : 'error'}`);
    }
  };

  const handleShopRegistration = async (shopData: { shopName: string; productCategory: string; location: string; phoneNumber: string }) => {
    setIsShopFormOpen(false);
    try {
      await updateMerchantProfile({
        business_name: shopData.shopName,
        category: shopData.productCategory,
      });
      setShops(await getMyShops());
      void refreshUser();
      showToast(`${shopData.shopName} is ready to open on WhatsApp.`);
    } catch (error) {
      setIsShopFormOpen(true);
      showToast(`Could not register shop: ${error instanceof Error ? error.message : 'error'}`);
    }
  };

  const handleOpenShop = () => {
    if (!session || !user) {
      requireAccount('create a shop', 'shop');
      return;
    }
    if (shops.length === 0) {
      setIsShopFormOpen(true);
      return;
    }
    navigate('/shops');
  };

  const handleOpenDashboard = () => {
    if (!session || !user) {
      requireAccount('open your business dashboard', 'shop');
      return;
    }
    if (shops.length === 0) {
      setIsShopFormOpen(true);
      return;
    }
    navigate('/dashboard');
  };

  const handleCreateShop = () => {
    if (!session || !user) {
      requireAccount('create a shop', 'shop');
      return;
    }
    setIsShopFormOpen(true);
  };

  const handleOpenProfile = () => {
    if (!session || !user) {
      requireAccount('open your profile', 'profile');
      return;
    }
    setIsProfileOpen(true);
  };

  const openHistory = async () => {
    if (!session || !user) {
      requireAccount('view old chats', 'history');
      return;
    }
    setIsHistoryOpen(true);
    try {
      const [interestList, historyData] = await Promise.all([getMyInterests(), getMyHistory()]);
      setInterests(interestList);
      setHistory(historyData.history);
    } catch {
      /* ignore */
    }
  };

  const handleRemoveInterest = async (productId: number) => {
    try {
      await removeInterest(productId);
      setInterests((current) => current.filter((item) => item.product.id !== productId));
    } catch {
      /* ignore */
    }
  };

  useEffect(() => {
    if (session) void refreshUser();
  }, [session, refreshUser]);

  useEffect(() => {
    if (!contextLoaded) {
      const local = loadChat();
      if (local.length > 0) {
        setChat((c) => ({ ...c, messages: local }));
        setContextLoaded(true);
      } else {
        (async () => {
          try {
            const data = await getChatMessages();
            const msgs: Message[] = (data.messages || []).map((m: Record<string, unknown>) => ({
              id: (m.id as string) || `hist-${m.ts}`,
              sender: (m.sender as Message['sender']) || 'ai',
              text: (m.text as string) || (m.response_text as string) || undefined,
            imageUrl: Array.isArray(m.image_urls) && typeof m.image_urls[0] === 'string' ? m.image_urls[0] : undefined,
              imageCaption: typeof m.image_description === 'string' ? m.image_description : undefined,
              products: (m as Record<string, unknown>).sections as Message['products'],
              resultCode: (m.result_code as string) || undefined,
              timestamp: typeof m.ts === 'string' ? m.ts.slice(11, 16) : '',
            }));
            if (msgs.length > 0) {
              setChat((c) => ({ ...c, messages: msgs }));
              saveChat(msgs);
            }
          } catch { /* ignore */ }
        })();
        setContextLoaded(true);
      }
    }
  }, [session, contextLoaded]);

  useEffect(() => {
    if (chat.messages.length > 0) saveChat(chat.messages);
  }, [chat.messages]);

  useEffect(() => {
    const handleBeforeInstallPrompt = (event: Event) => {
      const promptEvent = event as BeforeInstallPromptEvent;
      promptEvent.preventDefault();
      setDeferredInstallPrompt(promptEvent);
    };

    const handleAppInstalled = () => {
      setDeferredInstallPrompt(null);
      setIsAppInstalled(true);
      showToast('App installed successfully');
    };

    const checkStandalone = () => {
      if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true) {
        setIsAppInstalled(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt as EventListener);
    window.addEventListener('appinstalled', handleAppInstalled);
    checkStandalone();

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt as EventListener);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [showToast]);

  const promptInstall = async () => {
    if (!deferredInstallPrompt) return;
    deferredInstallPrompt.prompt();
    const choiceResult = await deferredInstallPrompt.userChoice;
    if (choiceResult.outcome === 'accepted') {
      showToast('Thank you for installing the app');
    } else {
      showToast('Installation dismissed');
    }
    setDeferredInstallPrompt(null);
  };

  return (
    <main className="flex h-full w-full flex-col bg-wa-panelAlt">
      <div className="hidden h-[19px] w-full shrink-0 bg-wa-header md:block" />
      <div className="min-h-0 flex-1 md:mx-auto md:flex md:w-full md:max-w-[1280px] md:shadow-panel">
        {deferredInstallPrompt && !isAppInstalled && (
          <div className="mx-3 mb-3 rounded-2xl border border-wa-border bg-wa-panel px-4 py-3 text-sm text-wa-textPrimary shadow-sm md:mx-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-semibold text-wa-textPrimary">Install WhatApp for faster access</p>
                <p className="mt-1 text-xs text-wa-textSecondary">Add this app to your home screen for quick shopping support.</p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={promptInstall}
                  className="rounded-full bg-wa-green px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-[#1ebd53] focus:outline-none focus:ring-2 focus:ring-wa-green">
                  Install app
                </button>
                <button
                  type="button"
                  onClick={() => setDeferredInstallPrompt(null)}
                  className="rounded-full border border-wa-border bg-wa-panel px-4 py-2 text-xs font-semibold text-wa-textPrimary hover:bg-wa-panelAlt focus:outline-none focus:ring-2 focus:ring-wa-green">
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        )}
        <Routes>
          <Route
            path="/"
            element={
              <ChatWindow
                chat={chat}
                isTyping={isTyping}
                isAuthenticated={Boolean(session && user)}
                hasShop={shops.length > 0}
                interestedIds={new Set(interests.map((item) => item.product.id))}
                onSend={handleSend}
                onFollowUp={handleFollowUp}
                onInterest={handleInterest}
                onResend={handleResend}
                onOpenShop={handleOpenShop}
                onOpenDashboard={handleOpenDashboard}
                onOpenProfile={handleOpenProfile}
                onOpenHistory={() => void openHistory()}
                onLogout={handleLogout}
              />
            }
          />
          <Route path="/shops" element={<ShopsPage shops={shops} showToast={showToast} onCreateShop={handleCreateShop} />} />
          <Route path="/dashboard" element={<DashboardPage shops={shops} onCreateShop={handleCreateShop} />} />
          <Route path="/dashboard/:shopId" element={<DashboardPage shops={shops} onCreateShop={handleCreateShop} />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
      {isProfileOpen && (
        <ProfileModal
          profile={profile}
          onClose={() => setIsProfileOpen(false)}
          onSave={(updatedProfile) => {
            setProfile(updatedProfile);
            setIsProfileOpen(false);
            showToast('Profile updated');
          }}
        />
      )}
      {isHistoryOpen && (
        <HistoryModal
          interests={interests}
          history={history}
          onClose={() => setIsHistoryOpen(false)}
          onRemoveInterest={(productId) => void handleRemoveInterest(productId)}
        />
      )}
      {isShopFormOpen && (
        <ShopRegistrationForm
          onClose={() => setIsShopFormOpen(false)}
          onSubmit={(data) => void handleShopRegistration(data)}
        />
      )}
      {isAuthOpen && (
        <div className="fixed inset-0 z-[70] bg-black/30 p-3 backdrop-blur-sm">
          <AuthGate onAuthenticated={handleAuthenticated} />
        </div>
      )}
      {toastMessage && (
        <div role="status" className="fixed bottom-6 left-1/2 z-[60] -translate-x-1/2 rounded-full bg-wa-textPrimary px-4 py-2.5 text-sm text-white shadow-panel">
          {toastMessage}
        </div>
      )}
    </main>
  );
}
