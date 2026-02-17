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

export type BetStatus =
  | 'pending'
  | 'won'
  | 'lost'
  | 'void'
  | 'half-won'
  | 'half-lost'
  | 'cashout'
  | 'refunded';

export type TransactionType = 'deposit' | 'withdrawal';
export type MoodType = 'confident' | 'disciplined' | 'anxious' | 'tilted';
export type DisplayMode = 'currency' | 'units';

export interface League {
  id: string;
  name: string;
  country: string;
  sport: string;
}

export interface Team {
  id: string;
  name: string;
  league_id: string;
}

// 🔥 NOVA INTERFACE PARA MERCADOS GLOBAIS
export interface GlobalMarket {
  id: string;
  category: string;
  label: string;
  name: string;
}

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
  type: 'monthly' | 'daily' | 'weekly' | 'custom' | 'profit' | 'roi' | 'equity';
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
  
  // Configurações
  displayMode: DisplayMode;
  unitSize: number;

  // Estados Globais e de Usuário
  globalLeagues: League[];
  userLeagues: string[];
  isLoadingLeagues: boolean;

  // 🔥 MARKET STATES
  globalMarkets: GlobalMarket[];
  isLoadingMarkets: boolean;

  bankrolls: Bankroll[];
  activeBankrollId: string;
  currentBankrollBalance: number;
  history: Bet[];
  transactions: Transaction[];
  methods: BetMethod[];
  customMarkets: { id: string; name: string }[];
  customStrategies: { id: string; name: string }[];
  mindsetHistory: MindsetEntry[];
  goals: Goal[];
  tiltLockUntil: string | null;

  // TEAM STATES
  currentLeagueTeams: Team[];
  userTeams: string[];
  isLoadingTeams: boolean;

  // TEAM ACTIONS
  fetchLeagueTeams: (leagueId: string) => Promise<void>;
  toggleUserTeam: (teamId: string) => Promise<void>;

  // Actions
  setSession: (session: any) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<User>) => void;
  toggleTheme: () => void;
  setPrimaryColor: (color: string) => Promise<void>;
  setCurrency: (currency: string) => Promise<void>;
  setDisplayMode: (mode: DisplayMode) => Promise<void>;
  setUnitSize: (size: number) => Promise<void>;

  loadUserSettings: () => Promise<void>;
  saveUserSettings: () => Promise<void>;

  // Ligas Actions
  fetchLeagues: () => Promise<void>;
  toggleUserLeague: (leagueId: string) => Promise<void>;

  // 🔥 MARKET ACTIONS
  fetchGlobalMarkets: () => Promise<void>;
  toggleUserMarket: (market: GlobalMarket) => Promise<void>;

  addBankroll: (name: string, currency: string, initialBalance: number) => Promise<void>;
  removeBankroll: (id: string) => Promise<void>;
  setActiveBankroll: (id: string) => void;
  addBet: (bet: Omit<Bet, 'id' | 'profit' | 'bankrollId'> & { cashoutValue?: number }) => Promise<void>;
  updateBet: (id: string, data: Partial<Bet> & { cashoutValue?: number }) => Promise<void>;
  removeBet: (id: string) => Promise<void>;
  addTransaction: (transaction: Omit<Transaction, 'id' | 'bankrollId'>) => Promise<void>;
  removeTransaction: (id: string) => Promise<void>;
  addMethod: (name: string) => Promise<void>;
  removeMethod: (id: string) => void;

  addCustomMarket: (name: string) => Promise<void>;
  removeCustomMarket: (id: string) => Promise<void>;

  addCustomStrategy: (name: string) => Promise<void>;
  removeCustomStrategy: (id: string) => Promise<void>;
  
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
  
  // Intelligence & Metrics
  getMetrics: () => {
    totalProfit: number;
    roi: number;
    winRate: number;
    totalBets: number;
    streak: BetStatus[];
    maxDrawdown: number;
    sharpeRatio: number;
    volatility: number;
    profitFactor: number;
  };
  
  // Mindset Analytics
  getMindsetAnalytics: () => {
    msi: number;
    moodCorrelation: Record<MoodType, { roi: number; winRate: number; count: number }>;
  };

  // System Library Imports
  importMarket: (marketId: string) => Promise<boolean>;
  importLeague: (leagueId: string) => Promise<boolean>;
  importTeam: (teamId: string) => Promise<boolean>;
  importSystemMethod: (methodId: string) => Promise<boolean>;
  importProgressionStrategy: (strategyId: string) => Promise<boolean>;

  // Toast System
  toast: { type: 'success' | 'error'; message: string } | null;
  setToast: (toast: { type: 'success' | 'error'; message: string } | null) => void;

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
      displayMode: 'currency',
      unitSize: 100,
      
      globalLeagues: [],
      userLeagues: [],
      isLoadingLeagues: false,

      globalMarkets: [],
      isLoadingMarkets: false,

      bankrolls: [],
      activeBankrollId: '',
      currentBankrollBalance: 0,
      history: [],
      transactions: [],
      methods: [],
      customMarkets: [],
      customStrategies: [],
      mindsetHistory: [],
      goals: [],
      tiltLockUntil: null,
      toast: null,

      currentLeagueTeams: [],
      userTeams: [],
      isLoadingTeams: false,

      setSession: async (session) => {
        if (session?.user) {
          set({
            isAuthenticated: true,
            user: {
              id: session.user.id,
              email: session.user.email,
              name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'Usuário',
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
          const { data: methodsData } = await supabase
            .from('methods')
            .select('*')
            .eq('user_id', userId);

          if (methodsData) {
            set({ methods: methodsData });
          }
        
          // Carregar User Markets
          const { data: userMarketsData } = await supabase
            .from('user_markets')
            .select('id, name') // Importante pegar o nome para o estado local
            .eq('user_id', userId);

          if (userMarketsData) {
            set({ customMarkets: userMarketsData });
          }

          // Carregar User Strategies
          const { data: userStrategies } = await supabase
            .from('user_strategies')
            .select('*')
            .eq('user_id', userId);

          if (userStrategies) {
            set({ customStrategies: userStrategies });
          }

          // 3. CARREGAR BANKROLLS
          const { data: bankrollsData } = await supabase
            .from('bankrolls')
            .select('*')
            .eq('user_id', userId);

          if (bankrollsData) {
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

          // CARREGAR TRANSACTIONS
          const { data: txData } = await supabase
            .from('transactions')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

          if (txData) {
            const formattedTx = txData.map((t: any) => ({
              id: t.id,
              bankrollId: t.bankroll_id,
              date: t.created_at,
              type: t.type,
              amount: Number(t.amount),
              description: t.description
            }));

            set({ transactions: formattedTx });
          }

          // 4. CARREGAR MINDSET
          const { data: mindsetData } = await supabase
            .from('mindset_entries')
            .select('*')
            .eq('user_id', userId)
            .order('date', { ascending: false });

          if (mindsetData) {
            const formattedMindset = mindsetData.map((m: any) => ({
              id: m.id,
              date: m.date,
              time: m.time,
              mood: m.mood,
              note: m.note,
              tags: m.tags ? m.tags : [] 
            }));
            set({ mindsetHistory: formattedMindset });
          }

          // 5. CARREGAR GOALS
          const { data: goalsData } = await supabase
            .from('goals')
            .select('*')
            .eq('user_id', userId);

          if (goalsData) {
            const formattedGoals = goalsData.map((g: any) => ({
              ...g,
              createdAt: g.created_at,
              target: Number(g.target),
              current: Number(g.current)
            }));
            set({ goals: formattedGoals });
          }

          // 6. CARREGAR PREFERÊNCIAS DE LIGAS E TIMES
          const { data: userLeaguesData } = await supabase
            .from('user_leagues')
            .select('league_id')
            .eq('user_id', userId);

          const { data: userTeamsData } = await supabase
            .from('user_teams')
            .select('team_id')
            .eq('user_id', userId);

          set({ 
            userLeagues: userLeaguesData ? userLeaguesData.map((ul: any) => ul.league_id) : [],
            userTeams: userTeamsData ? userTeamsData.map((ut: any) => ut.team_id) : []
          });
          
          await get().loadUserSettings();
          get().recalculateBankroll();
        } else {
          set({
            isAuthenticated: false,
            user: null,
            history: [],
            transactions: [],
            mindsetHistory: [],
            goals: [],
            bankrolls: [],
            activeBankrollId: '',
            currentBankrollBalance: 0,
            userLeagues: [],
            globalLeagues: [],
            globalMarkets: [],
            customMarkets: []
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
      
      setPrimaryColor: async (color) => {
        set({ primaryColor: color });
        await get().saveUserSettings();
      },

      setCurrency: async (currency) => {
        set({ currency });
        await get().saveUserSettings();
      },

      setDisplayMode: async (mode) => {
        set({ displayMode: mode });
        await get().saveUserSettings();
      },

      setUnitSize: async (size) => {
        set({ unitSize: size });
        await get().saveUserSettings();
      },

      loadUserSettings: async () => {
        const user = get().user;
        if (!user) return;

        const { data, error } = await supabase
          .from('user_settings')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (error && error.code !== 'PGRST116') {
          console.error("Erro ao carregar settings:", error.message);
          return;
        }

        if (data) {
          set({
            primaryColor: data.primary_color || 'gold',
            currency: data.currency || 'BRL',
            displayMode: data.display_mode || 'currency',
            unitSize: Number(data.unit_size) || 100
          });
        } else {
          await supabase.from('user_settings').insert([{
            user_id: user.id,
            primary_color: 'gold',
            currency: 'BRL',
            display_mode: 'currency',
            unit_size: 100
          }]);
        }
      },

      saveUserSettings: async () => {
        const user = get().user;
        if (!user) return;

        const state = get();

        const { error } = await supabase
          .from('user_settings')
          .upsert({
            user_id: user.id,
            primary_color: state.primaryColor,
            currency: state.currency,
            display_mode: state.displayMode,
            unit_size: state.unitSize,
            updated_at: new Date().toISOString()
          }, { onConflict: 'user_id' });

        if (error) {
          console.error("Erro ao salvar settings:", error.message);
        }
      },

      // 🔥 LEAGUES MANAGEMENT ACTIONS
      fetchLeagues: async () => {
        set({ isLoadingLeagues: true });
        try {
          const { data: leagues } = await supabase
            .from('leagues')
            .select('*')
            .order('country', { ascending: true });

          const { data: { user } } = await supabase.auth.getUser();
          
          let userLeagueIds: string[] = [];
          if (user) {
            const { data: userLeaguesData } = await supabase
              .from('user_leagues')
              .select('league_id')
              .eq('user_id', user.id);
              
            if (userLeaguesData) {
              userLeagueIds = userLeaguesData.map((ul: any) => ul.league_id);
            }
          }

          set({ 
            globalLeagues: leagues || [], 
            userLeagues: userLeagueIds
          });
        } catch (error) {
          console.error('Erro ao buscar ligas:', error);
        } finally {
          set({ isLoadingLeagues: false });
        }
      },

      toggleUserLeague: async (leagueId) => {
        const { userLeagues } = get();
        const isActive = userLeagues.includes(leagueId);
        
        // Optimistic Update
        const newUserLeagues = isActive
          ? userLeagues.filter(id => id !== leagueId)
          : [...userLeagues, leagueId];
        
        set({ userLeagues: newUserLeagues });

        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) return;

          if (isActive) {
            await supabase
              .from('user_leagues')
              .delete()
              .match({ user_id: user.id, league_id: leagueId });
          } else {
            await supabase
              .from('user_leagues')
              .insert({ user_id: user.id, league_id: leagueId });
          }
        } catch (error) {
          console.error('Erro ao atualizar liga:', error);
          set({ userLeagues });
        }
      },

      // 🔥 MARKET ACTIONS (IMPLEMENTAÇÃO)
      fetchGlobalMarkets: async () => {
        set({ isLoadingMarkets: true });
        try {
          const { data } = await supabase
            .from('markets')
            .select('*')
            .order('label', { ascending: true })
            .order('name', { ascending: true });
            
          set({ globalMarkets: data || [] });
        } catch (error) {
          console.error('Erro ao buscar mercados:', error);
        } finally {
          set({ isLoadingMarkets: false });
        }
      },

      toggleUserMarket: async (market) => {
        const { customMarkets } = get();
        const exists = customMarkets.find(m => m.name === market.name);
        
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) return;

          if (exists) {
            // Remover
            const newMarkets = customMarkets.filter(m => m.name !== market.name);
            set({ customMarkets: newMarkets }); 

            await supabase
              .from('user_markets')
              .delete()
              .eq('user_id', user.id)
              .eq('name', market.name);
          } else {
            // Adicionar
            const newMarket = { id: crypto.randomUUID(), name: market.name }; 
            set({ customMarkets: [...customMarkets, newMarket] }); 

            await supabase
              .from('user_markets')
              .insert({ 
                user_id: user.id, 
                market_id: market.id, 
                name: market.name 
              });
          }
        } catch (error) {
          console.error('Erro ao atualizar mercado:', error);
        }
      },

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

        try {
          const { error: betsError } = await supabase
            .from('bets')
            .delete()
            .eq('bankroll_id', id)
            .eq('user_id', user.id);

          if (betsError) {
            console.error("Erro ao deletar bets da banca:", betsError.message);
            return;
          }

          const { error: goalsError } = await supabase
            .from('goals')
            .delete()
            .eq('bankroll_id', id)
            .eq('user_id', user.id);

          if (goalsError) {
            console.error("Erro ao deletar metas da banca:", goalsError.message);
            return;
          }

          const { error: brError } = await supabase
            .from('bankrolls')
            .delete()
            .eq('id', id)
            .eq('user_id', user.id);

          if (brError) {
            console.error("Erro ao remover banca:", brError.message);
            return;
          }

          set((state) => {
            const newBankrolls = state.bankrolls.filter(b => b.id !== id);
            const newActiveId =
              state.activeBankrollId === id
                ? newBankrolls.length > 0
                  ? newBankrolls[0].id
                  : ''
                : state.activeBankrollId;

            return {
              bankrolls: newBankrolls,
              activeBankrollId: newActiveId,
              history: state.history.filter(b => b.bankroll_id !== id),
              transactions: state.transactions.filter(t => t.bankrollId !== id),
              goals: state.goals.filter(g => g.bankroll_id !== id)
            };
          });

          get().recalculateBankroll();

        } catch (err) {
          console.error("Erro inesperado ao remover banca:", err);
        }
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
          case 'refunded': profit = 0; break;
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
          case 'refunded': profit = 0; break;
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

      addTransaction: async (newTx) => {
        if (get().isTiltLocked()) return;

        const user = get().user;
        const activeBankrollId = get().activeBankrollId;
        if (!user || !activeBankrollId) return;

        const payload = {
          user_id: user.id,
          bankroll_id: activeBankrollId,
          type: newTx.type,
          amount: Number(newTx.amount),
          description: newTx.description || '',
        };

        const { data, error } = await supabase
          .from('transactions')
          .insert([payload])
          .select()
          .single();

        if (error) {
          console.error("Erro ao adicionar transação:", error.message);
          return;
        }

        if (data) {
          const formatted = {
            id: data.id,
            bankrollId: data.bankroll_id,
            date: data.created_at,
            type: data.type,
            amount: Number(data.amount),
            description: data.description
          };

          set((state) => ({
            transactions: [formatted, ...state.transactions]
          }));

          get().recalculateBankroll();
        }
      },

      removeTransaction: async (id) => {
        const user = get().user;
        if (!user) return;

        const { error } = await supabase
          .from('transactions')
          .delete()
          .eq('id', id)
          .eq('user_id', user.id);

        if (error) {
          console.error("Erro ao remover transação:", error.message);
          return;
        }

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

      addCustomMarket: async (name) => {
        const user = get().user;
        if (!user) return;

        const { data, error } = await supabase
          .from('user_markets')
          .insert({
            user_id: user.id,
            market_id: null,
            name
          })
          .select()
          .single();

        if (error) {
          console.error("Erro ao adicionar mercado:", error.message);
          return;
        }

        if (data) {
          set((state) => ({
            customMarkets: [...state.customMarkets, data]
          }));
        }
      },

      removeCustomMarket: async (id) => {
        const user = get().user;
        if (!user) return;
        
        const { error } = await supabase
          .from('user_markets')
          .delete()
          .eq('id', id)
          .eq('user_id', user.id); 

        if (error) {
          console.error("Erro ao remover mercado:", error.message);
          return;
        }

        set((state) => ({
          customMarkets: state.customMarkets.filter(m => m.id !== id)
        }));
      },

      addCustomStrategy: async (name) => {
        const user = get().user;
        if (!user) return;

        const { data, error } = await supabase
          .from('user_strategies')
          .insert({
            user_id: user.id,
            strategy_id: null,
            name
          })
          .select()
          .single();

        if (error) {
          console.error("Erro ao adicionar estratégia:", error.message);
          return;
        }

        if (data) {
          set((state) => ({
            customStrategies: [...state.customStrategies, data]
          }));
        }
      },

      removeCustomStrategy: async (id) => {
        const user = get().user;
        if (!user) return;

        const { error } = await supabase
          .from('user_strategies') 
          .delete()
          .eq('id', id)
          .eq('user_id', user.id); 

        if (error) {
          console.error("Erro ao remover estratégia:", error.message);
          return;
        }

        set((state) => ({
          customStrategies: state.customStrategies.filter(s => s.id !== id)
        }));
      },

      // --- MINDSET ACTIONS ---
      addMindsetEntry: async (entry) => {
        const user = get().user;
        if (!user) return;

        const payload = {
            date: entry.date,
            time: entry.time,
            mood: entry.mood,
            note: entry.note || '',
            tags: entry.tags || [],
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

        const bankrollId = goalData.bankroll_id || get().activeBankrollId;
        
        if (!bankrollId) {
            console.error("Erro ao adicionar meta: Nenhuma banca selecionada.");
            return;
        }

        const payload = {
            bankroll_id: bankrollId,
            title: goalData.title,
            category: goalData.category || 'general',
            target: Number(goalData.target),
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

      // ===============================
      // 🔥 SYSTEM LIBRARY IMPORT ENGINE
      // ===============================

      setToast: (toast) => set({ toast }),

      importMarket: async (marketId) => {
        const user = get().user;
        if (!user) return false;

        const { data, error } = await supabase
          .from('markets')
          .select('*')
          .eq('id', marketId)
          .single();
        
        if (error || !data) {
             return false; 
        }

        const { error: insertError } = await supabase
          .from('user_markets')
          .insert({
            user_id: user.id,
            market_id: data.id,
            name: data.name
          });

        if (insertError) {
          get().setToast({ type: 'error', message: 'Mercado já importado.' });
          return false;
        }

        // Atualiza estado local
        set((state) => ({
            customMarkets: [...state.customMarkets, { id: crypto.randomUUID(), name: data.name }]
        }));

        get().setToast({ type: 'success', message: 'Mercado adicionado à sua conta.' });
        return true;
      },

      importLeague: async (leagueId) => {
        const user = get().user;
        if (!user) return false;

        // Verify league exists
        const { data, error } = await supabase
          .from('leagues')
          .select('*')
          .eq('id', leagueId)
          .single();

        if (error || !data) {
          get().setToast({ type: 'error', message: 'Erro ao importar liga.' });
          return false;
        }
        
        const { error: insertError } = await supabase
              .from('user_leagues')
              .insert({ user_id: user.id, league_id: leagueId });

        if (insertError) {
           get().setToast({ type: 'success', message: 'Liga já está na sua lista.' });
           return true;
        }

        // Update local state
        const { userLeagues } = get();
        if (!userLeagues.includes(leagueId)) {
            set({ userLeagues: [...userLeagues, leagueId] });
        }

        get().setToast({ type: 'success', message: 'Liga importada com sucesso.' });
        return true;
      },

      importTeam: async (teamId) => {
        const user = get().user;
        if (!user) return false;

        const { data, error } = await supabase
          .from('teams')
          .select('*')
          .eq('id', teamId)
          .single();

        if (error || !data) {
          get().setToast({ type: 'error', message: 'Erro ao importar time.' });
          return false;
        }
        
        get().setToast({ type: 'success', message: 'Time importado com sucesso.' });
        return true;
      },

      importSystemMethod: async (methodId) => {
        const user = get().user;
        if (!user) return false;

        const { data, error } = await supabase
          .from('system_methods')
          .select('*')
          .eq('id', methodId)
          .single();

        if (error || !data) {
          get().setToast({ type: 'error', message: 'Erro ao importar método.' });
          return false;
        }

        await supabase.from('methods').insert({
          name: data.name,
          user_id: user.id
        });

        get().setToast({ type: 'success', message: 'Método importado para sua conta.' });
        return true;
      },

      importProgressionStrategy: async (strategyId) => {
        const user = get().user;
        if (!user) return false;

        const { data, error } = await supabase
          .from('progression_strategies')
          .select('*')
          .eq('id', strategyId)
          .single();

        if (error || !data) {
          get().setToast({ type: 'error', message: 'Erro ao importar estratégia.' });
          return false;
        }

        const { error: insertError } = await supabase
          .from('user_strategies')
          .insert({
            user_id: user.id,
            strategy_id: data.id,
            name: data.name
          });

        if (insertError) {
          get().setToast({ type: 'error', message: 'Estratégia já ativada.' });
          return false;
        }

        get().setToast({ type: 'success', message: 'Estratégia ativada na sua conta.' });
        return true;
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

      // 🔥🔥🔥 HEDGE FUND METRICS ENGINE 🔥🔥🔥
      getMetrics: () => {
        const state = get();
        const history = state.history || [];
        
        const activeBets = history.filter(b => 
            b.bankroll_id === state.activeBankrollId && 
            b.status !== 'void' && 
            b.status !== 'refunded'
        );
        
        const settledBets = activeBets.filter(b => b.status !== 'pending');
        const wins = settledBets.filter(b => b.status === 'won' || b.status === 'half-won').length;
        const totalProfit = settledBets.reduce((acc, b) => acc + b.profit, 0);
        const totalStaked = settledBets.reduce((acc, b) => acc + b.stake, 0);
        
        let peak = 0;
        let maxDrawdown = 0;
        let runningProfit = 0;
        
        const sortedBets = [...settledBets].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        
        sortedBets.forEach(bet => {
            runningProfit += bet.profit;
            if (runningProfit > peak) peak = runningProfit;
            
            const drawdown = peak - runningProfit;
            if (drawdown > maxDrawdown) maxDrawdown = drawdown;
        });

        const returns = sortedBets.map(b => b.profit);
        const meanReturn = returns.length > 0 ? totalProfit / returns.length : 0;
        
        const variance = returns.reduce((sum, r) => sum + Math.pow(r - meanReturn, 2), 0) / (returns.length || 1);
        const volatility = Math.sqrt(variance);
        
        const sharpeRatio = volatility > 0 ? meanReturn / volatility : 0;

        const grossProfit = settledBets.filter(b => b.profit > 0).reduce((acc, b) => acc + b.profit, 0);
        const grossLoss = Math.abs(settledBets.filter(b => b.profit < 0).reduce((acc, b) => acc + b.profit, 0));
        const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? Infinity : 0;

        const streak = settledBets.slice(0, 5).map(b => b.status);

        return {
          totalProfit,
          roi: totalStaked > 0 ? (totalProfit / totalStaked) * 100 : 0,
          winRate: settledBets.length > 0 ? (wins / settledBets.length) * 100 : 0,
          totalBets: settledBets.length,
          streak,
          maxDrawdown,
          sharpeRatio,
          volatility,
          profitFactor
        };
      },

      // 🔥 TEAMS MANAGEMENT ACTIONS
      fetchLeagueTeams: async (leagueId) => {
        set({ isLoadingTeams: true });
        try {
          const { data } = await supabase
            .from('teams')
            .select('*')
            .eq('league_id', leagueId)
            .order('name', { ascending: true });
            
          set({ currentLeagueTeams: data || [] });
        } catch (error) {
          console.error('Erro ao buscar times:', error);
        } finally {
          set({ isLoadingTeams: false });
        }
      },

      toggleUserTeam: async (teamId) => {
        const { userTeams } = get();
        const isActive = userTeams.includes(teamId);
        
        // Optimistic Update
        const newUserTeams = isActive
          ? userTeams.filter(id => id !== teamId)
          : [...userTeams, teamId];
        
        set({ userTeams: newUserTeams });

        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) return;

          if (isActive) {
            await supabase
              .from('user_teams')
              .delete()
              .match({ user_id: user.id, team_id: teamId });
          } else {
            await supabase
              .from('user_teams')
              .insert({ user_id: user.id, team_id: teamId });
          }
        } catch (error) {
          console.error('Erro ao atualizar time:', error);
          set({ userTeams }); // Revert
        }
      },

      // 🔥🔥🔥 MINDSET INTELLIGENCE 🔥🔥🔥
      getMindsetAnalytics: () => {
        const s = get();
        const stats: Record<string, { profit: number; staked: number; wins: number; total: number }> = {
            confident: { profit: 0, staked: 0, wins: 0, total: 0 },
            disciplined: { profit: 0, staked: 0, wins: 0, total: 0 },
            anxious: { profit: 0, staked: 0, wins: 0, total: 0 },
            tilted: { profit: 0, staked: 0, wins: 0, total: 0 },
        };

        s.mindsetHistory.forEach(entry => {
            const entryDate = entry.date;
            
            const dayBets = s.history.filter(b => 
                b.date.startsWith(entryDate) && 
                b.bankroll_id === s.activeBankrollId && 
                b.status !== 'pending' && 
                b.status !== 'void' &&
                b.status !== 'refunded'
            );
            
            dayBets.forEach(bet => {
                if (stats[entry.mood]) {
                    stats[entry.mood].profit += bet.profit;
                    stats[entry.mood].staked += bet.stake;
                    stats[entry.mood].total += 1;
                    if (bet.status === 'won' || bet.status === 'half-won') stats[entry.mood].wins += 1;
                }
            });
        });

        const moodCorrelation: any = {};
        let msiScore = 50;

        Object.keys(stats).forEach(key => {
            const d = stats[key];
            moodCorrelation[key as MoodType] = {
                roi: d.staked > 0 ? (d.profit / d.staked) * 100 : 0,
                winRate: d.total > 0 ? (d.wins / d.total) * 100 : 0,
                count: d.total
            };
        });

        const roiD = moodCorrelation.disciplined.roi;
        const roiC = moodCorrelation.confident.roi;
        const roiA = moodCorrelation.anxious.roi;
        const roiT = moodCorrelation.tilted.roi;

        msiScore += (roiD > 0 ? 15 : 5); 
        msiScore += (roiC > 0 ? 10 : -5); 
        msiScore -= (roiA < 0 ? 15 : 5); 
        msiScore -= (roiT < 0 ? 25 : 10); 

        msiScore = Math.max(0, Math.min(100, msiScore));

        return { msi: msiScore, moodCorrelation };
      }
    }),
    {
      name: 'bettracker-storage-v5',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        isDarkMode: state.isDarkMode,
        // Persist displayMode and unitSize to ensure user settings are kept locally too
        displayMode: state.displayMode,
        unitSize: state.unitSize
      }),
    }
  )
);