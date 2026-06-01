import { useCallback, useState } from 'react'
import { View, Text, FlatList, TouchableOpacity, Alert, ActivityIndicator } from 'react-native'
import { router, useFocusEffect } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import type { AlertDto, ApiResponse } from '@radock/types'
import { api } from '@/api/client'

type Tab = 'open' | 'history'

function ActiveRow({ alert, onDelete }: { alert: AlertDto; onDelete: (id: string) => void }) {
  function confirmDelete() {
    Alert.alert('Delete Alert', `Remove alert for ${alert.symbol} at $${Number(alert.targetPrice).toFixed(2)}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => onDelete(alert.id) },
    ])
  }

  return (
    <View className="flex-row items-center justify-between bg-rd-surface mx-4 my-2 px-4 py-5 rounded-2xl">
      <View className="flex-1 mr-4">
        <View className="flex-row items-center gap-x-2 mb-1.5">
          <View className="bg-rd-primary px-3 py-1 rounded-lg">
            <Text className="text-white text-sm font-bold">{alert.symbol}</Text>
          </View>
          <Text className="text-rd-text text-sm font-semibold">
            when price ≥ ${Number(alert.targetPrice).toFixed(2)}
          </Text>
        </View>
        <Text className="text-rd-muted text-xs">
          Created {new Date(alert.createdAt).toLocaleDateString()}
        </Text>
      </View>
      <TouchableOpacity onPress={confirmDelete} hitSlop={12}>
        <Ionicons name="trash-outline" size={22} color="#8A8A8A" />
      </TouchableOpacity>
    </View>
  )
}

function HistoryRow({ alert }: { alert: AlertDto }) {
  return (
    <View className="flex-row items-center justify-between bg-rd-surface mx-4 my-2 px-4 py-5 rounded-2xl">
      <View className="flex-1 mr-4">
        <View className="flex-row items-center gap-x-2 mb-1.5">
          <View className="bg-rd-surface border border-rd-border px-3 py-1 rounded-lg">
            <Text className="text-rd-muted text-sm font-bold">{alert.symbol}</Text>
          </View>
          <Text className="text-rd-text text-sm font-semibold">
            triggered at ${Number(alert.targetPrice).toFixed(2)}
          </Text>
        </View>
        <Text className="text-rd-muted text-xs">
          {alert.triggeredAt
            ? `Fired ${new Date(alert.triggeredAt).toLocaleDateString()}`
            : `Created ${new Date(alert.createdAt).toLocaleDateString()}`}
        </Text>
      </View>
      <Ionicons name="checkmark-circle" size={22} color="#25F4EE" />
    </View>
  )
}

export default function AlertsScreen() {
  const [tab, setTab] = useState<Tab>('open')
  const [alerts, setAlerts] = useState<AlertDto[]>([])
  const [loading, setLoading] = useState(true)

  const fetchAlerts = useCallback(() => {
    setLoading(true)
    const param = tab === 'history' ? '?active=false' : ''
    api.get<ApiResponse<AlertDto[]>>(`/alerts${param}`)
      .then((res) => setAlerts(res.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [tab])

  useFocusEffect(fetchAlerts)

  async function handleDelete(id: string) {
    await api.delete(`/alerts/${id}`)
    setAlerts((prev) => prev.filter((a) => a.id !== id))
  }

  return (
    <View className="flex-1 bg-rd-bg pt-16">
      {/* Header */}
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

      {/* Toggle */}
      <View className="flex-row mx-4 mb-4 bg-rd-surface rounded-xl p-1">
        {(['open', 'history'] as Tab[]).map((t) => (
          <TouchableOpacity
            key={t}
            onPress={() => setTab(t)}
            className={`flex-1 py-2 rounded-lg items-center ${tab === t ? 'bg-rd-primary' : ''}`}
          >
            <Text className={`text-sm font-semibold ${tab === t ? 'text-white' : 'text-rd-muted'}`}>
              {t === 'open' ? 'Open' : 'History'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#FE2C55" />
        </View>
      ) : alerts.length === 0 ? (
        <View className="flex-1 items-center justify-center px-8">
          <Ionicons
            name={tab === 'open' ? 'notifications-off-outline' : 'checkmark-done-outline'}
            size={48}
            color="#2A2A2A"
          />
          <Text className="text-rd-text font-semibold mt-4 text-base">
            {tab === 'open' ? 'No active alerts' : 'No triggered alerts yet'}
          </Text>
          <Text className="text-rd-muted text-sm text-center mt-1">
            {tab === 'open' ? 'Tap + to create one' : 'Alerts you set will appear here once triggered'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={alerts}
          keyExtractor={(a) => a.id}
          renderItem={({ item }) =>
            tab === 'open'
              ? <ActiveRow alert={item} onDelete={handleDelete} />
              : <HistoryRow alert={item} />
          }
        />
      )}
    </View>
  )
}
