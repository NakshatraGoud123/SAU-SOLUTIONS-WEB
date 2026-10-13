import { MessageCircle } from 'lucide-react'

const WHATSAPP_URL = 'https://wa.me/919963182721?text=Hello%20SAU%20SOLUTIONS%2C%20I%20would%20like%20to%20know%20more%20about%20your%20services.'

export default function WhatsAppButton() {
  return (
    <a
      className="whatsapp-float"
      href={WHATSAPP_URL}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Contact SAU SOLUTIONS on WhatsApp"
    >
      <MessageCircle size={21} aria-hidden="true" />
      <span>WhatsApp</span>
    </a>
  )
}
