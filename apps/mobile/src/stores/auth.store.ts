import { create } from 'zustand'
import * as SecureStore from 'expo-secure-store'
import { createUserWithEmailAndPassword, onIdTokenChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth'
import { firebaseAuth } from '@/lib/firebase'
import { setAuthToken } from '@/api/client'

const TOKEN_KEY = 'auth_token'
const USER_KEY = 'auth_user'

interface AuthUser {
  uid: string
  email: string
}

interface AuthState {
  user: AuthUser | null
  token: string | null
  isHydrated: boolean
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  hydrate: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isHydrated: false,

  hydrate: async () => {
    // Restore persisted session first so the app doesn't flash the login screen
    const token = await SecureStore.getItemAsync(TOKEN_KEY)
    const userRaw = await SecureStore.getItemAsync(USER_KEY)
    const user = userRaw ? (JSON.parse(userRaw) as AuthUser) : null
    if (token) setAuthToken(token)
    set({ token, user, isHydrated: true })

    // Subscribe to Firebase token changes — fires automatically when the SDK
    // silently refreshes the token (~5 min before expiry, every ~55 min)
    onIdTokenChanged(firebaseAuth, async (firebaseUser) => {
      if (!firebaseUser) return
      const freshToken = await firebaseUser.getIdToken()
      setAuthToken(freshToken)
      await SecureStore.setItemAsync(TOKEN_KEY, freshToken)
      set({ token: freshToken })
    })
  },

  register: async (email, password) => {
    const credential = await createUserWithEmailAndPassword(firebaseAuth, email, password)
    const token = await credential.user.getIdToken()
    const user: AuthUser = { uid: credential.user.uid, email: credential.user.email ?? email }
    await SecureStore.setItemAsync(TOKEN_KEY, token)
    await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user))
    set({ user, token })
  },

  login: async (email, password) => {
    const credential = await signInWithEmailAndPassword(firebaseAuth, email, password)
    const token = await credential.user.getIdToken()
    const user: AuthUser = { uid: credential.user.uid, email: credential.user.email ?? email }

    await SecureStore.setItemAsync(TOKEN_KEY, token)
    await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user))

    set({ user, token })
  },

  logout: async () => {
    await signOut(firebaseAuth)
    await SecureStore.deleteItemAsync(TOKEN_KEY)
    await SecureStore.deleteItemAsync(USER_KEY)
    set({ user: null, token: null })
  },
}))
