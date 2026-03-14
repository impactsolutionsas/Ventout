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
  userId: string;
  userName: string;
  userEmail: string;
  items: CartItem[];
  total: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  paymentMethod: 'cod' | 'card';
  shippingAddress: {
    firstName: string;
    lastName: string;
    address: string;
    city: string;
    phone: string;
  };
  createdAt: number;
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
  displayName: string;
  photoURL?: string;
  role: 'admin' | 'user';
  createdAt: number;
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
