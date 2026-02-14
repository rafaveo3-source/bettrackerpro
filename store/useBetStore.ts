import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { createClient } from '@supabase/supabase-js';

// Configuração do Ambiente e Supabase
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

// --- TIPAGEM ---

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

// --- STATE INTERFACE ---

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
  addBet: (bet: Omit<Bet, 'id' | 'profit' | 'bankrollId'> & { cashoutValue?: number }) => Promise<void>;
  updateBet: (id: string, data: Partial<Bet> & { cashoutValue?: number }) => Promise<void>;
  removeBet: (id: string) => Promise<void>;
  addTransaction: (transaction: Omit<Transaction, 'id' | 'bankrollId'>) => void;
  removeTransaction: (id: string) => void;
  addMethod: (name: string) => Promise<void>;
  removeMethod: (id: string) => void;
  
  // Async Mindset
  addMindsetEntry: (entry: Omit<MindsetEntry, 'id'>) => Promise<void>;
  deleteMindsetEntry: (id: string) => Promise<void>;
  updateMindsetEntry: (id: string, data: Partial<MindsetEntry>) => Promise<void>;

  // Async Goals
  addGoal: (goal: Omit<Goal, 'id' | 'createdAt' | 'current' | 'status'>) => Promise<void>;
  updateGoal: (id: string, data: Partial<Goal>) => Promise<void>;
  deleteGoal: (id: string) => Promise<void>;

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

