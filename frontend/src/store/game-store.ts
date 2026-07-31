import { create } from 'zustand';
import type { Game, GameRound, PracticeWallet } from '@/types';

interface GameState {
  currentGame: Game | null;
  roundHistory: GameRound[];
  isPlaying: boolean;
  wallet: PracticeWallet | null;
  setCurrentGame: (game: Game | null) => void;
  addRound: (round: GameRound) => void;
  setRoundHistory: (rounds: GameRound[]) => void;
  setIsPlaying: (playing: boolean) => void;
  updateWallet: (wallet: PracticeWallet) => void;
  reset: () => void;
}

const initialState = {
  currentGame: null,
  roundHistory: [],
  isPlaying: false,
  wallet: null,
};

export const useGameStore = create<GameState>()((set, get) => ({
  ...initialState,

  setCurrentGame: (game) => set({ currentGame: game }),

  addRound: (round) =>
    set({ roundHistory: [round, ...get().roundHistory].slice(0, 100) }),

  setRoundHistory: (rounds) => set({ roundHistory: rounds }),

  setIsPlaying: (playing) => set({ isPlaying: playing }),

  updateWallet: (wallet) => set({ wallet }),

  reset: () => set(initialState),
}));
