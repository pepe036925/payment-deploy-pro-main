import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ShoppingBag, Sparkles, Tag } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Doña Mago — Abarrotes con promos de barrio" },
      { name: "description", content: "Conoce las promociones de la semana en abarrotes. Pagos con Stripe, PayPal y Mercado Pago." },
    ],
  }),
  component: Inicio,
});

function Inicio() {
  const { data: promos, isLoading } = useQuery({
    queryKey: ["promociones"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("promociones")
        .select("id, titulo, descripcion, imagen, descuento")
        .eq("activa", true)
        .order("creado_en", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="space-y-12">
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-mago via-mago to-primary text-mago-foreground p-8 sm:p-14">
        <div className="max-w-2xl">
          <p className="text-accent font-medium uppercase tracking-widest text-xs flex items-center gap-2">
            <Sparkles className="size-4" /> Promos de la semana
          </p>
          <h1 className="mt-3 text-4xl sm:text-5xl font-bold leading-tight">
            Abarrotes con <span className="text-accent">precios de barrio.</span>
          </h1>
          <p className="mt-4 text-mago-foreground/80 max-w-lg">
            Descubre las ofertas frescas de la semana y arma tu despensa pagando con Stripe, PayPal o Mercado Pago.
          </p>
          <Link
            to="/tienda"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-accent text-accent-foreground px-6 py-3 font-semibold hover:opacity-90"
          >
            <ShoppingBag className="size-4" /> Ir a la tienda
          </Link>
        </div>
      </section>

      <section>
        <div className="flex items-end justify-between mb-6">
          <h2 className="text-2xl font-bold">🔥 Ofertas activas</h2>
          <Link to="/tienda" className="text-sm text-primary hover:underline">Ver catálogo →</Link>
        </div>
        {isLoading && <p className="text-muted-foreground">Cargando promociones…</p>}
        {!isLoading && promos?.length === 0 && (
          <p className="text-muted-foreground">No hay promociones activas por ahora.</p>
        )}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {promos?.map((promo) => (
            <article key={promo.id} className="bg-card rounded-2xl overflow-hidden shadow-warm border border-border flex flex-col">
              {promo.imagen && (
                <div className="aspect-[4/3] bg-muted overflow-hidden relative">
                  <img src={promo.imagen} alt={promo.titulo} loading="lazy" className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
                  {promo.descuento ? (
                    <span className="absolute top-3 right-3 bg-accent text-accent-foreground font-bold rounded-full px-3 py-1 text-sm shadow-warm">
                      -{promo.descuento}%
                    </span>
                  ) : null}
                </div>
              )}
              <div className="p-5 flex flex-col flex-1">
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <Tag className="size-4 text-primary" /> {promo.titulo}
                </h3>
                <p className="text-sm text-muted-foreground mt-2 flex-1">{promo.descripcion}</p>
                <Link
                  to="/tienda"
                  className="mt-4 inline-flex items-center justify-center gap-2 rounded-full bg-primary text-primary-foreground py-2.5 font-semibold hover:opacity-90"
                >
                  Aprovechar promo
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
