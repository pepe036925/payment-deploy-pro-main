import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Iniciar sesión — Doña Mago" },
      { name: "description", content: "Accede a tu cuenta de Doña Mago para realizar pedidos." },
    ],
  }),
  component: Auth,
});

function Auth() {
  const [tab, setTab] = useState<"login" | "registro">("login");
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const nav = useNavigate();

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (tab === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("¡Bienvenido!");
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { nombre },
            emailRedirectTo: `${window.location.origin}/`,
          },
        });
        if (error) throw error;
        toast.success("Cuenta creada. ¡Listo para comprar!");
      }
      nav({ to: "/" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error de autenticación");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-card border border-border rounded-2xl p-8 shadow-warm">
      <div className="flex bg-muted rounded-full p-1 mb-6">
        <button
          onClick={() => setTab("login")}
          className={`flex-1 py-2 rounded-full font-medium text-sm transition ${tab === "login" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
        >
          Iniciar sesión
        </button>
        <button
          onClick={() => setTab("registro")}
          className={`flex-1 py-2 rounded-full font-medium text-sm transition ${tab === "registro" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
        >
          Registrarse
        </button>
      </div>

      <form onSubmit={submit} className="space-y-4">
        {tab === "registro" && (
          <div>
            <label className="text-sm font-medium">Nombre</label>
            <input
              required
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
            />
          </div>
        )}
        <div>
          <label className="text-sm font-medium">Correo</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="text-sm font-medium">Contraseña</label>
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
          />
        </div>
        <button
          disabled={loading}
          className="w-full rounded-full bg-primary text-primary-foreground font-semibold py-2.5 hover:opacity-90 disabled:opacity-50"
        >
          {loading ? "Procesando…" : tab === "login" ? "Entrar" : "Crear cuenta"}
        </button>
      </form>
    </div>
  );
}
