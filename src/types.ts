export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  oldPrice?: number;
  category: string;
  brand: string;
  image: string;
  stock: number;
  featured?: boolean;
  new?: boolean;
  rating: number;
  reviewsCount: number;
  specs: Record<string, string>;
}

export interface CartItem extends Product {
  quantity: number;
}

export interface Order {
  id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  items: CartItem[];
  total: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  payment_method: 'cod' | 'card';
  shipping_address: {
    firstName: string;
    lastName: string;
    address: string;
    city: string;
    phone: string;
  };
  created_at: string;
}

export interface Category {
  id: string;
  name: string;
  image: string;
  description: string;
}

export interface UserProfile {
  id: string;
  email: string;
  display_name: string;
  photo_url?: string;
  role: 'admin' | 'user';
  created_at: string;
}

export interface AppSettings {
  siteName: string;
  logo: string;
  currency: string;
  contactEmail: string;
}

export interface Slide {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  image: string;
  link: string;
  buttonText: string;
  active: boolean;
}

export interface FrontendContent {
  slides: Slide[];
  featuredSections: {
    id: string;
    title: string;
    subtitle: string;
    active: boolean;
  }[];
}
