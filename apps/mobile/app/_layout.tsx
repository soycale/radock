import '../global.css'
import { Stack, router } from 'expo-router'
import * as SplashScreen from 'expo-splash-screen'
import * as Notifications from 'expo-notifications'
import { useEffect } from 'react'
import { ActivityIndicator, View } from 'react-native'
import { useAuthStore } from '@/stores/auth.store'
import { setAuthToken } from '@/api/client'

SplashScreen.preventAutoHideAsync()

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
})

export default function RootLayout() {
  const { token, isHydrated, hydrate } = useAuthStore()

  useEffect(() => {
    hydrate()
    Notifications.requestPermissionsAsync()
  }, [])

  useEffect(() => {
    if (!isHydrated) return
    SplashScreen.hideAsync()
    if (token) {
      setAuthToken(token)
      router.replace('/(app)/(tabs)')
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
