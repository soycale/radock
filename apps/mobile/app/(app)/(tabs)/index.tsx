import { useCallback, useEffect, useState } from 'react'
import { View, Text, FlatList, ActivityIndicator } from 'react-native'
import { router } from 'expo-router'
import { TRACKED_SYMBOLS, SYMBOL_NAMES } from '@radock/types'
import type { StockQuoteDto, ApiResponse, StockSymbol } from '@radock/types'
import { api } from '@/api/client'
import { usePricesStore } from '@/stores/prices.store'
import { StockCard } from '@/components/ui/StockCard'

export default function MarketsScreen() {
  const [quotes, setQuotes] = useState<Record<string, StockQuoteDto>>({})
  const [loading, setLoading] = useState(true)
  const seedPrice = usePricesStore((s) => s.seedPrice)

  useEffect(() => {
    api.get<ApiResponse<StockQuoteDto[]>>('/quotes')
      .then((res) => {
        const map: Record<string, StockQuoteDto> = {}
        for (const q of res.data) {
          map[q.symbol] = q
          // Seed the prices store with initial REST data so cards show price immediately
          seedPrice({ symbol: q.symbol as StockSymbol, price: q.price, timestamp: Date.now() })
        }
        setQuotes(map)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const renderItem = useCallback(({ item: symbol }: { item: StockSymbol }) => {
    const quote = quotes[symbol]
    return (
      <StockCard
        symbol={symbol}
        companyName={SYMBOL_NAMES[symbol]}
        changePercent={quote?.changePercent ?? null}
        onPress={() => router.push({ pathname: '/(app)/stock/[symbol]' as any, params: { symbol } })}
      />
    )
  }, [quotes])

  return (
    <View className="flex-1 bg-rd-bg pt-16">
      <View className="px-4 mb-4">
        <Text className="text-rd-muted text-xs font-semibold tracking-widest uppercase">Radock</Text>
        <Text className="text-rd-text text-2xl font-bold mt-0.5">Markets</Text>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#FE2C55" />
        </View>
      ) : (
        <FlatList
          data={TRACKED_SYMBOLS}
          keyExtractor={(item) => item}
          renderItem={renderItem}
          ListFooterComponent={
            <Text className="text-rd-muted text-xs text-center mt-4 mb-8">
              More coming soon...
            </Text>
          }
        />
      )}
    </View>
  )
}
