import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import type { CartLine, MenuItem, MenuItemSize } from './types';

interface CartContextValue {
  lines: CartLine[];
  count: number;
  total: number;
  groupMode: boolean;
  setGroupMode: (v: boolean) => void;
  cartOpen: boolean;
  setCartOpen: (v: boolean) => void;
  addItem: (item: MenuItem, qty?: number, notes?: string, size?: MenuItemSize) => void;
  incrementLine: (lineKey: string) => void;
  decrementLine: (lineKey: string) => void;
  setLineNotes: (lineKey: string, notes: string) => void;
  removeLine: (lineKey: string) => void;
  clear: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [groupMode, setGroupMode] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);

  function addItem(item: MenuItem, qty = 1, notes = '', size?: MenuItemSize) {
    const lineKey = size ? `${item.id}::${size.id}` : item.id;
    setLines((prev) => {
      const existing = prev.find((l) => (l.lineKey ?? l.itemId) === lineKey);
      if (existing) {
        return prev.map((l) => ((l.lineKey ?? l.itemId) === lineKey ? { ...l, qty: l.qty + qty } : l));
      }
      return [
        ...prev,
        {
          itemId: item.id,
          lineKey,
          nameAr: item.nameAr,
          nameEn: item.nameEn,
          price: size ? size.price : item.price,
          qty,
          notes,
          sizeId: size?.id,
          sizeLabel: size ? size.label : undefined,
          image: item.image,
        },
      ];
    });
  }

  function incrementLine(lineKey: string) {
    setLines((prev) => prev.map((l) => ((l.lineKey ?? l.itemId) === lineKey ? { ...l, qty: l.qty + 1 } : l)));
  }

  function decrementLine(lineKey: string) {
    setLines((prev) =>
      prev
        .map((l) => ((l.lineKey ?? l.itemId) === lineKey ? { ...l, qty: l.qty - 1 } : l))
        .filter((l) => l.qty > 0)
    );
  }

  function setLineNotes(lineKey: string, notes: string) {
    setLines((prev) => prev.map((l) => ((l.lineKey ?? l.itemId) === lineKey ? { ...l, notes } : l)));
  }

  function removeLine(lineKey: string) {
    setLines((prev) => prev.filter((l) => (l.lineKey ?? l.itemId) !== lineKey));
  }

  function clear() {
    setLines([]);
  }

  const count = useMemo(() => lines.reduce((s, l) => s + l.qty, 0), [lines]);
  const total = useMemo(() => lines.reduce((s, l) => s + l.qty * l.price, 0), [lines]);

  return (
    <CartContext.Provider
      value={{
        lines,
        count,
        total,
        groupMode,
        setGroupMode,
        cartOpen,
        setCartOpen,
        addItem,
        incrementLine,
        decrementLine,
        setLineNotes,
        removeLine,
        clear,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used inside <CartProvider>');
  return ctx;
}
