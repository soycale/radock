import '../global.css'
import { Stack, router } from 'expo-router'
import * as SplashScreen from 'expo-splash-screen'
import { useEffect } from 'react'
import { ActivityIndicator, View } from 'react-native'
import { useAuthStore } from '@/stores/auth.store'
import { setAuthToken } from '@/api/client'

SplashScreen.preventAutoHideAsync()

export default function RootLayout() {
  const { token, isHydrated, hydrate } = useAuthStore()

  useEffect(() => {
    hydrate()
  }, [])

  useEffect(() => {
    if (!isHydrated) return
    SplashScreen.hideAsync()
    if (token) {
      setAuthToken(token)
      router.replace('/(app)')
    } else {
      router.replace('/(auth)/login')
    }
  }, [isHydrated, token])

  if (!isHydrated) {
    return (
      <View className="flex-1 bg-rd-bg items-center justify-center">
        <ActivityIndicator color="#FE2C55" />
      </View>
    )
  }

  return <Stack screenOptions={{ headerShown: false }} />
}
