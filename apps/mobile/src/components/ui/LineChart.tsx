import { View } from 'react-native'
import Svg, { Polyline, Line, Text as SvgText } from 'react-native-svg'

interface LineChartProps {
  data: number[]
  timestamps?: number[]  // unix seconds
  width: number
  height: number
  color?: string
}

function formatDate(unix: number): string {
  const d = new Date(unix * 1000)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function formatPrice(price: number): string {
  return `$${price.toFixed(0)}`
}

export function LineChart({ data, timestamps, width, height, color = '#FE2C55' }: LineChartProps) {
  if (data.length < 2) return <View style={{ width, height }} />

  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1
  const mid = min + range / 2

  const paddingTop = 12
  const paddingBottom = 28   // space for date labels
  const paddingLeft = 8
  const paddingRight = 56    // space for price labels

  const chartWidth = width - paddingLeft - paddingRight
  const chartHeight = height - paddingTop - paddingBottom

  const xStep = chartWidth / (data.length - 1)
  const yScale = chartHeight / range

  const toX = (i: number) => paddingLeft + i * xStep
  const toY = (v: number) => paddingTop + chartHeight - (v - min) * yScale

  const points = data
    .map((v, i) => `${toX(i).toFixed(1)},${toY(v).toFixed(1)}`)
    .join(' ')

  // Y-axis reference lines: max, mid, min
  const yLabels = [
    { value: max, y: toY(max) },
    { value: mid, y: toY(mid) },
    { value: min, y: toY(min) },
  ]

  // X-axis date labels: first, middle, last
  const xLabels = (() => {
    if (!timestamps || timestamps.length < 2) return []
    const last = timestamps.length - 1
    const mid = Math.floor(last / 2)
    return [
      { i: 0,    label: formatDate(timestamps[0]) },
      { i: mid,  label: formatDate(timestamps[mid]) },
      { i: last, label: formatDate(timestamps[last]) },
    ]
  })()

  return (
    <Svg width={width} height={height}>
      {/* Horizontal reference lines */}
      {yLabels.map(({ value, y }) => (
        <Line
          key={value}
          x1={paddingLeft}
          y1={y}
          x2={paddingLeft + chartWidth}
          y2={y}
          stroke="#2A2A2A"
          strokeWidth="1"
          strokeDasharray="4,4"
        />
      ))}

      {/* Price line */}
      <Polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
      />

      {/* Y-axis price labels */}
      {yLabels.map(({ value, y }) => (
        <SvgText
          key={value}
          x={paddingLeft + chartWidth + 6}
          y={y + 4}
          fontSize="10"
          fill="#8A8A8A"
          textAnchor="start"
        >
          {formatPrice(value)}
        </SvgText>
      ))}

      {/* X-axis date labels */}
      {xLabels.map(({ i, label }) => (
        <SvgText
          key={i}
          x={toX(i)}
          y={height - 6}
          fontSize="10"
          fill="#8A8A8A"
          textAnchor={i === 0 ? 'start' : i === data.length - 1 ? 'end' : 'middle'}
        >
          {label}
        </SvgText>
      ))}
    </Svg>
  )
}
