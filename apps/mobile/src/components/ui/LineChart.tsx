import { View } from 'react-native'
import Svg, { Polyline, Line, Defs, LinearGradient, Stop, Rect } from 'react-native-svg'

interface LineChartProps {
  data: number[]
  width: number
  height: number
  color?: string
}

export function LineChart({ data, width, height, color = '#FE2C55' }: LineChartProps) {
  if (data.length < 2) return <View style={{ width, height }} />

  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1
  const padding = 8

  const xStep = (width - padding * 2) / (data.length - 1)
  const yScale = (height - padding * 2) / range

  const points = data
    .map((v, i) => {
      const x = padding + i * xStep
      const y = height - padding - (v - min) * yScale
      return `${x},${y}`
    })
    .join(' ')

  return (
    <Svg width={width} height={height}>
      <Defs>
        <LinearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={color} stopOpacity="0.15" />
          <Stop offset="1" stopColor={color} stopOpacity="0" />
        </LinearGradient>
      </Defs>
      <Rect x="0" y="0" width={width} height={height} fill="transparent" />
      <Polyline points={points} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
    </Svg>
  )
}
