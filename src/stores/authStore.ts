import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { supabase } from '@/lib/supabase'
import type { User, Session } from '@supabase/supabase-js'

interface AuthState {
    user: User | null
    session: Session | null
    isAuthenticated: boolean
    isLoading: boolean
    initialized: boolean
}

interface AuthActions {
    initialize: () => Promise<void>
    signIn: (email: string, password: string) => Promise<{ error: string | null }>
    signUp: (email: string, password: string) => Promise<{ error: string | null }>
    signOut: () => Promise<void>
    setLoading: (loading: boolean) => void
}

type AuthStore = AuthState & AuthActions

export const useAuthStore = create<AuthStore>()(
    persist(
        (set) => ({
            user: null,
            session: null,
            isAuthenticated: false,
            isLoading: true,
            initialized: false,

            initialize: async () => {
                try {
                    const { data: { session } } = await supabase.auth.getSession()

                    set({
                        user: session?.user ?? null,
                        session: session,
                        isAuthenticated: !!session,
                        isLoading: false,
                        initialized: true
                    })

                    // Listen for auth changes
                    supabase.auth.onAuthStateChange((_event, session) => {
                        set({
                            user: session?.user ?? null,
                            session: session,
                            isAuthenticated: !!session
                        })
                    })
                } catch (error) {
                    console.error('Auth initialization error:', error)
                    set({ isLoading: false, initialized: true })
                }
            },

            signIn: async (email: string, password: string) => {
                set({ isLoading: true })

                const { data, error } = await supabase.auth.signInWithPassword({
                    email,
                    password
                })

                set({ isLoading: false })

                if (error) {
                    return { error: error.message }
                }

                set({
                    user: data.user,
                    session: data.session,
                    isAuthenticated: true
                })

                return { error: null }
            },

            signUp: async (email: string, password: string) => {
                set({ isLoading: true })

                const { data, error } = await supabase.auth.signUp({
                    email,
                    password
                })

                set({ isLoading: false })

                if (error) {
                    return { error: error.message }
                }

                set({
                    user: data.user,
                    session: data.session,
                    isAuthenticated: !!data.session
                })

                return { error: null }
            },

            signOut: async () => {
                await supabase.auth.signOut()
                set({ user: null, session: null, isAuthenticated: false })
            },

            setLoading: (isLoading) => set({ isLoading })
        }),
        {
            name: 'ugc-auth',
            partialize: () => ({
                // Only persist minimal state, session is handled by Supabase
            })
        }
    )
)