// --- STORE IMPLEMENTATION ---

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

          const userId = session.user.id;

          // 1. CARREGAR BETS
          const { data: betsData, error: betsError } = await supabase
            .from('bets')
            .select('*')
            .eq('user_id', userId);

          if (betsError) console.error("Erro ao carregar bets:", betsError.message);
          else if (betsData) {
            const formattedBets = betsData.map((bet: any) => ({
              ...bet,
              bankrollId: bet.bankroll_id,
              stake: Number(bet.stake),
              odds: Number(bet.odds),
              profit: Number(bet.profit),
            }));
            set({ history: formattedBets });
          }

          // 2. CARREGAR METHODS
          const { data: methodsData, error: methodsError } = await supabase
            .from('methods')
            .select('*')
            .eq('user_id', userId);

          if (methodsError) console.error("Erro ao carregar métodos:", methodsError.message);
          else if (methodsData) {
            set({ methods: methodsData });
          }

          // 3. CARREGAR BANKROLLS
          const { data: bankrollsData, error: bankrollsError } = await supabase
            .from('bankrolls')
            .select('*')
            .eq('user_id', userId);

          if (bankrollsError) console.error("Erro ao carregar bankrolls:", bankrollsError.message);
          else if (bankrollsData) {
            const formattedBankrolls = bankrollsData.map((b: any) => ({
              id: b.id,
              name: b.name,
              currency: b.currency,
              initialBalance: Number(b.initial_balance)
            }));

            set({
              bankrolls: formattedBankrolls,
              activeBankrollId: formattedBankrolls.length > 0 ? formattedBankrolls[0].id : ''
            });
          }

          // 4. CARREGAR MINDSET
          const { data: mindsetData, error: mindsetError } = await supabase
            .from('mindset_entries')
            .select('*')
            .eq('user_id', userId)
            .order('date', { ascending: false });

          if (mindsetError) console.error("Erro ao carregar mindset:", mindsetError.message);
          else if (mindsetData) {
            const formattedMindset = mindsetData.map((m: any) => ({
              id: m.id,
              date: m.date,
              time: m.time,
              mood: m.mood,
              note: m.note,
              // Garante array mesmo se o banco retornar null
              tags: m.tags ? m.tags : [] 
            }));
            set({ mindsetHistory: formattedMindset });
          }

          // 5. CARREGAR GOALS
          const { data: goalsData, error: goalsError } = await supabase
            .from('goals')
            .select('*')
            .eq('user_id', userId);

          if (goalsError) console.error("Erro ao carregar goals:", goalsError.message);
          else if (goalsData) {
            const formattedGoals = goalsData.map((g: any) => ({
              ...g,
              createdAt: g.created_at, // Mapeia snake_case para camelCase
              target: Number(g.target),
              current: Number(g.current)
            }));
            set({ goals: formattedGoals });
          }

          // Garante recálculo do saldo
          get().recalculateBankroll();

        } else {
          set({
            isAuthenticated: false,
            user: null,
            history: [],
            mindsetHistory: [],
            goals: []
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

      // --- BANKROLLS ---
      addBankroll: async (name, currency, initialBalance) => {
        const user = get().user;
        if (!user) return;

        const { data, error } = await supabase
          .from('bankrolls')
          .insert([
            {
              name,
              currency,
              initial_balance: Number(initialBalance),
              user_id: user.id
            }
          ])
          .select()
          .single();

        if (error) {
          console.error("Erro ao adicionar banca:", error.message);
          return;
        }

        if (data) {
          const newBankroll = {
            id: data.id,
            name: data.name,
            currency: data.currency,
            initialBalance: Number(data.initial_balance)
          };

          set((state) => ({
            bankrolls: [...state.bankrolls, newBankroll],
            activeBankrollId: data.id
          }));

          get().recalculateBankroll();
        }
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
          console.error("Erro ao remover banca:", error.message);
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
        
        if (!activeBR) {
            set({ currentBankrollBalance: 0 });
            return;
        }

        const betsProfit = (state.history || [])
          .filter(b => b.bankroll_id === state.activeBankrollId)
          .reduce((acc, b) => acc + (Number(b.profit) || 0), 0);

        const deposits = (state.transactions || [])
          .filter(t => t.bankrollId === state.activeBankrollId && t.type === 'deposit')
          .reduce((acc, t) => acc + (Number(t.amount) || 0), 0);

        const withdrawals = (state.transactions || [])
          .filter(t => t.bankrollId === state.activeBankrollId && t.type === 'withdrawal')
          .reduce((acc, t) => acc + (Number(t.amount) || 0), 0);

        set({ currentBankrollBalance: Number(activeBR.initialBalance) + betsProfit + deposits - withdrawals });
      },

      // --- BETS ---
      addBet: async (newBetData) => {
        if (get().isTiltLocked()) return;

        const activeBankrollId = get().activeBankrollId;
        if (!activeBankrollId) {
          console.warn("⚠️ Crie ou selecione uma banca antes de registrar uma aposta.");
          return;
        }

        const user = get().user;
        if (!user) return;

        let profit = 0;
        const stake = Number(newBetData.stake);
        const odds = Number(newBetData.odds);
        const cashoutValue = newBetData.cashoutValue ? Number(newBetData.cashoutValue) : 0;
        const { status } = newBetData;

        switch (status) {
          case 'won': profit = (stake * odds) - stake; break;
          case 'lost': profit = -stake; break;
          case 'half-won': profit = ((stake * odds) - stake) / 2; break;
          case 'half-lost': profit = -stake / 2; break;
          case 'void': profit = 0; break;
          case 'cashout': profit = cashoutValue - stake; break;
          case 'pending': profit = 0; break;
        }

        const { cashoutValue: _, ...cleanBetData } = newBetData;

        const betToInsert = {
          ...cleanBetData,
          bankroll_id: activeBankrollId,
          stake,
          odds,
          profit,
          user_id: user.id
        };

        const { data, error } = await supabase
          .from('bets')
          .insert([betToInsert])
          .select()
          .single();

        if (error) {
          console.error("Erro ao adicionar aposta:", error.message);
          return;
        }

        if (data) {
          const newBet = {
             ...data,
             bankrollId: data.bankroll_id,
             stake: Number(data.stake),
             odds: Number(data.odds),
             profit: Number(data.profit)
          };

          set((state) => ({
            history: [newBet, ...state.history]
          }));

          get().recalculateBankroll();
        }
      },

      updateBet: async (id, data) => {
        const user = get().user;
        if (!user) return;

        const currentBet = get().history.find(b => b.id === id);
        if (!currentBet) return;

        const updated = { ...currentBet, ...data };

        let profit = 0;
        const stake = Number(updated.stake);
        const odds = Number(updated.odds);
        const cashoutValue = updated.cashoutValue ? Number(updated.cashoutValue) : 0;
        const { status } = updated;

        switch (status) {
          case 'won': profit = (stake * odds) - stake; break;
          case 'lost': profit = -stake; break;
          case 'half-won': profit = ((stake * odds) - stake) / 2; break;
          case 'half-lost': profit = -stake / 2; break;
          case 'void': profit = 0; break;
          case 'cashout': profit = cashoutValue - stake; break;
          case 'pending': profit = 0; break;
        }

        const payload = {
            sport: updated.sport,
            market: updated.market,
            event: updated.event,
            selection: updated.selection,
            odds,
            stake,
            status: updated.status,
            profit,
            method: updated.method,
            date: updated.date
        };

        const { error } = await supabase
          .from('bets')
          .update(payload)
          .eq('id', id)
          .eq('user_id', user.id);

        if (error) {
          console.error("Erro ao atualizar aposta:", error.message);
          return;
        }

        set((state) => ({
          history: state.history.map(b =>
            b.id === id ? { ...updated, profit, stake, odds } : b
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
          console.error("Erro ao remover aposta:", error.message);
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
            { 
                ...newTx, 
                id: Math.random().toString(36).substr(2, 9), 
                bankrollId: state.activeBankrollId,
                amount: Number(newTx.amount) 
            },
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
          console.error("Erro ao adicionar método:", error.message);
          return;
        }

        if (data) {
          set((state) => ({
            methods: [data, ...state.methods]
          }));
        }
      },

      removeMethod: (id) => {
        set((state) => ({
          methods: state.methods.filter(m => m.id !== id)
        }));
      },

      // --- MINDSET ACTIONS ---
      addMindsetEntry: async (entry) => {
        const user = get().user;
        if (!user) return;

        // Payload blindado para tabela mindset_entries (com tags e note)
        const payload = {
            date: entry.date,
            time: entry.time,
            mood: entry.mood,
            note: entry.note || '', // Proteção para note null
            tags: entry.tags || [], // Proteção para tags null (envia array para o Postgres text[])
            user_id: user.id
        };

        const { data, error } = await supabase
          .from('mindset_entries')
          .insert([payload])
          .select()
          .single();

        if (error) {
          console.error("Erro ao adicionar mindset:", error.message, error.details);
          return;
        }

        if (data) {
          set((state) => ({
            mindsetHistory: [data, ...state.mindsetHistory]
          }));
        }
      },

      deleteMindsetEntry: async (id) => {
        const user = get().user;
        if (!user) return;

        const { error } = await supabase
          .from('mindset_entries')
          .delete()
          .eq('id', id)
          .eq('user_id', user.id);

        if (error) {
          console.error("Erro ao deletar mindset:", error.message);
          return;
        }

        set((state) => ({
          mindsetHistory: state.mindsetHistory.filter(m => m.id !== id)
        }));
      },

      updateMindsetEntry: async (id, data) => {
        const user = get().user;
        if (!user) return;

        const { error } = await supabase
          .from('mindset_entries')
          .update(data)
          .eq('id', id)
          .eq('user_id', user.id);

        if (error) {
          console.error("Erro ao atualizar mindset:", error.message);
          return;
        }

        set((state) => ({
          mindsetHistory: state.mindsetHistory.map(m =>
            m.id === id ? { ...m, ...data } : m
          )
        }));
      },

      // --- GOALS ACTIONS ---
      addGoal: async (goalData) => {
        const user = get().user;
        if (!user) return;

        // Payload mapeado manualmente para garantir compatibilidade com colunas do DB
        const payload = {
            bankroll_id: goalData.bankroll_id,
            title: goalData.title,
            category: goalData.category || 'general',
            target: Number(goalData.target), // Garante number
            current: 0,
            type: goalData.type,
            deadline: goalData.deadline,
            status: 'active',
            user_id: user.id
        };

        const { data, error } = await supabase
          .from('goals')
          .insert([payload])
          .select()
          .single();

        if (error) {
          console.error("Erro ao adicionar goal:", error.message, error.details);
          return;
        }

        if (data) {
          const newGoal: Goal = {
             ...data,
             createdAt: data.created_at || new Date().toISOString(),
             target: Number(data.target),
             current: Number(data.current)
          };

          set((state) => ({
            goals: [...state.goals, newGoal]
          }));
        }
      },

      updateGoal: async (id, data) => {
        const user = get().user;
        if (!user) return;

        // Monta payload parcial sanitizado
        const cleanPayload: any = {};
        if (data.title !== undefined) cleanPayload.title = data.title;
        if (data.category !== undefined) cleanPayload.category = data.category;
        if (data.target !== undefined) cleanPayload.target = Number(data.target);
        if (data.current !== undefined) cleanPayload.current = Number(data.current);
        if (data.type !== undefined) cleanPayload.type = data.type;
        if (data.deadline !== undefined) cleanPayload.deadline = data.deadline;
        if (data.status !== undefined) cleanPayload.status = data.status;
        if (data.bankroll_id !== undefined) cleanPayload.bankroll_id = data.bankroll_id;

        const { error } = await supabase
          .from('goals')
          .update(cleanPayload)
          .eq('id', id)
          .eq('user_id', user.id);

        if (error) {
          console.error("Erro ao atualizar goal:", error.message, error.details);
          return;
        }

        set((state) => ({
          goals: state.goals.map(g =>
            g.id === id ? { ...g, ...data } : g
          )
        }));
      },

      deleteGoal: async (id) => {
        const user = get().user;
        if (!user) return;

        const { error } = await supabase
          .from('goals')
          .delete()
          .eq('id', id)
          .eq('user_id', user.id);

        if (error) {
          console.error("Erro ao deletar goal:", error.message);
          return;
        }

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
        const history = state.history || [];
        const activeBets = history.filter(b => b.bankroll_id === state.activeBankrollId);
        
        const settledBets = activeBets.filter(b => b.status !== 'pending' && b.status !== 'void');
        
        const totalBets = settledBets.length;
        const wins = settledBets.filter(b => b.status === 'won' || b.status === 'half-won').length;
        
        const totalProfit = activeBets.reduce((acc, b) => acc + (Number(b.profit) || 0), 0);
        const totalStaked = settledBets.reduce((acc, b) => acc + (Number(b.stake) || 0), 0);
        
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