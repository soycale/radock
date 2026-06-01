import { Tabs } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useSocket } from '@/hooks/useSocket'
import { useAuthStore } from '@/stores/auth.store'

export default function AppLayout() {
  const token = useAuthStore((s) => s.token)
  useSocket(token)

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#161616',
          borderTopColor: '#2A2A2A',
        },
        tabBarActiveTintColor: '#FE2C55',
        tabBarInactiveTintColor: '#8A8A8A',
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Markets',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="trending-up" color={color} size={size} />
          ),
        }}
      />
    </Tabs>
  )
}
