export type Sender = 'user' | 'ai';

export interface Attachment {
  name: string;
  url: string;
  mimeType: string;
  size: number;
}

export interface ShopRegistrationData {
  phoneNumber: string;
  shopName: string;
  productCategory: string;
  shopAddress: string;
  buildingRoomNumber: string;
  location: string;
}

export interface ProfileData {
  displayName: string;
  phoneNumber: string;
  about: string;
  location: string;
  avatarUrl: string;
}

export interface Product {
  id: string;
  name: string;
  price: string;
  category: string;
  description: string;
  stock: string;
  imageUrl?: string;
}

export interface Message {
  id: string;
  sender: Sender;
  text?: string;
  imageUrl?: string;
  imageCaption?: string;
  attachment?: Attachment;
  timestamp: string; // "10:24"
  status?: 'sent' | 'delivered' | 'read';
}

export interface Chat {
  id: string;
  name: string;
  avatar: string;
  about: string;
  online: boolean;
  messages: Message[];
  unread?: number;
}