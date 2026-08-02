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
import { CURRENT_USER_AVATAR, initialChat, now } from './data';
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

export function App() {
  const [session, setSession] = useState<AuthSession | null>(getSession());
  const [user, setUser] = useState<AuthUser | null>(session?.user ?? null);
  const [chat, setChat] = useState<Chat>({ ...initialChat, name: 'Lisa' });
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
    setSession(null);
    setUser(null);
    setMerchant(null);
    setProducts([]);
    setInterests([]);
    setHistory([]);
    setChat({ ...initialChat, name: 'Lisa' });
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

    setChat((current) => ({ ...current, messages: [...current.messages, userMessage] }));
    setIsTyping(true);

    try {
      const reply = await sendChat({
        text: text || '',
        file: attachment?.file,
      });

      const aiText = reply.text ?? reply.response_text;
      const aiMessage: Message = {
        id: `assistant-${Date.now()}`,
        sender: 'ai',
        text: aiText,
        products: reply.sections,
        resultCode: reply.result_code,
        followUp: reply.follow_up,
        timestamp: now(),
      };
      setChat((current) => ({ ...current, messages: [...current.messages, aiMessage] }));
    } catch (error) {
      const errorMessage: Message = {
        id: `assistant-error-${Date.now()}`,
        sender: 'ai',
        text: `Sorry, that request failed: ${error instanceof Error ? error.message : 'unknown error'}`,
        timestamp: now(),
      };
      setChat((current) => ({ ...current, messages: [...current.messages, errorMessage] }));
    } finally {
      setIsTyping(false);
    }
  };

  const handleFollowUp = (prompt: string) => {
    void handleSend(prompt);
  };

  const handleInterest = async (productId: number, name: string) => {
    try {
      await expressInterest(productId);
      const interestMessage: Message = {
        id: `user-interest-${Date.now()}`,
        sender: 'user',
        text: `I'm interested in "${name}". Could you help me with it?`,
        timestamp: now(),
        status: 'read',
      };
      setChat((current) => ({ ...current, messages: [...current.messages, interestMessage] }));
      showToast('Interest sent to the seller');
      const updated = await getMyInterests();
      setInterests(updated);
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
