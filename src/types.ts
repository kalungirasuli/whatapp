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
  status?: 'sent' | 'delivered' | 'read' | 'failed';
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
  image_urls?: string[];
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

export interface ShopItem extends MerchantProfile {
  product_count: number;
}

export interface ProductItem {
  id: number;
  name: string;
  brand: string | null;
  category: string;
  attributes?: Record<string, unknown>;
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
  result_code?: string | null;
  search_images?: ProductImage[];
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

export interface InterestResponse {
  id: number;
  status: string;
  created_at: string;
  result_code?: string | null;
  search_images: ProductImage[];
  product: {
    id: number;
    name: string;
    price: number;
    currency: string;
    category: string;
    brand: string | null;
    stock_qty: number;
    images: ProductImage[];
  };
  merchant: {
    id: number;
    business_name: string;
    phone_number: string;
    category: string;
    location_lat?: number | null;
    location_lng?: number | null;
  } | null;
}

export interface MerchantAnalyticsOverview {
  mode: string;
  category: string;
  period_days: number;
  summary: {
    products: number;
    active_products: number;
    interests: number;
    unique_buyers: number;
    search_impressions: number;
    conversion_rate: number;
    average_match_score: number;
  };
  timeline: Array<{ date: string; interests: number; impressions: number }>;
  top_products: ProductInsight[];
}

export interface ProductInsight {
  product_id: number;
  name: string;
  category: string;
  brand: string | null;
  price: number;
  currency: string;
  stock_qty: number;
  image_count: number;
  attributes: Record<string, unknown>;
  impressions: number;
  interests: number;
  conversion_rate: number;
  average_score: number;
  average_rank: number | null;
}

export interface MerchantCategoryAnalytics {
  category: string;
  period_days: number;
  market: {
    products: number;
    merchants: number;
    searches: number;
    impressions: number;
    merchant_impression_share: number;
  };
  attributes: Record<string, Record<string, number>>;
  prices: { average_market_price: number; your_average_price: number };
}

export interface MerchantBuyerAnalytics {
  period_days: number;
  unique_buyers: number;
  buyers: Array<{
    phone: string;
    interests: number;
    first_seen: string;
    last_seen: string;
    products: number[];
  }>;
}

export interface AnalyticsRecommendation {
  type: string;
  priority: string;
  message: string;
  product_id?: number;
}

export interface HistoryEntry {
  query: string;
  ts: number;
}

/* ---- Admin domain types ---- */

export interface AdminUserItem {
  id: number;
  phone: string;
  name: string | null;
  email?: string | null;
  role: string;
  is_verified: boolean;
  is_banned: boolean;
  created_at: string;
  last_active_at?: string;
}

export interface AdminUserDetail extends AdminUserItem {
  interests_count: number;
  interactions_count: number;
  merchants: Array<{
    id: number;
    business_name: string;
    category: string;
    status: string;
  }>;
}

export interface AdminUserPage {
  total: number;
  page: number;
  size: number;
  users: AdminUserItem[];
}

export interface AdminMerchantItem {
  id: number;
  phone_number: string;
  business_name: string;
  category: string;
  status: string;
  created_at: string;
  product_count: number;
  interest_count: number;
}

export interface AdminMerchantPage {
  total: number;
  page: number;
  size: number;
  merchants: AdminMerchantItem[];
}

export interface AdminProductItem {
  id: number;
  merchant_id: number;
  merchant_name?: string | null;
  name: string;
  brand: string | null;
  category: string;
  price: number;
  currency: string;
  stock_qty: number;
  status: string;
  created_at: string;
  updated_at?: string;
}

export interface AdminProductPage {
  total: number;
  page: number;
  size: number;
  products: AdminProductItem[];
}

export interface AdminMerchantDetail {
  id: number;
  phone_number: string;
  business_name: string;
  category: string;
  location_lat: number | null;
  location_lng: number | null;
  status: string;
  created_at: string;
  product_count: number;
  interest_count: number;
  products: AdminProductItem[];
  interests: Array<{
    id: number;
    buyer_phone: string;
    product_id: number;
    result_code: string | null;
    status: string;
    created_at: string;
  }>;
}

export interface AdminProductDetail extends AdminProductItem {
  attributes: Record<string, unknown>;
  interest_count: number;
  images: Array<{ id: number; storage_url: string; is_primary: boolean }>;
}

export interface AdminInteractionItem {
  id: number;
  user_id: number | null;
  phone_number: string;
  correlation_id?: string | null;
  user_message_type: string;
  user_text: string | null;
  image_count: number;
  image_urls: string[];
  image_description: string | null;
  nlu_intents: Array<Record<string, unknown>>;
  text_topic?: string | null;
  text_family?: string | null;
  image_family?: string | null;
  reply_type: string | null;
  response_text: string | null;
  result_code: string | null;
  follow_up?: unknown;
  top_results: Array<Record<string, unknown>>;
  latency_ms: number | null;
  created_at: string;
}

export interface AdminInteractionPage {
  total: number;
  page: number;
  size: number;
  interactions: AdminInteractionItem[];
}

export interface AdminInterestItem {
  id: number;
  buyer_phone: string;
  result_code: string | null;
  status: string;
  created_at: string;
  search_images: string[];
  product: {
    id: number;
    name: string;
    price: number;
    currency: string;
    category: string;
  } | null;
  merchant: {
    id: number;
    business_name: string;
    phone_number: string;
  } | null;
}

export interface AdminInterestPage {
  total: number;
  page: number;
  size: number;
  interests: AdminInterestItem[];
}

export interface AdminOverview {
  users: { total: number; admins: number; banned: number };
  merchants: { total: number; approved: number; suspended: number; banned: number };
  products: { total: number; active: number; inactive: number; pending_moderation: number };
  buyers: { total: number; banned: number };
  interests: { total: number; sent: number; responded: number };
  messages: { total: number };
  interactions: { total: number };
  recent_users: Array<Pick<AdminUserItem, 'id' | 'phone' | 'name' | 'role' | 'is_banned' | 'created_at'>>;
  recent_merchants: Array<{
    id: number;
    business_name: string;
    phone_number: string;
    category: string;
    status: string;
    created_at: string;
  }>;
  recent_interactions: Array<{
    id: number;
    phone_number: string;
    user_message_type: string;
    user_text: string | null;
    reply_type: string | null;
    response_text: string | null;
    latency_ms: number | null;
    created_at: string;
  }>;
  recent_interests: Array<{
    id: number;
    buyer_phone: string;
    status: string;
    result_code: string | null;
    product_name: string | null;
    created_at: string;
  }>;
}

export interface AdminAnalytics {
  period_days: number;
  summary: {
    interactions: number;
    interests: number;
    unique_buyers: number;
    unique_merchants_contacted: number;
    result_codes_issued: number;
    average_latency_ms: number | null;
  };
  timeline: Array<{ date: string; interactions: number; interests: number; conversations: number }>;
  top_merchants: Array<{ id: number; business_name: string; category: string; status: string; interests: number }>;
  top_categories: Array<{ category: string; count: number }>;
  reply_types: Array<{ type: string; count: number }>;
}
