export const queryKeys = {
  me: ['me'] as const,
  products: ['products'] as const,
  product: (id: number) => ['products', id] as const,
  cart: ['cart'] as const,
  orders: ['orders'] as const,
  order: (orderNumber: string) => ['orders', orderNumber] as const,
  banners: ['banners'] as const,
  notices: (page: number) => ['notices', page] as const,
  notice: (id: number) => ['notices', 'detail', id] as const,
}
