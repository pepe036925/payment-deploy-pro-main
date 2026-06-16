import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/lib/cart";
import { toast } from "sonner";
import { Plus, ShoppingBag } from "lucide-react";

export const Route = createFileRoute("/tienda")({
  head: () => ({
    meta: [
      { title: "Tienda — Doña Mago" },
      { name: "description", content: "Catálogo de abarrotes: arroz, frijol, aceite y más, con pago seguro." },
    ],
  }),
  component: Tienda,
});

function Tienda() {
  const { add } = useCart();
  const { data: productos, isLoading } = useQuery({
    queryKey: ["productos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("productos")
        .select("id, nombre, descripcion, precio, stock, imagen")
        .order("creado_en", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="space-y-8">
      <header className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold">Catálogo de abarrotes</h1>
          <p className="text-muted-foreground mt-1">Agrega productos al carrito y paga con Stripe, PayPal o Mercado Pago.</p>
        </div>
        <Link to="/checkout" className="inline-flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-5 py-2.5 font-semibold hover:opacity-90">
          <ShoppingBag className="size-4" /> Ir al carrito
        </Link>
      </header>

      {isLoading && <p className="text-muted-foreground">Cargando productos…</p>}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {productos?.map((p) => {
          const agotado = p.stock < 1;
          return (
            <article key={p.id} className="bg-card rounded-2xl overflow-hidden shadow-warm border border-border flex flex-col">
              {p.imagen && (
                <div className="aspect-[4/3] bg-muted overflow-hidden relative">
                  <img src={p.imagen} alt={p.nombre} loading="lazy" className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
                  {agotado && (
                    <span className="absolute top-3 left-3 bg-destructive text-destructive-foreground text-xs font-bold rounded-full px-3 py-1">Agotado</span>
                  )}
                </div>
              )}
              <div className="p-5 flex flex-col flex-1">
                <h3 className="text-lg font-bold">{p.nombre}</h3>
                <p className="text-sm text-muted-foreground mt-1 flex-1">{p.descripcion}</p>
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-2xl font-display font-bold text-primary">${Number(p.precio).toFixed(2)}</span>
                  <span className={`text-xs font-medium ${agotado ? "text-destructive" : "text-muted-foreground"}`}>
                    {agotado ? "Sin stock" : `${p.stock} disponibles`}
                  </span>
                </div>
                <button
                  disabled={agotado}
                  onClick={() => {
                    add({ id: p.id, nombre: p.nombre, precio: Number(p.precio), imagen: p.imagen });
                    toast.success(`${p.nombre} agregado al carrito`);
                  }}
                  className="mt-4 inline-flex items-center justify-center gap-2 rounded-full bg-primary text-primary-foreground py-2.5 font-semibold hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Plus className="size-4" /> {agotado ? "Sin stock" : "Agregar al carrito"}
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
