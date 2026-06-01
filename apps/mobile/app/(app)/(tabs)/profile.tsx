import { View, Text, TouchableOpacity, Alert } from 'react-native'
import { useAuthStore } from '@/stores/auth.store'
import { setAuthToken } from '@/api/client'

export default function ProfileScreen() {
  const { user, logout } = useAuthStore()

  function handleLogout() {
    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log Out',
        style: 'destructive',
        onPress: async () => {
          setAuthToken(null)
          await logout()
        },
      },
    ])
  }

  const initials = user?.email?.slice(0, 2).toUpperCase() ?? '??'

  return (
    <View className="flex-1 bg-rd-bg pt-16 px-4">
      <View className="px-4 mb-8">
        <Text className="text-rd-muted text-xs font-semibold tracking-widest uppercase">Radock</Text>
        <Text className="text-rd-text text-2xl font-bold mt-0.5">Profile</Text>
      </View>

      {/* Avatar */}
      <View className="items-center mb-8">
        <View className="w-20 h-20 rounded-full bg-rd-primary items-center justify-center mb-3">
          <Text className="text-white text-2xl font-bold">{initials}</Text>
        </View>
        <Text className="text-rd-text text-base font-semibold">{user?.email}</Text>
        <Text className="text-rd-muted text-xs mt-1">
          UID: {user?.uid.slice(0, 8)}...
        </Text>
      </View>

      {/* Actions */}
      <View className="bg-rd-surface rounded-2xl overflow-hidden">
        <TouchableOpacity
          onPress={handleLogout}
          className="flex-row items-center justify-between px-4 py-4"
        >
          <Text className="text-rd-danger font-semibold text-base">Log Out</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}
