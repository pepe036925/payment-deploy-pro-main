import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const CheckoutInput = z.object({
  metodo: z.enum(["stripe", "paypal", "mercadopago"]),
  items: z
    .array(z.object({ producto_id: z.string().uuid(), cantidad: z.number().int().min(1).max(50) }))
    .min(1)
    .max(30),
});

function fakeRef(metodo: string) {
  const rnd = Array.from(crypto.getRandomValues(new Uint8Array(8)))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
    .toUpperCase();
  const prefix = metodo === "stripe" ? "pi" : metodo === "paypal" ? "PAY" : "MP";
  return `${prefix}_${rnd}`;
}

export const realizarCompra = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => CheckoutInput.parse(d))
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // 1. Cargar productos reales (precio + stock) desde la BD
    const ids = data.items.map((i) => i.producto_id);
    const { data: productos, error: pErr } = await supabaseAdmin
      .from("productos")
      .select("id, nombre, precio, stock")
      .in("id", ids);
    if (pErr || !productos) throw new Error("No se pudieron cargar los productos");
    if (productos.length !== ids.length) throw new Error("Algún producto no existe");

    // 2. Validar stock + calcular total con precios autoritativos
    let total = 0;
    const renglones: { producto_id: string; cantidad: number; precio_unitario: number }[] = [];
    for (const item of data.items) {
      const p = productos.find((x) => x.id === item.producto_id)!;
      if (p.stock < item.cantidad) throw new Error(`Sin stock suficiente de ${p.nombre}`);
      total += Number(p.precio) * item.cantidad;
      renglones.push({
        producto_id: p.id,
        cantidad: item.cantidad,
        precio_unitario: Number(p.precio),
      });
    }
    total = Math.round(total * 100) / 100;

    // 3. Simular pasarela de pago (sandbox / demo académico)
    const referencia = fakeRef(data.metodo);

    // 4. Crear compra
    const { data: compra, error: cErr } = await supabaseAdmin
      .from("compras")
      .insert({
        usuario_id: userId,
        total,
        metodo_pago: data.metodo,
        referencia_pago: referencia,
        estado: "pagado",
      })
      .select("id")
      .single();
    if (cErr || !compra) throw new Error("No se pudo registrar la compra");

    // 5. Insertar renglones
    const { error: iErr } = await supabaseAdmin
      .from("compra_items")
      .insert(renglones.map((r) => ({ ...r, compra_id: compra.id })));
    if (iErr) throw new Error("No se pudieron registrar los renglones");

    // 6. Descontar stock
    for (const r of renglones) {
      const p = productos.find((x) => x.id === r.producto_id)!;
      await supabaseAdmin
        .from("productos")
        .update({ stock: p.stock - r.cantidad })
        .eq("id", p.id);
    }

    return { compra_id: compra.id, referencia, total, metodo: data.metodo };
  });
