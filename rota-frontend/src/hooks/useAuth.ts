import { useCallback, useEffect, useState } from "react";
import { http } from "../lib/http";

export type User = {
  id: string;
  username: string;
  profile_pic_url?: string | null;
  banner_pic_url?: string | null;
  role: string;
  email: string;
};

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const { data } = await http.get("/me"); 
      setUser(data?.user ?? null);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const logout = useCallback(async () => {
    try {
      await http.post("/auth/logout");
    } finally {
      setUser(null);
    }
  }, []);

  return { user, setUser, loading, refresh, logout };
}
