import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useIsAdmin } from "@/lib/use-role";
import { DollarSign, ShoppingCart, Package, TrendingUp } from "lucide-react";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin — Doña Mago" }] }),
  component: AdminDashboard,
});

function AdminDashboard() {
  const { isAdmin, loading } = useIsAdmin();

  const { data: compras } = useQuery({
    queryKey: ["admin-compras"],
    enabled: isAdmin,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("compras")
        .select("id, total, metodo_pago, estado, creado_en, usuario_id")
        .order("creado_en", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: productos } = useQuery({
    queryKey: ["admin-productos"],
    enabled: isAdmin,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("productos")
        .select("id, nombre, precio, stock");
      if (error) throw error;
      return data;
    },
  });

  if (loading) return <p className="text-muted-foreground">Verificando permisos…</p>;
  if (!isAdmin) {
    return (
      <div className="max-w-md mx-auto text-center py-16">
        <h1 className="text-2xl font-bold">Acceso restringido</h1>
        <p className="mt-2 text-muted-foreground">Esta sección es solo para administradores.</p>
        <Link to="/" className="mt-6 inline-flex rounded-full bg-primary text-primary-foreground px-5 py-2.5 font-semibold">Volver al inicio</Link>
      </div>
    );
  }

  const totalVentas = compras?.length ?? 0;
  const ganancias = compras?.reduce((s, c) => s + Number(c.total), 0) ?? 0;
  const pagadas = compras?.filter((c) => c.estado === "pagado").length ?? 0;
  const bajoStock = productos?.filter((p) => p.stock < 10).length ?? 0;

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold">Panel de administración</h1>
        <p className="text-muted-foreground mt-1">Resumen de ventas, ganancias e inventario.</p>
      </header>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat icon={<DollarSign className="size-5" />} label="Ganancias totales" value={`$${ganancias.toFixed(2)}`} />
        <Stat icon={<ShoppingCart className="size-5" />} label="Ventas totales" value={String(totalVentas)} />
        <Stat icon={<TrendingUp className="size-5" />} label="Pagadas" value={String(pagadas)} />
        <Stat icon={<Package className="size-5" />} label="Productos con stock bajo" value={String(bajoStock)} />
      </div>

      <section className="bg-card border border-border rounded-2xl p-6 shadow-warm">
        <h2 className="text-xl font-bold mb-4">Compras recientes</h2>
        {compras?.length === 0 && <p className="text-muted-foreground">Aún no hay compras registradas.</p>}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th className="py-2 pr-4">Fecha</th>
                <th className="py-2 pr-4">Usuario</th>
                <th className="py-2 pr-4">Método</th>
                <th className="py-2 pr-4">Estado</th>
                <th className="py-2 pr-4 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {compras?.map((c) => (
                <tr key={c.id}>
                  <td className="py-2 pr-4">{new Date(c.creado_en).toLocaleString("es-MX")}</td>
                  <td className="py-2 pr-4 font-mono text-xs">{c.usuario_id.slice(0, 8)}…</td>
                  <td className="py-2 pr-4 capitalize">{c.metodo_pago.replace("_", " ")}</td>
                  <td className="py-2 pr-4">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      c.estado === "pagado" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                    }`}>{c.estado}</span>
                  </td>
                  <td className="py-2 pr-4 text-right font-semibold">${Number(c.total).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="bg-card border border-border rounded-2xl p-6 shadow-warm">
        <h2 className="text-xl font-bold mb-4">Inventario</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th className="py-2 pr-4">Producto</th>
                <th className="py-2 pr-4 text-right">Precio</th>
                <th className="py-2 pr-4 text-right">Stock</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {productos?.map((p) => (
                <tr key={p.id}>
                  <td className="py-2 pr-4 font-medium">{p.nombre}</td>
                  <td className="py-2 pr-4 text-right">${Number(p.precio).toFixed(2)}</td>
                  <td className={`py-2 pr-4 text-right font-semibold ${p.stock < 10 ? "text-destructive" : ""}`}>{p.stock}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function Stat({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="bg-card border border-border rounded-2xl p-5 shadow-warm">
      <div className="flex items-center gap-2 text-muted-foreground text-sm">{icon}{label}</div>
      <p className="mt-2 text-3xl font-bold text-primary">{value}</p>
    </div>
  );
}
