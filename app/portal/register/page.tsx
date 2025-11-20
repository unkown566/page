import PortalLayout from '@/components/access/PortalLayout'
import RegisterForm from '@/components/access/RegisterForm'

export default function RegisterPage() {
  return (
    <PortalLayout
      title="Sign up"
      subtitle="Welcome to the Smart Site System for Oil Depots. Register as a member to experience."
    >
      <RegisterForm />
    </PortalLayout>
  )
}







