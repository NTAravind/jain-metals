import { create } from "zustand"
import { persist } from "zustand/middleware"

export interface CartItem {
  productId: string
  sizeVariantId?: string | null
  sizeVariantName?: string | null
  quantity: number
  product: { 
    id: string
    name: string
    slug: string
    price: number
    discountedPrice?: number | null
    stock: number
    images: string[]
    weightKg?: number | null
  }
}

/** Unique key for a cart line item (same product + different size = separate lines) */
function itemKey(item: { productId: string; sizeVariantId?: string | null }) {
  return item.sizeVariantId ? `${item.productId}::${item.sizeVariantId}` : item.productId
}

interface CartStore {
  items: CartItem[]
  addItem: (item: CartItem) => void
  removeItem: (productId: string, sizeVariantId?: string | null) => void
  updateQuantity: (productId: string, quantity: number, sizeVariantId?: string | null) => void
  clearCart: () => void
  refreshPrices: (updates: { productId: string; sizeVariantId: string | null; price: number; discountedPrice: number | null; stock: number }[]) => boolean
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      refreshPrices: (updates) => {
        let hasChanges = false
        set((state) => {
          const newItems = state.items.map(item => {
            const match = updates.find(u => u.productId === item.productId && u.sizeVariantId === (item.sizeVariantId ?? null))
            if (match) {
              if (
                item.product.price !== match.price ||
                item.product.discountedPrice !== match.discountedPrice ||
                item.product.stock !== match.stock
              ) {
                hasChanges = true
                return {
                  ...item,
                  product: {
                    ...item.product,
                    price: match.price,
                    discountedPrice: match.discountedPrice,
                    stock: match.stock,
                  },
                  quantity: Math.min(item.quantity, match.stock)
                }
              }
            }
            return item
          })
          return { items: newItems }
        })
        return hasChanges
      },
      addItem: (newItem) =>
        set((state) => {
          const key = itemKey(newItem)
          const existing = state.items.find((i) => itemKey(i) === key)
          if (existing) {
            return {
              items: state.items.map((i) =>
                itemKey(i) === key
                  ? {
                      ...i,
                      quantity: Math.min(
                        i.product.stock,
                        i.quantity + newItem.quantity,
                      ),
                    }
                  : i,
              ),
            }
          }
          return { items: [...state.items, newItem] }
        }),
      removeItem: (productId, sizeVariantId) =>
        set((state) => {
          const key = itemKey({ productId, sizeVariantId })
          return { items: state.items.filter((i) => itemKey(i) !== key) }
        }),
      updateQuantity: (productId, quantity, sizeVariantId) =>
        set((state) => {
          const key = itemKey({ productId, sizeVariantId })
          return {
            items: state.items.map((i) =>
              itemKey(i) === key ? { ...i, quantity } : i,
            ),
          }
        }),
      clearCart: () => set({ items: [] }),
    }),
    { name: "statue-cart" },
  ),
)
