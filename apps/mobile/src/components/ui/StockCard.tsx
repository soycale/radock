import { memo } from 'react'
import { TouchableOpacity, View, Text } from 'react-native'
import type { StockSymbol } from '@radock/types'
import { usePricesStore } from '@/stores/prices.store'

interface StockCardProps {
  symbol: StockSymbol
  companyName: string
  changePercent: number | null
  onPress: () => void
}

export const StockCard = memo(function StockCard({ symbol, companyName, changePercent, onPress }: StockCardProps) {
  const price = usePricesStore((s) => s.prices[symbol]?.price ?? null)

  const isPositive = changePercent !== null && changePercent >= 0
  const changeColor = changePercent === null ? 'text-rd-muted' : isPositive ? 'text-rd-success' : 'text-rd-danger'
  const arrow = changePercent === null ? '' : isPositive ? '▲' : '▼'

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      className="flex-row items-center justify-between bg-rd-surface mx-4 my-1.5 px-4 py-4 rounded-xl"
    >
      <View>
        <Text className="text-rd-text text-base font-bold">{symbol}</Text>
        <Text className="text-rd-muted text-xs mt-0.5">{companyName}</Text>
      </View>

      <View className="items-end">
        <Text className="text-rd-text text-base font-semibold">
          {price !== null ? `$${price.toFixed(2)}` : '—'}
        </Text>
        <Text className={`text-xs mt-0.5 font-medium ${changeColor}`}>
          {changePercent !== null ? `${arrow} ${Math.abs(changePercent).toFixed(2)}%` : '—'}
        </Text>
      </View>
    </TouchableOpacity>
  )
})
