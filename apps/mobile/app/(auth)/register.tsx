import { useState } from 'react'
import { View, Text, KeyboardAvoidingView, Platform, TouchableOpacity } from 'react-native'
import { router } from 'expo-router'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useAuthStore } from '@/stores/auth.store'

export default function RegisterScreen() {
  const register = useAuthStore((s) => s.register)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleRegister() {
    setError(null)
    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }
    setLoading(true)
    try {
      await register(email, password)
    } catch (e: any) {
      if (e?.code === 'auth/email-already-in-use') {
        setError('An account with this email already exists.')
      } else {
        setError('Could not create account. Please try again.')
      }
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
          <Text className="text-rd-muted text-base">Create your account</Text>
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
            placeholder="Min. 6 characters"
            secureTextEntry
          />
          {error && (
            <Text className="text-rd-danger text-sm">{error}</Text>
          )}
        </View>

        <View className="gap-y-4">
          <Button label="Create Account" onPress={handleRegister} loading={loading} fullWidth />
          <TouchableOpacity onPress={() => router.back()} className="items-center">
            <Text className="text-rd-muted text-sm">
              Already have an account?{' '}
              <Text className="text-rd-primary font-semibold">Sign in</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  )
}
