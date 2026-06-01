import { useShallow } from 'zustand/shallow'
import { useAuthStore } from '@/stores/auth.store'

export function useAuth() {
  return useAuthStore(
    useShallow((state) => ({
      user: state.user,
      token: state.token,
      isHydrated: state.isHydrated,
      login: state.login,
      logout: state.logout,
    })),
  )
}
