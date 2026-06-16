import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/mis-compras")({
  head: () => ({
    meta: [
      { title: "Mis compras — Doña Mago" },
      { name: "description", content: "Historial de tus pedidos en Doña Mago." },
    ],
  }),
  component: MisCompras,
});

function MisCompras() {
  const [ready, setReady] = useState(false);
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setAuthed(!!data.session);
      setReady(true);
    });
  }, []);

  const { data, isLoading } = useQuery({
    enabled: ready && authed,
    queryKey: ["mis-compras"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("compras")
        .select("id, total, metodo_pago, referencia_pago, estado, creado_en, compra_items(cantidad, precio_unitario, productos(nombre, imagen))")
        .order("creado_en", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  if (ready && !authed) {
    return (
      <div className="text-center py-20">
        <h1 className="text-2xl font-bold">Inicia sesión para ver tus compras</h1>
        <Link to="/auth" className="mt-6 inline-flex rounded-full bg-primary text-primary-foreground px-6 py-3 font-semibold">
          Iniciar sesión
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Mis compras</h1>
      {isLoading && <p className="text-muted-foreground">Cargando historial…</p>}
      {data && data.length === 0 && (
        <p className="text-muted-foreground">Aún no tienes pedidos. <Link to="/" className="text-primary underline">Explora la tienda</Link>.</p>
      )}
      <div className="space-y-4">
        {data?.map((c) => (
          <article key={c.id} className="bg-card border border-border rounded-2xl p-5 shadow-warm">
            <header className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <div>
                <p className="font-mono text-xs text-muted-foreground">#{c.id.slice(0, 8)} · {new Date(c.creado_en).toLocaleString("es-MX")}</p>
                <p className="text-sm mt-1">
                  <span className="inline-block px-2 py-0.5 rounded-full bg-accent/30 text-accent-foreground text-xs font-semibold uppercase mr-2">{c.metodo_pago}</span>
                  <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold uppercase ${c.estado === "pagado" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}`}>{c.estado}</span>
                  {c.referencia_pago && <span className="ml-2 text-muted-foreground font-mono text-xs">{c.referencia_pago}</span>}
                </p>
              </div>
              <p className="font-display text-2xl font-bold text-primary">${Number(c.total).toFixed(2)}</p>
            </header>
            <ul className="divide-y divide-border">
              {c.compra_items?.map((it, i) => (
                <li key={i} className="py-2 flex items-center gap-3 text-sm">
                  {it.productos?.imagen && <img src={it.productos.imagen} alt="" className="size-10 rounded object-cover" />}
                  <span className="flex-1">{it.productos?.nombre}</span>
                  <span className="text-muted-foreground">x{it.cantidad}</span>
                  <span className="w-20 text-right font-medium">${(Number(it.precio_unitario) * it.cantidad).toFixed(2)}</span>
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </div>
  );
}
