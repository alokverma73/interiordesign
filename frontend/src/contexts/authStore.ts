import { create } from "zustand";

export interface AuthUser {
  id: string;
  email: string;
  full_name: string;
  user_type: "CUSTOMER" | "STAFF";
  role?: string | null;
  avatar_url?: string | null;
}

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  user: AuthUser | null;
  setTokens: (accessToken: string, refreshToken: string) => void;
  setUser: (user: AuthUser) => void;
  logout: () => void;
}

const STORAGE_KEY = "aetherlume_auth";

function loadInitial() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    /* ignore corrupt storage */
  }
  return { accessToken: null, refreshToken: null, user: null };
}

function persist(state: Pick<AuthState, "accessToken" | "refreshToken" | "user">) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

const initial = loadInitial();

export const useAuthStore = create<AuthState>((set, get) => ({
  accessToken: initial.accessToken,
  refreshToken: initial.refreshToken,
  user: initial.user,

  setTokens: (accessToken, refreshToken) => {
    set({ accessToken, refreshToken });
    persist({ accessToken, refreshToken, user: get().user });
  },

  setUser: (user) => {
    set({ user });
    persist({ accessToken: get().accessToken, refreshToken: get().refreshToken, user });
  },

  logout: () => {
    set({ accessToken: null, refreshToken: null, user: null });
    localStorage.removeItem(STORAGE_KEY);
  },
}));
