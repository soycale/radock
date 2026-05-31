import { ActivityIndicator, Pressable, Text } from 'react-native'

interface ButtonProps {
  label: string
  onPress: () => void
  variant?: 'primary' | 'secondary'
  loading?: boolean
  disabled?: boolean
  fullWidth?: boolean
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  fullWidth = false,
}: ButtonProps) {
  const isDisabled = disabled || loading

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      className={[
        'h-14 rounded-xl items-center justify-center px-6',
        fullWidth ? 'w-full' : 'self-start',
        variant === 'primary'
          ? 'bg-rd-primary'
          : 'bg-transparent border border-rd-border',
        isDisabled ? 'opacity-50' : 'opacity-100',
      ].join(' ')}
    >
      {loading ? (
        <ActivityIndicator color="#FFFFFF" />
      ) : (
        <Text
          className={[
            'text-base font-bold tracking-wide',
            variant === 'primary' ? 'text-white' : 'text-rd-text',
          ].join(' ')}
        >
          {label}
        </Text>
      )}
    </Pressable>
  )
}
