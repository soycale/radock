import { useCallback, useState } from 'react'
import { View, Text, FlatList, TouchableOpacity, Alert, ActivityIndicator } from 'react-native'
import { router, useFocusEffect } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import type { AlertDto, ApiResponse } from '@radock/types'
import { api } from '@/api/client'

function AlertRow({ alert, onDelete }: { alert: AlertDto; onDelete: (id: string) => void }) {
  function confirmDelete() {
    Alert.alert('Delete Alert', `Remove alert for ${alert.symbol} at $${alert.targetPrice}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => onDelete(alert.id) },
    ])
  }

  return (
    <View className="flex-row items-center justify-between bg-rd-surface mx-4 my-1.5 px-4 py-4 rounded-xl">
      <View>
        <View className="flex-row items-center gap-x-2">
          <View className="bg-rd-primary px-2 py-0.5 rounded">
            <Text className="text-white text-xs font-bold">{alert.symbol}</Text>
          </View>
          <Text className="text-rd-muted text-xs">when price ≥ ${Number(alert.targetPrice).toFixed(2)}</Text>
        </View>
        <Text className="text-rd-muted text-xs mt-1">
          {new Date(alert.createdAt).toLocaleDateString()}
        </Text>
      </View>
      <TouchableOpacity onPress={confirmDelete} hitSlop={8}>
        <Ionicons name="trash-outline" size={18} color="#8A8A8A" />
      </TouchableOpacity>
    </View>
  )
}

export default function AlertsScreen() {
  const [alerts, setAlerts] = useState<AlertDto[]>([])
  const [loading, setLoading] = useState(true)

  const fetchAlerts = useCallback(() => {
    setLoading(true)
    api.get<ApiResponse<AlertDto[]>>('/alerts')
      .then((res) => setAlerts(res.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  useFocusEffect(fetchAlerts)

  async function handleDelete(id: string) {
    await api.delete(`/alerts/${id}`)
    setAlerts((prev) => prev.filter((a) => a.id !== id))
  }

  return (
    <View className="flex-1 bg-rd-bg pt-16">
      <View className="flex-row items-center justify-between px-4 mb-4">
        <View>
          <Text className="text-rd-muted text-xs font-semibold tracking-widest uppercase">Radock</Text>
          <Text className="text-rd-text text-2xl font-bold mt-0.5">Alerts</Text>
        </View>
        <TouchableOpacity
          onPress={() => router.push('/(app)/alerts/new' as any)}
          className="bg-rd-primary w-9 h-9 rounded-full items-center justify-center"
        >
          <Ionicons name="add" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#FE2C55" />
        </View>
      ) : alerts.length === 0 ? (
        <View className="flex-1 items-center justify-center px-8">
          <Ionicons name="notifications-off-outline" size={48} color="#2A2A2A" />
          <Text className="text-rd-text font-semibold mt-4 text-base">No alerts yet</Text>
          <Text className="text-rd-muted text-sm text-center mt-1">
            Tap + to create one
          </Text>
        </View>
      ) : (
        <FlatList
          data={alerts}
          keyExtractor={(a) => a.id}
          renderItem={({ item }) => <AlertRow alert={item} onDelete={handleDelete} />}
        />
      )}
    </View>
  )
}
