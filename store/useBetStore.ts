import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { createClient } from '@supabase/supabase-js';

/* ================= SUPABASE CONFIG ================= */

const env = import.meta.env;

const supabaseUrl =
  env.VITE_SUPABASE_URL || 'https://invalid-project.supabase.co';

const supabaseAnonKey =
  env.VITE_SUPABASE_ANON_KEY ||
  env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  'invalid-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

/* ================= TYPES ================= */

export type BetStatus =
  | 'pending'
  | 'won'
  | 'lost'
  | 'void'
  | 'half-won'
  | 'half-lost'
  | 'cashout';

export interface Bankroll {
  id: string;
  name: string;
  currency: string;
  initialBalance: number;
}

export interface Bet {
  id: string;
  bankroll_id: string;
  date: string;
  sport: string;
  market: string;
  event: string;
  selection: string;
  odds: number;
  stake: number;
  status: BetStatus;
  profit: number;
  method?: string;
}

export interface BetMethod {
  id: string;
  name: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
}

/* ================= STORE ================= */

interface BetState {
  user: User | null;
  isAuthenticated: boolean;
  bankrolls: Bankroll[];
  activeBankrollId: string;
  history: Bet[];
  methods: BetMethod[];

  setSession: (session: any) => Promise<void>;
  logout: () => Promise<void>;
  addBankroll: (
    name: string,
    currency: string,
    initialBalance: number
  ) => Promise<void>;
  setActiveBankroll: (id: string) => void;
  addBet: (bet: any) => Promise<void>;
  removeBet: (id: string) => Promise<void>;
}

export const useBetStore = create<BetState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      bankrolls: [],
      activeBankrollId: '',
      history: [],
      methods: [],

      /* ================= SESSION ================= */

      setSession: async (session) => {
        if (!session?.user) {
          set({
            user: null,
            isAuthenticated: false,
            bankrolls: [],
            history: [],
            methods: [],
          });
          return;
        }

        const user = {
          id: session.user.id,
          email: session.user.email,
          name:
            session.user.user_metadata?.full_name ||
            session.user.email.split('@')[0],
          avatar: session.user.user_metadata?.avatar_url,
        };

        set({
          user,
          isAuthenticated: true,
        });

        /* ===== LOAD BANKROLLS ===== */

        const { data: bankrollsData } = await supabase
          .from('bankrolls')
          .select('*')
          .eq('user_id', user.id);

        if (bankrollsData) {
          const formatted = bankrollsData.map((b: any) => ({
            id: b.id,
            name: b.name,
            currency: b.currency,
            initialBalance: b.initial_balance,
          }));

          set({
            bankrolls: formatted,
            activeBankrollId: formatted[0]?.id || '',
          });
        }

        /* ===== LOAD BETS ===== */

        const { data: betsData } = await supabase
          .from('bets')
          .select('*')
          .eq('user_id', user.id);

        if (betsData) {
          set({ history: betsData });
        }

        /* ===== LOAD METHODS ===== */

        const { data: methodsData } = await supabase
          .from('methods')
          .select('*')
          .eq('user_id', user.id);

        if (methodsData) {
          set({ methods: methodsData });
        }
      },

      /* ================= LOGOUT ================= */

      logout: async () => {
        await supabase.auth.signOut();
        set({
          user: null,
          isAuthenticated: false,
          bankrolls: [],
          history: [],
          methods: [],
        });
      },

      /* ================= BANKROLL ================= */

      addBankroll: async (name, currency, initialBalance) => {
        const user = get().user;
        if (!user) return;

        const { data, error } = await supabase
          .from('bankrolls')
          .insert([
            {
              name,
              currency,
              initial_balance: initialBalance,
              user_id: user.id,
            },
          ])
          .select()
          .single();

        if (error) {
          console.error(error);
          return;
        }

        const formatted = {
          id: data.id,
          name: data.name,
          currency: data.currency,
          initialBalance: data.initial_balance,
        };

        set((state) => ({
          bankrolls: [...state.bankrolls, formatted],
          activeBankrollId: formatted.id,
        }));
      },

      setActiveBankroll: (id) => {
        set({ activeBankrollId: id });
      },

      /* ================= BETS ================= */

      addBet: async (newBetData) => {
        const user = get().user;
        const activeBankrollId = get().activeBankrollId;

        if (!user) return;
        if (!activeBankrollId) {
          console.warn('Nenhuma banca ativa.');
          return;
        }

        let profit = 0;
        const { status, stake, odds, cashoutValue } = newBetData;

        switch (status) {
          case 'won':
            profit = stake * odds - stake;
            break;
          case 'lost':
            profit = -stake;
            break;
          case 'half-won':
            profit = (stake * odds - stake) / 2;
            break;
          case 'half-lost':
            profit = -stake / 2;
            break;
          case 'cashout':
            profit = (cashoutValue || 0) - stake;
            break;
          default:
            profit = 0;
        }

        const { cashoutValue: _, ...cleanData } = newBetData;

        const { data, error } = await supabase
          .from('bets')
          .insert([
            {
              ...cleanData,
              bankroll_id: activeBankrollId,
              profit,
              user_id: user.id,
            },
          ])
          .select()
          .single();

        if (error) {
          console.error(error);
          return;
        }

        set((state) => ({
          history: [data, ...state.history],
        }));
      },

      removeBet: async (id) => {
        const user = get().user;
        if (!user) return;

        await supabase
          .from('bets')
          .delete()
          .eq('id', id)
          .eq('user_id', user.id);

        set((state) => ({
          history: state.history.filter((b) => b.id !== id),
        }));
      },
    }),
    {
      name: 'bettracker-storage-v5',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
