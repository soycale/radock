import { KeyboardTypeOptions, Text, TextInput, View } from 'react-native'

interface InputProps {
  label: string
  value: string
  onChangeText: (v: string) => void
  placeholder?: string
  error?: string
  secureTextEntry?: boolean
  keyboardType?: KeyboardTypeOptions
}

export function Input({
  label,
  value,
  onChangeText,
  placeholder,
  error,
  secureTextEntry = false,
  keyboardType = 'default',
}: InputProps) {
  return (
    <View className="w-full gap-y-1.5">
      <Text className="text-rd-muted text-xs font-semibold uppercase tracking-widest">
        {label}
      </Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#8A8A8A"
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        className={[
          'h-14 rounded-xl px-4 bg-rd-surface text-rd-text text-base',
          error ? 'border border-rd-danger' : 'border border-rd-border',
        ].join(' ')}
      />
      {error && (
        <Text className="text-rd-danger text-xs">{error}</Text>
      )}
    </View>
  )
}
