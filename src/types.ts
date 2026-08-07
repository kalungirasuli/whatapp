export type Sender = 'user' | 'ai';

export interface Attachment {
  name: string;
  url: string;
  mimeType: string;
  size: number;
  file?: File;
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
  products?: SearchSection[];
  resultCode?: string;
  followUp?: { type: string; topic: string; image_family: string; prompt: string };
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

/* ---- API domain types ---- */

export interface AuthUser {
  id: number;
  phone: string;
  name: string | null;
  role: string;
  is_verified: boolean;
  created_at: string;
}

export interface AuthSession {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user: AuthUser;
}

export interface ProductImage {
  id?: number;
  url: string;
  is_primary: boolean;
}

export interface ProductResult {
  product_id: number;
  name: string;
  price: number;
  currency: string;
  category: string;
  score: number;
  match_label: string;
  distance_km?: number | null;
  merchant?: {
    id: number;
    business_name: string;
    phone_number: string;
    category: string;
    location_lat?: number | null;
    location_lng?: number | null;
  } | null;
  images: ProductImage[];
}

export interface SearchSection {
  label: string;
  total: number;
  results: ProductResult[];
}

export interface FollowUp {
  type: string;
  topic: string;
  image_family: string;
  prompt: string;
}

export interface ChatReply {
  reply_type: 'conversation' | 'text' | 'search_results' | 'recall' | string;
  text?: string;
  response_text?: string;
  result_code?: string;
  messages?: ChatMessage[];
  sections?: SearchSection[];
  follow_up?: FollowUp;
}

export interface ChatMessage {
  type: 'text' | 'search_results';
  text?: string;
  label?: string;
  total?: number;
  results?: ProductResult[];
}

export interface Conversation {
  id: string;
  title: string;
  avatar: string;
  updated_at: string;
  last_message: string;
}

export interface MerchantProfile {
  id: number;
  phone_number: string;
  business_name: string;
  category: string;
  location_lat: number | null;
  location_lng: number | null;
  status: string;
  created_at: string;
}

export interface ProductItem {
  id: number;
  name: string;
  brand: string | null;
  category: string;
  price: number;
  currency: string;
  stock_qty: number;
  status: string;
  created_at: string;
  updated_at: string;
  images: ProductImage[];
}

export interface InterestEntry {
  id: number;
  status: string;
  created_at: string;
  product: {
    id: number;
    name: string;
    price: number;
    currency: string;
    category: string;
    merchant_name: string;
    images: ProductImage[];
  };
}

export interface HistoryEntry {
  query: string;
  ts: number;
}
