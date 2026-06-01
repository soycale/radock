import { useEffect, useRef, useState } from 'react'
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import * as Notifications from 'expo-notifications'
import { TRACKED_SYMBOLS, SYMBOL_NAMES } from '@radock/types'
import type { StockSymbol, ApiResponse, AlertDto } from '@radock/types'
import { api } from '@/api/client'
import { Input } from '@/components/ui/Input'

export default function NewAlertScreen() {
  const { symbol: paramSymbol } = useLocalSearchParams<{ symbol?: string }>()

  const [symbol, setSymbol] = useState<StockSymbol | null>(
    (paramSymbol as StockSymbol) ?? null,
  )
  const [targetPrice, setTargetPrice] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const pickerRef = useRef<ScrollView>(null)

  // Scroll to the pre-selected symbol so it's visible without manual scrolling
  useEffect(() => {
    if (!paramSymbol) return
    const idx = TRACKED_SYMBOLS.indexOf(paramSymbol as StockSymbol)
    if (idx <= 0) return
    // Each chip is ~100px wide + 8px gap
    setTimeout(() => pickerRef.current?.scrollTo({ x: idx * 108, animated: false }), 50)
  }, [])

  async function handleSubmit() {
    setError('')

    if (!symbol) {
      setError('Please select a symbol')
      return
    }
    const price = parseFloat(targetPrice)
    if (!targetPrice || isNaN(price) || price <= 0) {
      setError('Enter a valid target price greater than 0')
      return
    }

    setLoading(true)
    try {
      const { data: tokenData } = await Notifications.getDevicePushTokenAsync()
      await api.post<ApiResponse<AlertDto>>('/alerts', {
        symbol,
        targetPrice: price,
        fcmToken: tokenData,
      })
      router.replace('/(app)/(tabs)/alerts')
    } catch (err: any) {
      setError(err.message ?? 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <ScrollView
      className="flex-1 bg-rd-bg"
      contentContainerStyle={{ paddingBottom: 40 }}
      keyboardShouldPersistTaps="handled"
    >
      {/* Header */}
      <View className="flex-row items-center px-4 pt-16 pb-6">
        <TouchableOpacity onPress={() => router.back()} className="mr-3">
          <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <View>
          <Text className="text-rd-muted text-xs font-semibold tracking-widest uppercase">New Alert</Text>
          <Text className="text-rd-text text-xl font-bold mt-0.5">Set Price Alert</Text>
        </View>
      </View>

      {/* Symbol picker */}
      <View className="px-4 mb-6">
        <Text className="text-rd-muted text-xs font-semibold tracking-widest uppercase mb-3">Symbol</Text>
        <ScrollView ref={pickerRef} horizontal showsHorizontalScrollIndicator={false}>
          <View className="flex-row gap-x-2">
            {TRACKED_SYMBOLS.map((s) => {
              const selected = symbol === s
              return (
                <TouchableOpacity
                  key={s}
                  onPress={() => setSymbol(s)}
                  className={`px-4 py-2 rounded-xl border ${
                    selected
                      ? 'bg-rd-primary border-rd-primary'
                      : 'bg-rd-surface border-rd-border'
                  }`}
                >
                  <Text className={`font-bold text-sm ${selected ? 'text-white' : 'text-rd-muted'}`}>
                    {s}
                  </Text>
                  <Text className={`text-xs ${selected ? 'text-white opacity-80' : 'text-rd-muted opacity-60'}`}>
                    {SYMBOL_NAMES[s]}
                  </Text>
                </TouchableOpacity>
              )
            })}
          </View>
        </ScrollView>
      </View>

      {/* Target price */}
      <View className="px-4 mb-6">
        <Input
          label="Target Price (USD)"
          value={targetPrice}
          onChangeText={setTargetPrice}
          placeholder="e.g. 195.00"
          keyboardType="decimal-pad"
        />
      </View>

      {/* Error */}
      {error ? (
        <Text className="text-rd-danger text-sm px-4 mb-4">{error}</Text>
      ) : null}

      {/* Submit */}
      <View className="px-4">
        <TouchableOpacity
          onPress={handleSubmit}
          disabled={loading}
          className={`py-4 rounded-xl items-center ${loading ? 'bg-rd-surface' : 'bg-rd-primary'}`}
        >
          {loading ? (
            <ActivityIndicator color="#FE2C55" />
          ) : (
            <Text className="text-white font-bold text-base">Create Alert</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  )
}
