'use client';
import { createContext, useContext, useEffect, useState, useCallback } from 'react';

const Ctx = createContext(null);

export function CartProvider({ children }) {
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('salon_cart');
      if (raw) setItems(JSON.parse(raw));
    } catch {}
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    try { localStorage.setItem('salon_cart', JSON.stringify(items)); } catch {}
  }, [items, loaded]);

  const add = useCallback((product, qty = 1) => {
    setItems((prev) => {
      const found = prev.find((i) => i.id === product.id);
      if (found) return prev.map((i) => (i.id === product.id ? { ...i, qty: Math.min(i.qty + qty, 99) } : i));
      return [...prev, {
        id: product.id, slug: product.slug, nameAr: product.nameAr, nameEn: product.nameEn,
        price: product.price, image: product.image, qty,
      }];
    });
    setOpen(true);
  }, []);

  const setQty = useCallback((id, qty) => {
    setItems((prev) => qty <= 0 ? prev.filter((i) => i.id !== id) : prev.map((i) => (i.id === id ? { ...i, qty } : i)));
  }, []);

  const remove = useCallback((id) => setItems((prev) => prev.filter((i) => i.id !== id)), []);
  const clear = useCallback(() => setItems([]), []);

  const count = items.reduce((s, i) => s + i.qty, 0);
  const subtotal = items.reduce((s, i) => s + i.qty * i.price, 0);

  return (
    <Ctx.Provider value={{ items, add, setQty, remove, clear, count, subtotal, open, setOpen, loaded }}>
      {children}
    </Ctx.Provider>
  );
}

export function useCart() {
  const c = useContext(Ctx);
  if (!c) return { items: [], add: () => {}, setQty: () => {}, remove: () => {}, clear: () => {}, count: 0, subtotal: 0, open: false, setOpen: () => {}, loaded: false };
  return c;
}
