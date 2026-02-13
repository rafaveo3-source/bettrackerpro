
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { createClient } from '@supabase/supabase-js';

// Accepts both legacy and current key names to reduce deployment mistakes.
const env = import.meta.env;
const supabaseUrl = env.VITE_SUPABASE_URL || 'https://invalid-project.supabase.co';
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY || env.VITE_SUPABASE_PUBLISHABLE_KEY || 'invalid-key';
export const isSupabaseConfigured =
  supabaseUrl.startsWith('https://') &&
  supabaseUrl.includes('.supabase.co') &&
  supabaseAnonKey.length > 20;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  }
});

export type BetStatus = 'pending' | 'won' | 'lost' | 'void' | 'half-won' | 'half-lost' | 'cashout';
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
  bankrollId: string;
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
  bankrollId: string;
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
  addBankroll: (name: string, currency: string, initialBalance: number) => void;
  removeBankroll: (id: string) => void;
  setActiveBankroll: (id: string) => void;
  addBet: (bet: Omit<Bet, 'id' | 'profit' | 'bankrollId'> & { cashoutValue?: number }) => void;
  updateBet: (id: string, data: Partial<Bet> & { cashoutValue?: number }) => void;
  removeBet: (id: string) => void;
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
  getMetrics: () => {
    totalProfit: number;
    roi: number;
    winRate: number;
    totalBets: number;
    streak: BetStatus[];
  };
  isTiltLocked: () => boolean;
}

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

      setSession: async (session) => {
  if (session?.user) {
    set({
      isAuthenticated: true,
      user: {
        id: session.user.id,
        email: session.user.email,
        name:
          session.user.user_metadata?.full_name ||
          session.user.email?.split('@')[0] ||
          'Usuário',
        avatar: session.user.user_metadata?.avatar_url,
      },
    });

    // 🔥 CARREGAR BETS DO SUPABASE
    const { data, error } = await supabase
      .from('bets')
      .select('*')
      .eq('user_id', session.user.id);

    if (error) {
      console.error(error);
      return;
    }

    if (data) {
      set({ history: data });
    }

        const { data: methodsData, error: methodsError } = await supabase
      .from('methods')
      .select('*')
      .eq('user_id', session.user.id);

    if (methodsError) {
      console.error(methodsError);
    }

    if (methodsData) {
  set({ methods: methodsData });
}

// 🔥 CARREGAR BANKROLLS
const { data: bankrollsData, error: bankrollsError } = await supabase
  .from('bankrolls')
  .select('*')
  .eq('user_id', session.user.id);

if (bankrollsError) {
  console.error(bankrollsError);
}

if (bankrollsData) {
  set({
    bankrolls: bankrollsData,
    activeBankrollId: bankrollsData.length > 0 ? bankrollsData[0].id : ''
  });
}

  } else {
    set({
      isAuthenticated: false,
      user: null,
      history: []
    });
  }
},

      logout: async () => {
        try {
          await supabase.auth.signOut();
        } finally {
          set({ isAuthenticated: false, user: null });
          localStorage.removeItem('bettracker-storage-v5');
        }
      },
      updateProfile: (data) => set((state) => ({
          user: state.user ? { ...state.user, ...data } : null
      })),
      toggleTheme: () => set((state) => ({ isDarkMode: !state.isDarkMode })),
      setPrimaryColor: (color) => set({ primaryColor: color }),
      setCurrency: (currency) => set({ currency }),
      addBankroll: async (name, currency, initialBalance) => {
  const user = get().user;
  if (!user) return;

  const { data, error } = await supabase
    .from('bankrolls')
    .insert([
      {
        name,
        currency,
        initialBalance,
        user_id: user.id
      }
    ])
    .select()
    .single();

  if (error) {
    console.error(error);
    return;
  }

  set((state) => ({
    bankrolls: [...state.bankrolls, data],
    activeBankrollId: data.id
  }));

  get().recalculateBankroll();
},
      removeBankroll: async (id) => {
  const user = get().user;
  if (!user) return;

  if (get().bankrolls.length <= 1) return;

  const { error } = await supabase
    .from('bankrolls')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) {
    console.error(error);
    return;
  }

  set((state) => {
    const newBankrolls = state.bankrolls.filter(b => b.id !== id);

    return {
      bankrolls: newBankrolls,
      activeBankrollId:
        state.activeBankrollId === id && newBankrolls.length > 0
          ? newBankrolls[0].id
          : state.activeBankrollId
    };
  });

  get().recalculateBankroll();
},
      setActiveBankroll: (id) => {
        set({ activeBankrollId: id });
        get().recalculateBankroll();
      },
      recalculateBankroll: () => {
        const state = get();
        const activeBR = state.bankrolls.find(b => b.id === state.activeBankrollId);
        if (!activeBR) return;
        const betsProfit = state.history
          .filter(b => b.bankroll_id === state.activeBankrollId)
          .reduce((acc, b) => acc + b.profit, 0);
        const deposits = state.transactions
          .filter(t => t.bankrollId === state.activeBankrollId && t.type === 'deposit')
          .reduce((acc, t) => acc + t.amount, 0);
        const withdrawals = state.transactions
          .filter(t => t.bankrollId === state.activeBankrollId && t.type === 'withdrawal')
          .reduce((acc, t) => acc + t.amount, 0);
        set({ currentBankrollBalance: activeBR.initialBalance + betsProfit + deposits - withdrawals });
      },
      addBet: async (newBetData) => {
  if (get().isTiltLocked()) return;

  const user = get().user;
  if (!user) return;

  let profit = 0;
  const { status, stake, odds, cashoutValue } = newBetData;

  switch (status) {
    case 'won': profit = (stake * odds) - stake; break;
    case 'lost': profit = -stake; break;
    case 'half-won': profit = ((stake * odds) - stake) / 2; break;
    case 'half-lost': profit = -stake / 2; break;
    case 'void': profit = 0; break;
    case 'cashout': profit = (cashoutValue || 0) - stake; break;
    case 'pending': profit = 0; break;
  }

  const { cashoutValue: _, ...cleanBetData } = newBetData;

  const betToInsert = {
  ...cleanBetData,
  bankroll_id: get().activeBankrollId,
  profit,
  user_id: user.id
};

  const { data, error } = await supabase
    .from('bets')
    .insert([betToInsert])
    .select()
    .single();

  if (error) {
    console.error(error);
    return;
  }

  set((state) => ({
    history: [data, ...state.history]
  }));

  get().recalculateBankroll();
},
      updateBet: async (id, data) => {
  const user = get().user;
  if (!user) return;

  const currentBet = get().history.find(b => b.id === id);
  if (!currentBet) return;

  const updated = { ...currentBet, ...data };

  let profit = 0;
  const { status, stake, odds, cashoutValue } = updated;

  switch (status) {
    case 'won': profit = (stake * odds) - stake; break;
    case 'lost': profit = -stake; break;
    case 'half-won': profit = ((stake * odds) - stake) / 2; break;
    case 'half-lost': profit = -stake / 2; break;
    case 'void': profit = 0; break;
    case 'cashout': profit = (cashoutValue || 0) - stake; break;
    case 'pending': profit = 0; break;
  }

  const { error } = await supabase
    .from('bets')
    .update({ ...updated, profit })
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) {
    console.error(error);
    return;
  }

  set((state) => ({
    history: state.history.map(b =>
      b.id === id ? { ...updated, profit } : b
    )
  }));

  get().recalculateBankroll();
},
      removeBet: async (id) => {
  const user = get().user;
  if (!user) return;

  const { error } = await supabase
    .from('bets')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) {
    console.error(error);
    return;
  }

  set((state) => ({
    history: state.history.filter(b => b.id !== id)
  }));

  get().recalculateBankroll();
},
      addTransaction: (newTx) => {
        if (get().isTiltLocked()) return;
        set((state) => ({
          transactions: [
            { ...newTx, id: Math.random().toString(36).substr(2, 9), bankrollId: state.activeBankrollId },
            ...state.transactions
          ]
        }));
        get().recalculateBankroll();
      },
      removeTransaction: (id) => {
        set((state) => ({
          transactions: state.transactions.filter(t => t.id !== id)
        }));
        get().recalculateBankroll();
      },
      addMethod: async (name) => {
  const user = get().user;
  if (!user) return;

  const { data, error } = await supabase
    .from('methods')
    .insert([
      {
        name,
        user_id: user.id
      }
    ])
    .select()
    .single();

  if (error) {
    console.error(error);
    return;
  }

  set((state) => ({
    methods: [data, ...state.methods]
  }));
},
      removeMethod: (id) => {
        set((state) => ({
          methods: state.methods.filter(m => m.id !== id)
        }));
      },
      addMindsetEntry: (entry) => {
         set((state) => ({
            mindsetHistory: [{...entry, id: Math.random().toString(36).substr(2, 9)}, ...state.mindsetHistory]
         }));
      },
      addGoal: (goalData) => {
        const id = Math.random().toString(36).substr(2, 9);
        const newGoal: Goal = {
            ...goalData,
            id,
            current: 0,
            status: 'active',
            createdAt: new Date().toISOString()
        };
        set((state) => ({ goals: [...state.goals, newGoal] }));
      },
      updateGoal: (id, data) => {
        set((state) => ({
            goals: state.goals.map(g => g.id === id ? { ...g, ...data } : g)
        }));
      },
      deleteGoal: (id) => {
        set((state) => ({
            goals: state.goals.filter(g => g.id !== id)
        }));
      },
      activateTiltLock: (hours) => {
          const unlockTime = new Date();
          unlockTime.setHours(unlockTime.getHours() + hours);
          set({ tiltLockUntil: unlockTime.toISOString() });
      },
      isTiltLocked: () => {
          const state = get();
          if (!state.tiltLockUntil) return false;
          const now = new Date();
          const unlock = new Date(state.tiltLockUntil);
          if (now >= unlock) {
              set({ tiltLockUntil: null });
              return false;
          }
          return true;
      },
      resetData: () => {
        set({
          bankrolls: [],
          activeBankrollId: '',
          currentBankrollBalance: 0,
          history: [],
          transactions: [],
          mindsetHistory: [],
          goals: []
        });
      },
      getMetrics: () => {
        const state = get();
        const activeBets = state.history.filter(b => b.bankrollId === state.activeBankrollId);
        const settledBets = activeBets.filter(b => b.status !== 'pending' && b.status !== 'void');
        const totalBets = settledBets.length;
        const wins = settledBets.filter(b => b.status === 'won' || b.status === 'half-won').length;
        const totalProfit = activeBets.reduce((acc, b) => acc + b.profit, 0);
        const totalStaked = settledBets.reduce((acc, b) => acc + b.stake, 0);
        const streak = settledBets.slice(0, 5).map(b => b.status);
        return {
          totalProfit,
          roi: totalStaked > 0 ? (totalProfit / totalStaked) * 100 : 0,
          winRate: totalBets > 0 ? (wins / totalBets) * 100 : 0,
          totalBets: activeBets.length,
          streak
        };
      }
    }),
    {
      name: 'bettracker-storage-v5',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
