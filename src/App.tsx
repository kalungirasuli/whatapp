import React, { useState } from 'react';
import { ChatWindow } from './components/ChatWindow';
import { ProfileModal } from './components/ProfileModal';
import { ShopManagementModal } from './components/ShopManagementModal';
import { ShopRegistrationForm } from './components/ShopRegistrationForm';
import {
  Attachment,
  Message,
  Product,
  ProfileData,
  ShopRegistrationData } from
'./types';
import { CURRENT_USER_AVATAR, initialChat, getAiReply, now } from './data';

export function App() {
  const [chat, setChat] = useState(initialChat);
  const [isTyping, setIsTyping] = useState(false);
  const [profile, setProfile] = useState<ProfileData>({
    displayName: 'You',
    phoneNumber: '',
    about: 'Available',
    location: '',
    avatarUrl: CURRENT_USER_AVATAR
  });
  const [shop, setShop] = useState<ShopRegistrationData | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isShopFormOpen, setIsShopFormOpen] = useState(false);
  const [isShopManagerOpen, setIsShopManagerOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleSend = (text: string, attachment?: Attachment) => {
    const isImage = attachment?.mimeType.startsWith('image/');
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: isImage ? undefined : text || undefined,
      imageUrl: isImage ? attachment?.url : undefined,
      imageCaption: isImage ? text || undefined : undefined,
      attachment: isImage ? undefined : attachment,
      timestamp: now(),
      status: 'read'
    };

    setChat((current) => ({
      ...current,
      messages: [...current.messages, userMessage]
    }));
    setIsTyping(true);

    const delay = 900 + Math.random() * 900;
    window.setTimeout(() => {
      const aiMessage: Message = {
        id: `assistant-${Date.now()}`,
        sender: 'ai',
        text: getAiReply(text),
        timestamp: now()
      };

      setChat((current) => ({
        ...current,
        messages: [...current.messages, aiMessage]
      }));
      setIsTyping(false);
    }, delay);
  };

  const showToast = (message: string) => {
    setToastMessage(message);
    window.setTimeout(() => setToastMessage(null), 3500);
  };

  const handleShopRegistration = (shopData: ShopRegistrationData) => {
    setShop(shopData);
    setIsShopFormOpen(false);
    setIsShopManagerOpen(true);
    showToast(`${shopData.shopName} is ready to open on WhatsApp.`);
  };

  const handleOpenShop = () => {
    if (shop) {
      setIsShopManagerOpen(true);
    } else {
      setIsShopFormOpen(true);
    }
  };

  const handleProfileSave = (updatedProfile: ProfileData) => {
    setProfile(updatedProfile);
    setIsProfileOpen(false);
    showToast('Profile updated');
  };

  const handleCreateProduct = (product: Product) => {
    setProducts((current) => [...current, product]);
    showToast('Product added to your catalog');
  };

  const handleUpdateProduct = (product: Product) => {
    setProducts((current) => current.map((item) => item.id === product.id ? product : item));
    showToast('Product updated');
  };

  const handleDeleteProduct = (productId: string) => {
    setProducts((current) => current.filter((item) => item.id !== productId));
    showToast('Product deleted');
  };

  return (
    <main className="flex h-full w-full flex-col bg-wa-panelAlt">
      <div className="hidden h-[19px] w-full shrink-0 bg-wa-header md:block" />
      <div className="min-h-0 flex-1 md:mx-auto md:flex md:w-full md:max-w-[1280px] md:shadow-panel">
        <ChatWindow
          chat={chat}
          isTyping={isTyping}
          onSend={handleSend}
          onOpenShop={handleOpenShop}
          onOpenProfile={() => setIsProfileOpen(true)} />
        
      </div>
      {isProfileOpen &&
      <ProfileModal
        profile={profile}
        onClose={() => setIsProfileOpen(false)}
        onSave={handleProfileSave} />

      }
      {isShopFormOpen &&
      <ShopRegistrationForm
        onClose={() => setIsShopFormOpen(false)}
        onSubmit={handleShopRegistration} />

      }
      {isShopManagerOpen && shop &&
      <ShopManagementModal
        shop={shop}
        products={products}
        onClose={() => setIsShopManagerOpen(false)}
        onCreate={handleCreateProduct}
        onUpdate={handleUpdateProduct}
        onDelete={handleDeleteProduct} />

      }
      {toastMessage &&
      <div role="status" className="fixed bottom-6 left-1/2 z-[60] -translate-x-1/2 rounded-full bg-wa-textPrimary px-4 py-2.5 text-sm text-white shadow-panel">
          {toastMessage}
        </div>
      }
    </main>);

}