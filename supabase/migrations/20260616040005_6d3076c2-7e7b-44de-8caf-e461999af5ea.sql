-- Roles
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  creado_en timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_can_read_own_roles" ON public.user_roles
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Trigger: first user becomes admin, rest become user
CREATE OR REPLACE FUNCTION public.assign_default_role()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  total_admins int;
BEGIN
  SELECT count(*) INTO total_admins FROM public.user_roles WHERE role = 'admin';
  IF total_admins = 0 THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin');
  ELSE
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created_assign_role
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.assign_default_role();

-- Backfill: make existing users admin (so the current user has admin access)
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::public.app_role FROM auth.users
ON CONFLICT (user_id, role) DO NOTHING;

-- Promociones table for the public landing page
CREATE TABLE public.promociones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo text NOT NULL,
  descripcion text,
  imagen text,
  descuento int,
  activa boolean NOT NULL DEFAULT true,
  creado_en timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.promociones TO anon, authenticated;
GRANT ALL ON public.promociones TO service_role;

ALTER TABLE public.promociones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "promos_public_read" ON public.promociones
  FOR SELECT TO public USING (activa = true);

CREATE POLICY "promos_admin_all" ON public.promociones
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

INSERT INTO public.promociones (titulo, descripcion, descuento, imagen) VALUES
('2x1 en Pastas', 'Llévate dos pastas Espagueti al precio de una. Solo esta semana.', 50, 'https://images.unsplash.com/photo-1551462147-ff29053bfc14?w=800'),
('Aceite con 20% OFF', 'Aceite Vegetal 1L con descuento especial de temporada.', 20, 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=800'),
('Combo Despensa Básica', 'Arroz + Frijol + Azúcar a un precio increíble.', 15, 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=800');