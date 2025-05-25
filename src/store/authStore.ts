import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

interface User {
  id: string;
  email: string;
  name: string;
}

interface AuthStore {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  initialize: () => Promise<void>;
}

export const useAuthStore = create<AuthStore>()(
  devtools(
    (set, get) => ({
      user: {
        id: 'demo-user-1',
        email: 'demo@example.com',
        name: 'Demo User',
      },
      isAuthenticated: true,
      isLoading: false,

      setUser: (user) => set({ user, isAuthenticated: !!user }),
      setLoading: (isLoading) => set({ isLoading }),

      login: async (email: string, password: string) => {
        set({ isLoading: true });
        
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const user: User = {
          id: 'demo-user-1',
          email,
          name: 'Demo User',
        };
        
        set({ 
          user, 
          isAuthenticated: true, 
          isLoading: false 
        });
      },

      logout: () => {
        set({ 
          user: null, 
          isAuthenticated: false 
        });
      },

      initialize: async () => {
        // Simulate initialization
        set({ isLoading: true });
        await new Promise(resolve => setTimeout(resolve, 500));
        set({ isLoading: false });
      },
    }),
    {
      name: 'auth-store',
    }
  )
);
