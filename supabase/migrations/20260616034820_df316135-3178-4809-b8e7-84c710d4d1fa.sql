
CREATE TYPE public.metodo_pago AS ENUM ('stripe','paypal','mercadopago');
CREATE TYPE public.estado_pago AS ENUM ('pendiente','pagado','fallido');

CREATE TABLE public.productos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre text NOT NULL,
  descripcion text,
  precio numeric(10,2) NOT NULL CHECK (precio >= 0),
  stock int NOT NULL DEFAULT 0 CHECK (stock >= 0),
  imagen text,
  creado_en timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.productos TO anon, authenticated;
GRANT ALL ON public.productos TO service_role;
ALTER TABLE public.productos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "productos_public_read" ON public.productos FOR SELECT USING (true);

CREATE TABLE public.compras (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  total numeric(10,2) NOT NULL,
  metodo_pago public.metodo_pago NOT NULL,
  referencia_pago text,
  estado public.estado_pago NOT NULL DEFAULT 'pendiente',
  creado_en timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.compras TO authenticated;
GRANT ALL ON public.compras TO service_role;
ALTER TABLE public.compras ENABLE ROW LEVEL SECURITY;
CREATE POLICY "compras_owner_select" ON public.compras FOR SELECT TO authenticated USING (auth.uid() = usuario_id);
CREATE POLICY "compras_owner_insert" ON public.compras FOR INSERT TO authenticated WITH CHECK (auth.uid() = usuario_id);

CREATE TABLE public.compra_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  compra_id uuid NOT NULL REFERENCES public.compras(id) ON DELETE CASCADE,
  producto_id uuid NOT NULL REFERENCES public.productos(id),
  cantidad int NOT NULL CHECK (cantidad > 0),
  precio_unitario numeric(10,2) NOT NULL
);
GRANT SELECT, INSERT ON public.compra_items TO authenticated;
GRANT ALL ON public.compra_items TO service_role;
ALTER TABLE public.compra_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "items_owner_select" ON public.compra_items FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.compras c WHERE c.id = compra_id AND c.usuario_id = auth.uid()));
CREATE POLICY "items_owner_insert" ON public.compra_items FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.compras c WHERE c.id = compra_id AND c.usuario_id = auth.uid()));

INSERT INTO public.productos (nombre, descripcion, precio, stock, imagen) VALUES
('Tamal Verde', 'Tamal artesanal de salsa verde con pollo', 25.00, 50, 'https://images.unsplash.com/photo-1604467794349-0b74285de7e7?w=600'),
('Tamal Rojo', 'Tamal de salsa roja con cerdo', 25.00, 50, 'https://images.unsplash.com/photo-1625944525533-473f1b3d54e7?w=600'),
('Tamal Dulce', 'Tamal de piña con pasas', 22.00, 40, 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=600'),
('Tamal de Mole', 'Tamal de mole poblano con pollo y salsa especial', 28.00, 45, 'https://images.unsplash.com/photo-1598176819563-df490a4601d1?w=600'),
('Tamal de Rajas', 'Tamal de rajas con queso y salsa verde', 26.00, 40, 'https://images.unsplash.com/photo-1598514983100-5f8bd9478b32?w=600'),
('Tamal Vegetariano', 'Tamal con champiñones, espinacas y queso Oaxaca', 24.00, 35, 'https://images.unsplash.com/photo-1608753750254-427d49d6f745?w=600'),
('Atole de Champurrado', 'Bebida tradicional de maíz y chocolate (500ml)', 30.00, 30, 'https://images.unsplash.com/photo-1542990253-a781e04c0082?w=600'),
('Atole de Fresa', 'Atole artesanal sabor fresa (500ml)', 28.00, 30, 'https://images.unsplash.com/photo-1517256673644-36ad11246d21?w=600'),
('Atole de Vainilla', 'Atole de vainilla natural (500ml)', 28.00, 30, 'https://images.unsplash.com/photo-1532339142462-f361905be828?w=600'),
('Combo Familiar', '6 tamales + 1 litro de atole', 180.00, 20, 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=600'),
('Mini Combo', '3 tamales surtidos + atole de cajeta', 95.00, 25, 'https://images.unsplash.com/photo-1551218808-94e220e084d2?w=600');
