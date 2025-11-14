import PortalLayout from '@/components/access/PortalLayout'
import AccessForm from '@/components/access/AccessForm'

export default function AccessPage() {
  // Get from session/cookie in real app
  const memberId = 'Hello@basitkhan.design'

  return (
    <PortalLayout
      title="Welcome Back!"
      subtitle="Enter your email and password"
    >
      <AccessForm memberId={memberId} />
    </PortalLayout>
  )
}

