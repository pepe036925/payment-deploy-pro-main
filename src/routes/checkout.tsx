import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { useCart } from "@/lib/cart";
import { realizarCompra } from "@/lib/checkout.functions";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Trash2, Minus, Plus, CreditCard } from "lucide-react";

export const Route = createFileRoute("/checkout")({
  head: () => ({
    meta: [
      { title: "Checkout — Doña Mago" },
      { name: "description", content: "Finaliza tu compra con Stripe, PayPal o Mercado Pago." },
    ],
  }),
  component: Checkout,
});

type Metodo = "stripe" | "paypal" | "mercadopago";

const METODOS: { id: Metodo; nombre: string; tag: string; color: string }[] = [
  { id: "stripe", nombre: "Stripe", tag: "Tarjeta de crédito/débito", color: "from-indigo-500 to-violet-600" },
  { id: "paypal", nombre: "PayPal", tag: "Cuenta PayPal", color: "from-sky-500 to-blue-700" },
  { id: "mercadopago", nombre: "Mercado Pago", tag: "Mercado Pago / OXXO", color: "from-cyan-400 to-sky-600" },
];

function Checkout() {
  const { items, setQty, remove, total, clear } = useCart();
  const [metodo, setMetodo] = useState<Metodo>("stripe");
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const nav = useNavigate();
  const compraFn = useServerFn(realizarCompra);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setAuthed(!!data.session));
  }, []);

  const pagar = async () => {
    if (!authed) { nav({ to: "/auth" }); return; }
    if (items.length === 0) return;
    setLoading(true);
    try {
      const res = await compraFn({
        data: {
          metodo,
          items: items.map((i) => ({ producto_id: i.id, cantidad: i.cantidad })),
        },
      });
      toast.success(`Pago aprobado · ${res.referencia}`);
      clear();
      nav({ to: "/mis-compras" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo procesar el pago");
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="text-center py-20">
        <h1 className="text-3xl font-bold">Tu carrito está vacío</h1>
        <p className="text-muted-foreground mt-2">Agrega productos del catálogo para continuar.</p>
        <Link to="/" className="mt-6 inline-flex rounded-full bg-primary text-primary-foreground px-6 py-3 font-semibold">
          Ir a la tienda
        </Link>
      </div>
    );
  }

  return (
    <div className="grid lg:grid-cols-[1fr_380px] gap-8">
      <section>
        <h1 className="text-3xl font-bold mb-6">Tu carrito</h1>
        <div className="space-y-3">
          {items.map((i) => (
            <div key={i.id} className="flex items-center gap-4 bg-card border border-border rounded-xl p-3">
              {i.imagen && <img src={i.imagen} alt={i.nombre} className="size-20 rounded-lg object-cover" />}
              <div className="flex-1">
                <p className="font-semibold">{i.nombre}</p>
                <p className="text-sm text-muted-foreground">${i.precio.toFixed(2)} c/u</p>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => setQty(i.id, i.cantidad - 1)} className="rounded-md p-1.5 hover:bg-muted"><Minus className="size-4" /></button>
                <span className="w-8 text-center font-semibold">{i.cantidad}</span>
                <button onClick={() => setQty(i.id, i.cantidad + 1)} className="rounded-md p-1.5 hover:bg-muted"><Plus className="size-4" /></button>
              </div>
              <div className="w-20 text-right font-display font-bold">${(i.precio * i.cantidad).toFixed(2)}</div>
              <button onClick={() => remove(i.id)} className="text-muted-foreground hover:text-destructive p-1.5"><Trash2 className="size-4" /></button>
            </div>
          ))}
        </div>

        <h2 className="text-2xl font-bold mt-10 mb-4">Método de pago</h2>
        <div className="grid sm:grid-cols-3 gap-3">
          {METODOS.map((m) => (
            <button
              key={m.id}
              onClick={() => setMetodo(m.id)}
              className={`text-left rounded-xl border-2 p-4 transition ${metodo === m.id ? "border-primary bg-primary/5" : "border-border bg-card hover:border-primary/40"}`}
            >
              <div className={`h-10 rounded-md bg-gradient-to-br ${m.color} mb-3 flex items-center justify-center text-white font-bold`}>
                {m.nombre}
              </div>
              <p className="text-sm font-semibold">{m.nombre}</p>
              <p className="text-xs text-muted-foreground">{m.tag}</p>
            </button>
          ))}
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          * Para pagos con tarjeta selecciona Stripe. Las pasarelas se ejecutan en modo sandbox/demo. Las claves reales se configuran como variables de entorno (STRIPE_SK, PAYPAL_ID, MP_AT).
        </p>
      </section>

      <aside className="lg:sticky lg:top-24 h-fit">
        <div className="bg-card border border-border rounded-2xl p-6 shadow-warm">
          <h3 className="font-bold text-lg">Resumen</h3>
          <div className="flex justify-between mt-4 text-sm">
            <span className="text-muted-foreground">Subtotal</span>
            <span>${total.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Envío</span>
            <span className="text-accent font-medium">Gratis</span>
          </div>
          <div className="border-t border-border my-4" />
          <div className="flex justify-between items-baseline">
            <span className="font-bold">Total</span>
            <span className="font-display text-3xl font-bold text-primary">${total.toFixed(2)}</span>
          </div>
          <button
            onClick={pagar}
            disabled={loading || authed === null}
            className="mt-6 w-full inline-flex items-center justify-center gap-2 rounded-full bg-primary text-primary-foreground font-semibold py-3 hover:opacity-90 disabled:opacity-50"
          >
            <CreditCard className="size-4" />
            {loading ? "Procesando…" : authed ? `Pagar con ${METODOS.find((m) => m.id === metodo)!.nombre}` : "Inicia sesión para pagar"}
          </button>
        </div>
      </aside>
    </div>
  );
}
