// Honeypot system for detecting bots and crawlers
import crypto from 'crypto'

// Generate honeypot field names (looks like legitimate form fields)
export function generateHoneypotFields(): {
  name: string
  email: string
  phone: string
  comments: string
} {
  const random = Math.random().toString(36).substring(7)
  return {
    name: `hp_name_${random}`,
    email: `hp_email_${random}`,
    phone: `hp_phone_${random}`,
    comments: `hp_comments_${random}`,
  }
}

// Check if honeypot fields were filled (bots will fill them)
export function checkHoneypot(formData: FormData): boolean {
  const honeypotFields = ['hp_name', 'hp_email', 'hp_phone', 'hp_comments']
  
  for (const field of honeypotFields) {
    const value = formData.get(field)
    if (value && value.toString().trim() !== '') {
      return true // Honeypot triggered - bot detected
    }
  }
  
  return false // Honeypot not triggered
}

// Generate invisible CSS honeypot field
export function generateHoneypotCSS(): string {
  return `
    .hp-field {
      position: absolute;
      left: -9999px;
      width: 1px;
      height: 1px;
      opacity: 0;
      pointer-events: none;
      visibility: hidden;
    }
  `
}

// Generate honeypot HTML fields
export function generateHoneypotHTML(): string {
  const fields = generateHoneypotFields()
  return `
    <input type="text" name="${fields.name}" class="hp-field" autocomplete="off" tabindex="-1" aria-hidden="true">
    <input type="email" name="${fields.email}" class="hp-field" autocomplete="off" tabindex="-1" aria-hidden="true">
    <input type="tel" name="${fields.phone}" class="hp-field" autocomplete="off" tabindex="-1" aria-hidden="true">
    <textarea name="${fields.comments}" class="hp-field" autocomplete="off" tabindex="-1" aria-hidden="true"></textarea>
  `
}






