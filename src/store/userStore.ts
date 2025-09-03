import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { generateUserId, generateStarColor } from '../utils/constants';
import { ensureUserExists } from '../services/supabase';

interface Position {
  lat: number;
  lng: number;
}

interface User {
  id: string;
  color: string;
  position?: Position;
}

interface UserState {
  currentUser: User | null;
  otherUsers: User[];
  isLoading: boolean;
  error: string | null;
  initializeUser: () => Promise<void>;
  updatePosition: (position: Position) => void;
  addOtherUser: (user: User) => void;
  removeOtherUser: (userId: string) => void;
  setOtherUsers: (users: User[]) => void;
  clearOtherUsers: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

// Conditionally apply devtools only in development
const useUserStore = create<UserState>()(
  process.env.NODE_ENV === 'development'
    ? devtools(
        (set, get) => ({
          currentUser: null,
          otherUsers: [],
          isLoading: true,
          error: null,

          initializeUser: async () => {
            try {
              set({ isLoading: true, error: null });

              let userId = localStorage.getItem('userId');
              let userColor = localStorage.getItem('userColor');

              if (!userId || !userColor) {
                userId = generateUserId();
                userColor = generateStarColor();
                localStorage.setItem('userId', userId);
                localStorage.setItem('userColor', userColor);
              }

              await ensureUserExists(userId, userColor);

              set({
                currentUser: { id: userId, color: userColor },
                isLoading: false,
              });
            } catch (error) {
              console.error('Failed to initialize user:', error);
              set({
                error: error instanceof Error ? error.message : 'Failed to initialize',
                isLoading: false,
              });
            }
          },

          updatePosition: (position) => {
            set((state) => ({
              currentUser: state.currentUser
                ? { ...state.currentUser, position }
                : state.currentUser,
            }));
          },

          addOtherUser: (user) => {
            set((state) => ({
              otherUsers: [...state.otherUsers.filter((u) => u.id !== user.id), user],
            }));
          },

          removeOtherUser: (userId) => {
            set((state) => ({
              otherUsers: state.otherUsers.filter((u) => u.id !== userId),
            }));
          },

          setOtherUsers: (users) => {
            set({ otherUsers: users });
          },

          clearOtherUsers: () => {
            set({ otherUsers: [] });
          },

          setLoading: (loading) => {
            set({ isLoading: loading });
          },

          setError: (error) => {
            set({ error });
          },
        }),
        { name: 'UserStore' }
      )
    : (set, get) => ({
        currentUser: null,
        otherUsers: [],
        isLoading: true,
        error: null,

        initializeUser: async () => {
          try {
            set({ isLoading: true, error: null });

            let userId = localStorage.getItem('userId');
            let userColor = localStorage.getItem('userColor');

            if (!userId || !userColor) {
              userId = generateUserId();
              userColor = generateStarColor();
              localStorage.setItem('userId', userId);
              localStorage.setItem('userColor', userColor);
            }

            await ensureUserExists(userId, userColor);

            set({
              currentUser: { id: userId, color: userColor },
              isLoading: false,
            });
          } catch (error) {
            console.error('Failed to initialize user:', error);
            set({
              error: error instanceof Error ? error.message : 'Failed to initialize',
              isLoading: false,
            });
          }
        },

        updatePosition: (position) => {
          set((state) => ({
            currentUser: state.currentUser
              ? { ...state.currentUser, position }
              : state.currentUser,
          }));
        },

        addOtherUser: (user) => {
          set((state) => ({
            otherUsers: [...state.otherUsers.filter((u) => u.id !== user.id), user],
          }));
        },

        removeOtherUser: (userId) => {
          set((state) => ({
            otherUsers: state.otherUsers.filter((u) => u.id !== userId),
          }));
        },

        setOtherUsers: (users) => {
          set({ otherUsers: users });
        },

        clearOtherUsers: () => {
          set({ otherUsers: [] });
        },

        setLoading: (loading) => {
          set({ isLoading: loading });
        },

        setError: (error) => {
          set({ error });
        },
      })
);

export { useUserStore };
