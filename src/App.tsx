import React, { useCallback, useEffect, useState } from 'react';
import { ChatWindow } from './components/ChatWindow';
import { HistoryModal } from './components/HistoryModal';
import { ProfileModal } from './components/ProfileModal';
import { ShopManagementModal } from './components/ShopManagementModal';
import { ShopRegistrationForm } from './components/ShopRegistrationForm';
import { AuthGate } from './components/AuthGate';
import {
  Attachment,
  AuthSession,
  AuthUser,
  Chat,
  HistoryEntry,
  InterestEntry,
  Message,
  MerchantProfile,
  ProductItem,
  ProfileData,
} from './types';
import { CURRENT_USER_AVATAR, now } from './data';
import {
  clearSession,
  createProduct,
  deleteProduct,
  expressInterest,
  getMe,
  getMyHistory,
  getMyInterests,
  getMyProducts,
  getMerchantProfile,
  getSession,
  removeInterest,
  sendChat,
  setSession as persistSession,
  updateMerchantProfile,
  updateProduct,
  uploadProductImage,
} from './api';

const CHAT_STORAGE_KEY = 'wa_chat_messages';
const AI_AVATAR = '/79fd36db-6d51-44a5-af73-bc63277d2b95.jpg';

function saveChat(messages: Message[]) {
  try {
    const slim = messages.map(({ id, sender, text, imageUrl, imageCaption, products, resultCode, followUp, timestamp, status }) => ({
      id, sender, text, imageCaption, products, resultCode, followUp, timestamp, status,
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
  const [merchant, setMerchant] = useState<MerchantProfile | null>(null);
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [interests, setInterests] = useState<InterestEntry[]>([]);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isShopFormOpen, setIsShopFormOpen] = useState(false);
  const [isShopManagerOpen, setIsShopManagerOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

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
      if (me.role === 'merchant') {
        const [merchantData, productList] = await Promise.all([loadMerchantProfile(), getMyProducts()]);
        setMerchant(merchantData);
        setProducts(productList);
      }
    } catch {
      /* ignore */
    }
  }, []);

  const loadMerchantProfile = async (): Promise<MerchantProfile> => {
    try {
      return await getMerchantProfile();
    } catch {
      return null as unknown as MerchantProfile;
    }
  };

  const handleAuthenticated = (newSession: AuthSession) => {
    persistSession(newSession);
    setSession(newSession);
    setUser(newSession.user);
    setProfile((current) => ({
      ...current,
      displayName: newSession.user.name ?? current.displayName,
      phoneNumber: newSession.user.phone,
    }));
    void refreshUser();
  };

  const handleLogout = () => {
    clearSession();
    localStorage.removeItem(CHAT_STORAGE_KEY);
    setSession(null);
    setUser(null);
    setMerchant(null);
    setProducts([]);
    setInterests([]);
    setHistory([]);
    setChat({ id: 'main', name: 'Lisa', avatar: AI_AVATAR, about: 'Your AI shopping assistant', online: true, messages: [] });
    setContextLoaded(false);
    setIsShopManagerOpen(false);
    setIsShopFormOpen(false);
    setIsProfileOpen(false);
    setIsHistoryOpen(false);
  };

  const handleSend = async (text: string, attachment?: Attachment) => {
    const isImage = attachment?.mimeType.startsWith('image/');
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: isImage ? undefined : text || undefined,
      imageUrl: isImage ? attachment?.url : undefined,
      imageCaption: isImage ? text || undefined : undefined,
      attachment: isImage ? undefined : attachment,
      timestamp: now(),
      status: 'read',
    };

    setChat((c) => ({ ...c, messages: [...c.messages, userMessage] }));
    setIsTyping(true);

    try {
      const reply = await sendChat({ text: text || '', file: attachment?.file });

      if (reply.messages && reply.messages.length > 0) {
        for (let i = 0; i < reply.messages.length; i++) {
          const m = reply.messages[i];
          setChat((c) => ({
            ...c,
            messages: [...c.messages, {
              id: `assistant-${Date.now()}-${i}`, sender: 'ai',
              text: m.type === 'text' ? m.text : undefined,
              products: m.type === 'search_results' ? [{ label: m.label || '', total: m.total || 0, results: m.results || [] }] : undefined,
              resultCode: i === reply.messages.length - 1 ? reply.result_code : undefined,
              followUp: i === reply.messages.length - 1 ? reply.follow_up : undefined,
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

  const handleInterest = async (productId: number, name: string) => {
    try {
      await expressInterest(productId);
      addUserMessage({
        id: `user-interest-${Date.now()}`, sender: 'user',
        text: `I'm interested in "${name}". Could you help me with it?`,
        timestamp: now(), status: 'read',
      });
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
      const [merchantData, productList] = await Promise.all([loadMerchantProfile(), getMyProducts()]);
      setMerchant(merchantData);
      setProducts(productList);
      void refreshUser();
      setIsShopManagerOpen(true);
      showToast(`${shopData.shopName} is ready to open on WhatsApp.`);
    } catch (error) {
      setIsShopFormOpen(true);
      showToast(`Could not register shop: ${error instanceof Error ? error.message : 'error'}`);
    }
  };

  const handleOpenShop = () => {
    if (merchant) {
      setIsShopManagerOpen(true);
    } else {
      setIsShopFormOpen(true);
    }
  };

  const handleCreateProduct = async (product: {
    name: string;
    price: string;
    category: string;
    description: string;
    stock: string;
    imageUrl?: string;
  }, file?: File) => {
    const price = parseFloat(product.price.replace(/[^0-9.]/g, ''));
    const stock = parseInt(product.stock.replace(/\D/g, ''), 10);
    if (Number.isNaN(price)) {
      showToast('Please enter a valid price');
      return;
    }
    try {
      const created = await createProduct({
        name: product.name,
        category: product.category,
        price,
        stock_qty: Number.isNaN(stock) ? 0 : stock,
        brand: product.description,
      });
      if (file) await uploadProductImage(created.id, file);
      setProducts(await getMyProducts());
      showToast('Product added to your catalog');
    } catch (error) {
      showToast(`Could not add product: ${error instanceof Error ? error.message : 'error'}`);
    }
  };

  const handleUpdateProduct = async (product: ProductItem) => {
    try {
      await updateProduct(product.id, {
        name: product.name,
        category: product.category,
        price: product.price,
        brand: product.brand ?? undefined,
        stock_qty: product.stock_qty,
      });
      setProducts(await getMyProducts());
      showToast('Product updated');
    } catch (error) {
      showToast(`Could not update product: ${error instanceof Error ? error.message : 'error'}`);
    }
  };

  const handleDeleteProduct = async (productId: number) => {
    try {
      await deleteProduct(productId);
      setProducts((current) => current.filter((item) => item.id !== productId));
      showToast('Product deleted');
    } catch (error) {
      showToast(`Could not delete product: ${error instanceof Error ? error.message : 'error'}`);
    }
  };

  const openHistory = async () => {
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
    if (session && !contextLoaded) {
      const local = loadChat();
      if (local.length > 0) {
        setChat((c) => ({ ...c, messages: local }));
        setContextLoaded(true);
      } else {
        (async () => {
          try {
            const token = getSession()?.access_token;
            if (!token) return;
            const res = await fetch(`${API_URL}/api/chat/conversations/messages`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) return;
            const data = await res.json();
            const msgs: Message[] = (data.messages || []).map((m: Record<string, unknown>) => ({
              id: (m.id as string) || `hist-${m.ts}`,
              sender: (m.sender as Message['sender']) || 'ai',
              text: (m.text as string) || (m.response_text as string) || undefined,
              imageUrl: undefined,
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

  if (!session || !user) {
    return (
      <main className="h-full w-full bg-wa-panelAlt">
        <AuthGate onAuthenticated={handleAuthenticated} />
      </main>
    );
  }

  return (
    <main className="flex h-full w-full flex-col bg-wa-panelAlt">
      <div className="hidden h-[19px] w-full shrink-0 bg-wa-header md:block" />
      <div className="min-h-0 flex-1 md:mx-auto md:flex md:w-full md:max-w-[1280px] md:shadow-panel">
        <ChatWindow
          chat={chat}
          isTyping={isTyping}
          onSend={handleSend}
          onFollowUp={handleFollowUp}
          onInterest={handleInterest}
          onOpenShop={handleOpenShop}
          onOpenProfile={() => setIsProfileOpen(true)}
          onOpenHistory={() => void openHistory()}
          onLogout={handleLogout}
        />
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
      {isShopManagerOpen && merchant && (
        <ShopManagementModal
          shop={{
            shopName: merchant.business_name,
            location: merchant.location_lat != null ? `${merchant.location_lat.toFixed(4)}, ${merchant.location_lng?.toFixed(4)}` : '',
            phoneNumber: merchant.phone_number,
          }}
          products={products}
          onClose={() => setIsShopManagerOpen(false)}
          onCreate={(product, file) => void handleCreateProduct(product, file)}
          onUpdate={(product) => void handleUpdateProduct(product)}
          onDelete={(productId) => void handleDeleteProduct(productId)}
          onUploadImage={(productId, file) => void uploadProductImage(productId, file)}
        />
      )}
      {toastMessage && (
        <div role="status" className="fixed bottom-6 left-1/2 z-[60] -translate-x-1/2 rounded-full bg-wa-textPrimary px-4 py-2.5 text-sm text-white shadow-panel">
          {toastMessage}
        </div>
      )}
    </main>
  );
}
