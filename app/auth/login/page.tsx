import AuthLayout from '@/components/auth/AuthLayout'
import LoginForm from '@/components/auth/LoginForm'

export default function LoginPage() {
  // In real app, get this from session/cookie
  const foxId = 'fox-a1b2c3d4+192.168.1.1_fox'

  return (
    <AuthLayout
      title="Welcome Back!"
      subtitle="Sign in to your Fox account"
    >
      <LoginForm foxId={foxId} />
    </AuthLayout>
  )
}






