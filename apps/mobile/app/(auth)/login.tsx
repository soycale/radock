import { useState } from 'react'
import { View, Text, KeyboardAvoidingView, Platform } from 'react-native'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useAuth } from '@/hooks/useAuth'

export default function LoginScreen() {
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleLogin() {
    setError(null)
    setLoading(true)
    try {
      await login(email, password)
    } catch {
      setError('Invalid email or password. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-rd-bg"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View className="flex-1 justify-center px-6 gap-y-8">
        <View className="gap-y-1">
          <Text className="text-rd-text text-4xl font-bold tracking-tight">Radock</Text>
          <Text className="text-rd-muted text-base">Sign in to your account</Text>
        </View>

        <View className="gap-y-4">
          <Input
            label="Email"
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            keyboardType="email-address"
          />
          <Input
            label="Password"
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            secureTextEntry
          />
          {error && (
            <Text className="text-rd-danger text-sm">{error}</Text>
          )}
        </View>

        <Button
          label="Sign In"
          onPress={handleLogin}
          loading={loading}
          fullWidth
        />
      </View>
    </KeyboardAvoidingView>
  )
}
