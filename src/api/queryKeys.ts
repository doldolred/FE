export const queryKeys = {
  me: ['me'] as const,
  products: ['products'] as const,
  product: (id: number) => ['products', id] as const,
  cart: ['cart'] as const,
  orders: ['orders'] as const,
  order: (orderNumber: string) => ['orders', orderNumber] as const,
}
