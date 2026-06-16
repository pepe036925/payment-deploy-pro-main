import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { CartProvider, useCart } from "@/lib/cart";
import { supabase } from "@/integrations/supabase/client";
import { useIsAdmin } from "@/lib/use-role";
import { Toaster } from "@/components/ui/sonner";
import { ShoppingBag, LogOut, Shield } from "lucide-react";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="font-display text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold">Página no encontrada</h2>
        <p className="mt-2 text-sm text-muted-foreground">La ruta que buscas no existe.</p>
        <Link
          to="/"
          className="mt-6 inline-flex rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
        >
          Volver a la tienda
        </Link>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold">Algo salió mal</h1>
        <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
        <button
          onClick={() => { router.invalidate(); reset(); }}
          className="mt-6 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        >
          Reintentar
        </button>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Doña Mago — Tamales y atoles artesanales" },
      { name: "description", content: "Tienda en línea de tamales y atoles artesanales. Pagos con Stripe, PayPal y Mercado Pago." },
      { property: "og:title", content: "Doña Mago — Tamales y atoles artesanales" },
      { property: "og:description", content: "Tienda en línea de tamales y atoles artesanales." },
      { property: "og:type", content: "website" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,700&family=Inter:wght@400;500;600&display=swap" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="es">
      <head><HeadContent /></head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <CartProvider>
        <Shell />
        <Toaster richColors position="top-center" />
      </CartProvider>
    </QueryClientProvider>
  );
}

function Shell() {
  const [email, setEmail] = useState<string | null>(null);
  const { count } = useCart();
  const { isAdmin } = useIsAdmin();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setEmail(data.session?.user.email ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setEmail(s?.user.email ?? null));
    return () => sub.subscription.unsubscribe();
  }, []);

  const logout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-mago text-mago-foreground shadow-warm sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-2 font-display text-2xl font-bold">
            <span className="text-2xl">🛒</span> Doña Mago
          </Link>
          <nav className="flex items-center gap-2 sm:gap-4 text-sm">
            <Link to="/" className="hover:text-accent transition-colors hidden sm:inline">Inicio</Link>
            <Link to="/tienda" className="hover:text-accent transition-colors">Tienda</Link>
            {isAdmin && (
              <Link to="/admin" className="inline-flex items-center gap-1 hover:text-accent transition-colors">
                <Shield className="size-4" /> Admin
              </Link>
            )}
            {email ? (
              <>
                <Link to="/mis-compras" className="hover:text-accent transition-colors hidden sm:inline">Mis compras</Link>
                <Link to="/checkout" className="relative inline-flex items-center gap-1 rounded-md bg-accent text-accent-foreground px-3 py-1.5 font-medium hover:opacity-90">
                  <ShoppingBag className="size-4" />
                  {count > 0 && (
                    <span className="ml-1 rounded-full bg-primary text-primary-foreground text-xs px-1.5 py-0.5">{count}</span>
                  )}
                </Link>
                <button onClick={logout} title="Salir" className="rounded-md p-1.5 hover:bg-white/10">
                  <LogOut className="size-4" />
                </button>
              </>
            ) : (
              <>
                <Link to="/checkout" className="relative inline-flex items-center gap-1 hover:text-accent">
                  <ShoppingBag className="size-4" />
                  {count > 0 && <span className="rounded-full bg-accent text-accent-foreground text-xs px-1.5 py-0.5">{count}</span>}
                </Link>
                <Link to="/auth" className="rounded-md bg-accent text-accent-foreground px-3 py-1.5 font-semibold hover:opacity-90">
                  Iniciar sesión
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-8">
        <Outlet />
      </main>
      <footer className="bg-mago text-mago-foreground/70 text-center py-6 text-sm">
        © 2026 Doña Mago · Tamales y atoles artesanales
      </footer>
    </div>
  );
}
