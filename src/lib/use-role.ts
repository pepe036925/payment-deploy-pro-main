import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export function useIsAdmin() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const check = async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        if (active) { setIsAdmin(false); setLoading(false); }
        return;
      }
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userData.user.id)
        .eq("role", "admin")
        .maybeSingle();
      if (active) {
        setIsAdmin(!error && !!data);
        setLoading(false);
      }
    };
    check();
    const { data: sub } = supabase.auth.onAuthStateChange((e) => {
      if (e === "SIGNED_IN" || e === "SIGNED_OUT") check();
    });
    return () => { active = false; sub.subscription.unsubscribe(); };
  }, []);

  return { isAdmin, loading };
}
