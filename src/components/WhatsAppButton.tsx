import { MessageCircle } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function WhatsAppButton() {
  return (
    <Link className="contact-float" to="/contact" aria-label="Open contact page for email and WhatsApp options">
      <MessageCircle size={21} aria-hidden="true" />
      <span>Contact</span>
    </Link>
  )
}
