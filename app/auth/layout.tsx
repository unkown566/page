import { ThemeProvider } from '@/lib/theme/ThemeProvider'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ThemeProvider>
      {children}
    </ThemeProvider>
  )
}







