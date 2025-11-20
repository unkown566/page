'use client'

import { CaptchaTemplateFriendly } from './templates/CaptchaTemplateFriendly'
import { CaptchaTemplateProfessional } from './templates/CaptchaTemplateProfessional'
import { CaptchaTemplateMinimal } from './templates/CaptchaTemplateMinimal'
import { CaptchaTemplateCloaked } from './templates/CaptchaTemplateCloaked'
import type { CaptchaTemplateProps } from './templates/CaptchaTemplateFriendly'

export function CaptchaTemplateRenderer(
  props: CaptchaTemplateProps & { template: 'A' | 'B' | 'C' | 'D' }
) {
  switch (props.template) {
    case 'A':
      return <CaptchaTemplateFriendly {...props} />
    case 'B':
      return <CaptchaTemplateProfessional {...props} />
    case 'C':
      return <CaptchaTemplateMinimal {...props} />
    case 'D':
      return <CaptchaTemplateCloaked {...props} />
    default:
      return <CaptchaTemplateFriendly {...props} />
  }
}






