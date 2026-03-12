import { Product, Category } from './types';

export const CATEGORIES: Category[] = [
  {
    id: 'gros-electro',
    name: 'Gros Électroménager',
    description: 'Réfrigérateurs, Lave-linges, Fours',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDrs1-xgEl4a7XKCC9E1iciRUPKi3O5kXSRu0rIgwXPh-zdYFPph1xUTMYjq3bSgIUPP64V0AclgylXv60AUb8cmUvWzY1hdzSmgOF7Jj5SC5aixMC4qC9833DSQVFII9sInGk3pglpqhqRuZA6nkJ4C6UqvrFMMd5CKwDmi6KQPTpyuy5s6-N3xCV_OjB73MFAqstadMQfJtM2CDCiViWiBD56Pu2K2rs261WQkIrn6kBUt36ulTv70QdgF6z0JdGr6OknXUf3M1I'
  },
  {
    id: 'petit-electro',
    name: 'Petit Électroménager',
    description: 'Cafetières, Robots, Aspirateurs',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDsXu2bjf9c7P61nT_tvyF3E_-ISnJvaSI8lGmbk9bYawvCn6RZu1kwRX32aWjaTiR1Aia03atzs2mcyY3CZtnATXgYiVJrjS0jQW8MhyBR8OPkDoQOi3978RHDjuUXX0bmx410nyysTLahlWDRhWU230MXlfAXbHC8NeMXk9pEuU8EsR9NjhCdxQDOkZnx-3Cn7007To3GxQt_4hb9fDN377K6PJRolx51YbulS_GxA6botgX422EnRX7WUC7cUiQGivOfdrK3hLM'
  },
  {
    id: 'electronics',
    name: 'Électronique',
    description: 'Smartphones, Laptops, Tablettes',
    image: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?auto=format&fit=crop&q=80&w=400'
  },
  {
    id: 'cuisine',
    name: 'Cuisine',
    description: 'Micro-ondes, Mixeurs, Cuisson',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDx8_lXvoDc6SissUSTliWuwrKcxyh5jSlElDg7jeDgeZXjUhjjUGbylwowK3odBQG8bmLKiVEyD6n2mBOsns1QPZ8Z29octH8Y2Yfj-7bIvS9LKwZkkBjEMLGhHF0qBMI1OKinTfhkN_0-KnbCw1Zu05FdbsVZ6KjFEjgNLmR5uwfKvzMnuNhJfsIy-DdAF1oN_urDuQlDMkIFvxX7ByR4MvYEAA0FIFrRtpAsPcrjFHajtsUElhiX-6bCmlPBvSNUcOv0wCv1_jw'
  },
  {
    id: 'personal-care',
    name: 'Soin Personnel',
    description: 'Sèche-cheveux, Rasoirs, Bien-être',
    image: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&q=80&w=400'
  }
];

export const PRODUCTS: Product[] = [
  {
    id: '1',
    name: 'Réfrigérateur Américain Samsung RS68',
    description: '634L, Technologie SpaceMax™, Froid ventilé intégral, Distributeur d\'eau, glaçons et glace pilée sans raccordement d\'eau.',
    price: 980000,
    oldPrice: 1180000,
    category: 'gros-electro',
    brand: 'Samsung',
    image: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&q=80&w=800',
    stock: 12,
    featured: true,
    new: true,
    rating: 4.5,
    reviewsCount: 128,
    specs: {
      'Volume Total': '634 Litres',
      'Classe Énergétique': 'F',
      'Dimensions': '91.2 x 178 x 71.6 cm',
      'Niveau Sonore': '36 dB'
    }
  },
  {
    id: '2',
    name: 'Robot Pâtissier KitchenAid Artisan 4.8L',
    description: 'Le robot pâtissier emblématique pour toutes vos créations culinaires.',
    price: 360000,
    category: 'petit-electro',
    brand: 'KitchenAid',
    image: 'https://images.unsplash.com/photo-1591333139245-2b411c9d7b7c?auto=format&fit=crop&q=80&w=800',
    stock: 25,
    featured: true,
    new: true,
    rating: 5,
    reviewsCount: 84,
    specs: {
      'Capacité': '4.8 Litres',
      'Puissance': '300W',
      'Matériau': 'Métal coulé'
    }
  },
  {
    id: '5',
    name: 'iPhone 15 Pro Max 256GB',
    description: 'Le summum de la technologie Apple avec puce A17 Pro.',
    price: 850000,
    category: 'electronics',
    brand: 'Apple',
    image: 'https://images.unsplash.com/photo-1696446701796-da61225697cc?auto=format&fit=crop&q=80&w=400',
    stock: 15,
    featured: true,
    new: true,
    rating: 4.9,
    reviewsCount: 450,
    specs: {
      'Écran': '6.7" Super Retina XDR',
      'Puce': 'A17 Pro',
      'Caméra': '48MP Main'
    }
  },
  {
    id: '6',
    name: 'MacBook Air M3 13"',
    description: 'Fin, léger et incroyablement puissant.',
    price: 785000,
    category: 'electronics',
    brand: 'Apple',
    image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&q=80&w=400',
    stock: 10,
    featured: true,
    new: true,
    rating: 4.8,
    reviewsCount: 120,
    specs: {
      'Puce': 'M3',
      'RAM': '8GB',
      'Stockage': '256GB SSD'
    }
  },
  {
    id: '3',
    name: 'Machine Espresso Breville Barista Express',
    description: 'Café de qualité professionnelle à la maison.',
    price: 445000,
    oldPrice: 555000,
    category: 'petit-electro',
    brand: 'Breville',
    image: 'https://images.unsplash.com/photo-1585515320310-259814833e62?auto=format&fit=crop&q=80&w=800',
    stock: 8,
    featured: true,
    rating: 4.8,
    reviewsCount: 210,
    specs: {
      'Pression': '15 bars',
      'Broyeur': 'Intégré',
      'Réservoir': '2 Litres'
    }
  },
  {
    id: '4',
    name: 'Micro-ondes LG NeoChef 25L',
    description: 'Technologie Smart Inverter pour une cuisson uniforme.',
    price: 125000,
    category: 'cuisine',
    brand: 'LG',
    image: 'https://images.unsplash.com/photo-1585238341267-1cfec2046a55?auto=format&fit=crop&q=80&w=800',
    stock: 45,
    featured: false,
    rating: 4.2,
    reviewsCount: 56,
    specs: {
      'Capacité': '25 Litres',
      'Puissance': '1000W',
      'Type': 'Solo'
    }
  },
  {
    id: '7',
    name: 'Sèche-cheveux Dyson Supersonic',
    description: 'Séchage rapide sans chaleur extrême.',
    price: 295000,
    category: 'personal-care',
    brand: 'Dyson',
    image: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&q=80&w=400',
    stock: 20,
    featured: true,
    rating: 4.9,
    reviewsCount: 320,
    specs: {
      'Moteur': 'V9',
      'Réglages': '3 vitesses, 4 chaleurs'
    }
  }
];
