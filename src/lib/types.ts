export type Category = 'Necklaces' | 'Rings' | 'Earrings' | 'Bracelets';
export type Tag = 'new' | 'bestseller';
export interface Product {
  id: number; slug: string; name: string; category: Category; collections: string[]; tags: Tag[];
  pricePaise: number; originalPricePaise?: number; /** Total available. With variants this is the sum of the per-size stock. */ stock: number; sku: string; short: string;
  description?: string; variants?: { label: string; options: string[]; optionStock?: Record<string, number> };
  material?: string; dimensions?: string; weight?: string;
  image?: string; imageAlt?: string; images?: { src: string; alt: string }[]; video?: string; seoTitle?: string; seoDescription?: string;
}
export interface Query { q?: string; category?: string; collection?: string; tag?: string; price?: string; stock?: string; sort?: string; page?: number }
export interface CartLine { productId: number; slug: string; name: string; category: Category; pricePaise: number; variant: string | null; qty: number }
export interface UserProfile { id: string; email: string; firstName: string; lastName: string; phone?: string | null; createdAt?: Date | string; }
export interface UserAddress { id: number; userId: string; label: string; recipientName: string; line1: string; line2?: string | null; city: string; state: string; pincode: string; country: string; phone?: string | null; isDefault: boolean; }

