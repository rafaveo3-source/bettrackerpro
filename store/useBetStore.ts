import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { createClient } from '@supabase/supabase-js';

/* ================= SUPABASE ================= */

const env = import.meta.env;

const supabaseUrl =
  env.VITE_SUPABASE_URL || 'https://invalid-project.supabase.co';

const supabaseAnonKey =
  env.VITE_SUPABASE_ANON_KEY ||
  env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  'invalid-key';

export const isSupabaseConfigured =
  supabaseUrl.startsWith('https://') &&
  supabaseUrl.includes('.supabase.co') &&
  supabaseAnonKey.length > 20;

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

export type TransactionType = 'deposit' | 'withdrawal';
export type MoodType = 'confident' | 'disciplined' | 'anxious' | 'tilted';

export interface BetMethod {
  id: string;
  name: string;
}

export interface Bankroll {
  id: string;
  name: string;
  currency: string;
  initialBalance: number;
}

export interface Goal {
  id: string;
  bankroll_id: string;
  title: string;
  category: string;
  target: number;
  current: number;
  type: 'monthly' | 'daily' | 'weekly' | 'custom';
  deadline: string;
  createdAt: string;
  status: 'active' | 'completed' | 'abandoned';
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

export interface Transaction {
  id: string;
  bankrollId: string;
  date: string;
  type: TransactionType;
  amount: number;
  description: string;
}

export interface MindsetEntry {
  id: string;
  date: string;
  time: string;
  mood: MoodType;
  note: string;
  tags: string[];
}

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
}

/* ================= STATE ================= */

interface BetState {
  user: User | null;
  isAuthenticated: boolean;
  isDarkMode: boolean;
  primaryColor: string;
  currency: string;
  bankrolls: Bankroll[];
  activeBankrollId: string;
  currentBankrollBalance: number;
  history: Bet[];
  transactions: Transaction[];
  methods: BetMethod[];
  mindsetHistory: MindsetEntry[];
  goals: Goal[];
  tiltLockUntil: string | null;

  setSession: (session: any) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<User>) => void;
  toggleTheme: () => void;
  setPrimaryColor: (color: string) => void;
  setCurrency: (currency: string) => void;
  addBankroll: (name: string, currency: string, initialBalance: number) => Promise<void>;
  removeBankroll: (id: string) => Promise<void>;
  setActiveBankroll: (id: string) => void;
  addBet: (bet: Omit<Bet, 'id' | 'profit'> & { cashoutValue?: number }) => Promise<void>;
  updateBet: (id: string, data: Partial<Bet> & { cashoutValue?: number }) => Promise<void>;
  removeBet: (id: string) => Promise<void>;
  addTransaction: (transaction: Omit<Transaction, 'id' | 'bankrollId'>) => void;
  removeTransaction: (id: string) => void;
  addMethod: (name: string) => Promise<void>;
  removeMethod: (id: string) => void;
  addMindsetEntry: (entry: Omit<MindsetEntry, 'id'>) => void;
  addGoal: (goal: Omit<Goal, 'id' | 'createdAt' | 'current' | 'status'>) => void;
  updateGoal: (id: string, data: Partial<Goal>) => void;
  deleteGoal: (id: string) => void;
  activateTiltLock: (hours: number) => void;
  resetData: () => void;
  recalculateBankroll: () => void;
  getMetrics: () => any;
  isTiltLocked: () => boolean;
}

/* ================= STORE ================= */

export const useBetStore = create<BetState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isDarkMode: true,
      primaryColor: 'gold',
      currency: 'BRL',
      bankrolls: [],
      activeBankrollId: '',
      currentBankrollBalance: 0,
      history: [],
      transactions: [],
      methods: [],
      mindsetHistory: [],
      goals: [],
      tiltLockUntil: null,

      /* ================= SESSION ================= */

      setSession: async (session) => {
        if (!session?.user) {
          set({
            isAuthenticated: false,
            user: null,
            history: [],
          });
          return;
        }

        const user = {
          id: session.user.id,
          email: session.user.email,
          name:
            session.user.user_metadata?.full_name ||
            session.user.email?.split('@')[0] ||
            'Usuário',
          avatar: session.user.user_metadata?.avatar_url,
        };

        set({ isAuthenticated: true, user });

        /* LOAD BETS */
        const { data: bets } = await supabase
          .from('bets')
          .select('*')
          .eq('user_id', user.id);

        if (bets) set({ history: bets });

        /* LOAD METHODS */
        const { data: methods } = await supabase
          .from('methods')
          .select('*')
          .eq('user_id', user.id);

        if (methods) set({ methods });

        /* LOAD BANKROLLS */
        const { data: bankrolls } = await supabase
          .from('bankrolls')
          .select('*')
          .eq('user_id', user.id);

        if (bankrolls) {
          const formatted = bankrolls.map((b: any) => ({
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
      },

      logout: async () => {
        await supabase.auth.signOut();
        set({ isAuthenticated: false, user: null });
        localStorage.removeItem('bettracker-storage-v5');
      },

      updateProfile: (data) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...data } : null,
        })),

      toggleTheme: () =>
        set((state) => ({ isDarkMode: !state.isDarkMode })),

      setPrimaryColor: (color) => set({ primaryColor: color }),
      setCurrency: (currency) => set({ currency }),

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

        get().recalculateBankroll();
      },

      removeBankroll: async (id) => {
        const user = get().user;
        if (!user) return;

        await supabase
          .from('bankrolls')
          .delete()
          .eq('id', id)
          .eq('user_id', user.id);

        set((state) => ({
          bankrolls: state.bankrolls.filter((b) => b.id !== id),
        }));
      },

      setActiveBankroll: (id) => {
        set({ activeBankrollId: id });
        get().recalculateBankroll();
      },

      /* ================= BET ================= */

      addBet: async (newBetData) => {
        const user = get().user;
        const activeBankrollId = get().activeBankrollId;

        if (!user || !activeBankrollId) return;

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

        const { cashoutValue: _, ...clean } = newBetData;

        const { data, error } = await supabase
          .from('bets')
          .insert([
            {
              ...clean,
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

        get().recalculateBankroll();
      },

      updateBet: async () => {},
      removeBet: async () => {},

      addTransaction: () => {},
      removeTransaction: () => {},

      addMethod: async (name) => {
        const user = get().user;
        if (!user) return;

        const { data, error } = await supabase
          .from('methods')
          .insert([{ name, user_id: user.id }])
          .select()
          .single();

        if (error) {
          console.error(error);
          return;
        }

        set((state) => ({
          methods: [data, ...state.methods],
        }));
      },

      removeMethod: (id) =>
        set((state) => ({
          methods: state.methods.filter((m) => m.id !== id),
        })),

      addMindsetEntry: () => {},
      addGoal: () => {},
      updateGoal: () => {},
      deleteGoal: () => {},

      activateTiltLock: () => {},
      isTiltLocked: () => false,

      resetData: () =>
        set({
          bankrolls: [],
          history: [],
        }),

      recalculateBankroll: () => {},

      getMetrics: () => ({}),
    }),
    {
      name: 'bettracker-storage-v5',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
