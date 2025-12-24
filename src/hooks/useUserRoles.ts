import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

interface UserRoles {
  isAdmin: boolean;
  isDiscipulador: boolean;
  isSuperAdmin: boolean;
  isLiderMinisterial: boolean;
  isLoading: boolean;
  userId: string | null;
  roles: string[];
}

// Global cache for roles
let cachedRoles: Omit<UserRoles, "isLoading"> | null = null;

export function useUserRoles(): UserRoles {
  const [state, setState] = useState<UserRoles>({
    isAdmin: cachedRoles?.isAdmin ?? false,
    isDiscipulador: cachedRoles?.isDiscipulador ?? false,
    isSuperAdmin: cachedRoles?.isSuperAdmin ?? false,
    isLiderMinisterial: cachedRoles?.isLiderMinisterial ?? false,
    isLoading: !cachedRoles,
    userId: cachedRoles?.userId ?? null,
    roles: cachedRoles?.roles ?? [],
  });

  const fetchRoles = useCallback(async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      setState({
        isAdmin: false,
        isDiscipulador: false,
        isSuperAdmin: false,
        isLiderMinisterial: false,
        isLoading: false,
        userId: null,
        roles: [],
      });
      cachedRoles = null;
      return;
    }

    // Use cached if same user
    if (cachedRoles?.userId === session.user.id) {
      setState({ ...cachedRoles, isLoading: false });
      return;
    }

    const { data: rolesData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", session.user.id);

    const userRoles = rolesData?.map((r) => r.role) || [];

    const newState = {
      isAdmin: userRoles.includes("admin"),
      isDiscipulador: userRoles.includes("discipulador"),
      isSuperAdmin: userRoles.includes("super_admin"),
      isLiderMinisterial: userRoles.includes("lider_ministerial"),
      isLoading: false,
      userId: session.user.id,
      roles: userRoles,
    };

    cachedRoles = newState;
    setState(newState);
  }, []);

  useEffect(() => {
    fetchRoles();

    // Subscribe to auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      cachedRoles = null;
      fetchRoles();
    });

    return () => subscription.unsubscribe();
  }, [fetchRoles]);

  return state;
}

// Helper to clear cache (useful for logout)
export function clearRolesCache() {
  cachedRoles = null;
}
