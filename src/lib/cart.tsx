import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type CartItem = {
  id: string;
  nombre: string;
  precio: number;
  imagen: string | null;
  cantidad: number;
};

type CartCtx = {
  items: CartItem[];
  add: (p: Omit<CartItem, "cantidad">) => void;
  remove: (id: string) => void;
  setQty: (id: string, q: number) => void;
  clear: () => void;
  total: number;
  count: number;
};

const Ctx = createContext<CartCtx | null>(null);
const KEY = "dona_mago_cart_v1";

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setItems(JSON.parse(raw));
    } catch {}
  }, []);

  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(items)); } catch {}
  }, [items]);

  const add: CartCtx["add"] = (p) =>
    setItems((cur) => {
      const ex = cur.find((i) => i.id === p.id);
      if (ex) return cur.map((i) => (i.id === p.id ? { ...i, cantidad: i.cantidad + 1 } : i));
      return [...cur, { ...p, cantidad: 1 }];
    });
  const remove: CartCtx["remove"] = (id) => setItems((c) => c.filter((i) => i.id !== id));
  const setQty: CartCtx["setQty"] = (id, q) =>
    setItems((c) => c.map((i) => (i.id === id ? { ...i, cantidad: Math.max(1, q) } : i)));
  const clear = () => setItems([]);
  const total = items.reduce((s, i) => s + i.precio * i.cantidad, 0);
  const count = items.reduce((s, i) => s + i.cantidad, 0);

  return <Ctx.Provider value={{ items, add, remove, setQty, clear, total, count }}>{children}</Ctx.Provider>;
}

export function useCart() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useCart must be used inside CartProvider");
  return v;
}
