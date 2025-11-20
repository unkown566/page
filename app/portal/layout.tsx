import { ThemeProvider } from '@/lib/theme/ThemeProvider'

export default function PortalLayout({
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







