import { useEffect, useState } from 'react'
import { View, Text, TouchableOpacity, ActivityIndicator, useWindowDimensions, ScrollView } from 'react-native'
import { useLocalSearchParams, router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { SYMBOL_NAMES } from '@radock/types'
import type { CandleDto, ApiResponse, StockSymbol } from '@radock/types'
import { api } from '@/api/client'
import { usePricesStore } from '@/stores/prices.store'
import { LineChart } from '@/components/ui/LineChart'

type Range = '1W' | '1M' | '3M' | 'Live'

const RANGES: Range[] = ['1W', '1M', '3M', 'Live']

// Module-level cache — survives navigation, resets on app restart
const candleCache = new Map<string, CandleDto[]>()

function getRangeBounds(range: Range): { from: number; to: number } {
  const now = Math.floor(Date.now() / 1000)
  const day = 86400
  const days = range === '1W' ? 7 : range === '1M' ? 30 : 90
  return { from: now - days * day, to: now }
}

export default function StockDetailScreen() {
  const { symbol } = useLocalSearchParams<{ symbol: StockSymbol }>()
  const { width } = useWindowDimensions()
  const price = usePricesStore((s) => s.prices[symbol]?.price ?? null)
  const ticks = usePricesStore((s) => s.tickBuffer[symbol] ?? [])

  const [range, setRange] = useState<Range>('1M')
  const [candles, setCandles] = useState<CandleDto[]>([])
  const [loading, setLoading] = useState(true)

  const companyName = SYMBOL_NAMES[symbol] ?? symbol
  const isLive = range === 'Live'

  useEffect(() => {
    if (isLive) {
      setLoading(false)
      return
    }

    const cacheKey = `${symbol}_${range}`
    const cached = candleCache.get(cacheKey)
    if (cached) {
      setCandles(cached)
      setLoading(false)
      return
    }

    setLoading(true)
    const { from, to } = getRangeBounds(range)
    api
      .get<ApiResponse<{ symbol: string; candles: CandleDto[] }>>(
        `/candles/${symbol}?resolution=D&from=${from}&to=${to}`,
      )
      .then((res) => {
        candleCache.set(cacheKey, res.data.candles)
        setCandles(res.data.candles)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [symbol, range])

  const chartData = isLive ? ticks : candles.map((c) => c.close)
  const timestamps = isLive ? undefined : candles.map((c) => c.time)

  const firstVal = chartData[0] ?? 0
  const lastVal = chartData[chartData.length - 1] ?? 0
  const isPositive = lastVal >= firstVal
  const changePercent = firstVal !== 0 ? ((lastVal - firstVal) / firstVal) * 100 : 0
  const chartColor = isPositive ? '#25F4EE' : '#FE2C55'

  return (
    <ScrollView className="flex-1 bg-rd-bg" contentContainerStyle={{ paddingBottom: 40 }}>
      {/* Header */}
      <View className="flex-row items-center px-4 pt-16 pb-4">
        <TouchableOpacity onPress={() => router.back()} className="mr-3">
          <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <View className="flex-1">
          <Text className="text-rd-text text-xl font-bold">{symbol}</Text>
          <Text className="text-rd-muted text-xs">{companyName}</Text>
        </View>
      </View>

      {/* Live price */}
      <View className="px-4 mb-6">
        <Text className="text-rd-text text-4xl font-bold">
          {price !== null ? `$${price.toFixed(2)}` : '—'}
        </Text>
        <Text className={`text-sm font-semibold mt-1 ${isPositive ? 'text-rd-success' : 'text-rd-danger'}`}>
          {isPositive ? '▲' : '▼'} {Math.abs(changePercent).toFixed(2)}%
          {!isLive && ` (${range})`}
        </Text>
      </View>

      {/* Range pills */}
      <View className="flex-row px-4 gap-x-2 mb-4">
        {RANGES.map((r) => (
          <TouchableOpacity
            key={r}
            onPress={() => setRange(r)}
            className={`px-4 py-1.5 rounded-full ${range === r ? 'bg-rd-primary' : 'bg-rd-surface'}`}
          >
            <Text className={`text-sm font-semibold ${range === r ? 'text-white' : 'text-rd-muted'}`}>
              {r}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Chart */}
      <View className="mx-4 bg-rd-surface rounded-2xl p-4">
        {loading ? (
          <View style={{ height: 200 }} className="items-center justify-center">
            <ActivityIndicator color="#FE2C55" />
          </View>
        ) : isLive && ticks.length < 2 ? (
          <View style={{ height: 200 }} className="items-center justify-center">
            <Ionicons name="radio-outline" size={32} color="#2A2A2A" />
            <Text className="text-rd-muted text-sm mt-3">Waiting for market data...</Text>
            <Text className="text-rd-muted text-xs mt-1">Live during US market hours</Text>
          </View>
        ) : chartData.length < 2 ? (
          <View style={{ height: 200 }} className="items-center justify-center">
            <Text className="text-rd-muted text-sm">No data available</Text>
          </View>
        ) : (
          <LineChart
            data={chartData}
            timestamps={timestamps}
            width={width - 64}
            height={200}
            color={chartColor}
          />
        )}
      </View>

      {/* Set Alert button */}
      <TouchableOpacity
        onPress={() => router.push({ pathname: '/(app)/alerts/new' as any, params: { symbol } })}
        className="mx-4 mt-6 bg-rd-primary py-4 rounded-xl items-center"
      >
        <Text className="text-white font-bold text-base">Set Alert</Text>
      </TouchableOpacity>
    </ScrollView>
  )
}
