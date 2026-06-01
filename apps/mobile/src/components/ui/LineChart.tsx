import { View } from 'react-native'
import Svg, { Polyline, Line, Text as SvgText, Defs, LinearGradient, Stop, Path, Circle } from 'react-native-svg'

interface LineChartProps {
  data: number[]
  timestamps?: number[]  // unix seconds — omit for live mode
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

  const paddingTop = 16
  const paddingBottom = timestamps ? 28 : 12
  const paddingLeft = 8
  const paddingRight = 56

  const chartWidth = width - paddingLeft - paddingRight
  const chartHeight = height - paddingTop - paddingBottom

  const xStep = chartWidth / (data.length - 1)
  const yScale = chartHeight / range

  const toX = (i: number) => paddingLeft + i * xStep
  const toY = (v: number) => paddingTop + chartHeight - (v - min) * yScale

  const points = data
    .map((v, i) => `${toX(i).toFixed(1)},${toY(v).toFixed(1)}`)
    .join(' ')

  // Closed path for gradient area fill
  const areaPath = [
    `M ${toX(0).toFixed(1)} ${toY(data[0]).toFixed(1)}`,
    ...data.slice(1).map((v, i) => `L ${toX(i + 1).toFixed(1)} ${toY(v).toFixed(1)}`),
    `L ${toX(data.length - 1).toFixed(1)} ${(paddingTop + chartHeight).toFixed(1)}`,
    `L ${toX(0).toFixed(1)} ${(paddingTop + chartHeight).toFixed(1)}`,
    'Z',
  ].join(' ')

  const gradientId = `grad-${color.replace('#', '')}`

  const lastX = toX(data.length - 1)
  const lastY = toY(data[data.length - 1])

  const yLabels = [
    { value: max, y: toY(max) },
    { value: mid, y: toY(mid) },
    { value: min, y: toY(min) },
  ]

  const xLabels = (() => {
    if (!timestamps || timestamps.length < 2) return []
    const last = timestamps.length - 1
    const mid = Math.floor(last / 2)
    return [
      { i: 0,   label: formatDate(timestamps[0]) },
      { i: mid, label: formatDate(timestamps[mid]) },
      { i: last, label: formatDate(timestamps[last]) },
    ]
  })()

  return (
    <Svg width={width} height={height}>
      <Defs>
        <LinearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0%" stopColor={color} stopOpacity="0.4" />
          <Stop offset="100%" stopColor={color} stopOpacity="0" />
        </LinearGradient>
      </Defs>

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

      {/* Gradient area fill */}
      <Path d={areaPath} fill={`url(#${gradientId})`} />

      {/* Glow — outer */}
      <Polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="10"
        strokeOpacity="0.05"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {/* Glow — inner */}
      <Polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="5"
        strokeOpacity="0.12"
        strokeLinejoin="round"
        strokeLinecap="round"
      />

      {/* Main line */}
      <Polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
      />

      {/* End dot — pulse ring */}
      <Circle cx={lastX} cy={lastY} r="9" fill="none" stroke={color} strokeWidth="1" strokeOpacity="0.25" />
      {/* End dot — filled */}
      <Circle cx={lastX} cy={lastY} r="4" fill={color} />

      {/* Y-axis price labels */}
      {yLabels.map(({ value, y }) => (
        <SvgText
          key={value}
          x={paddingLeft + chartWidth + 8}
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
          y={height - 4}
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
