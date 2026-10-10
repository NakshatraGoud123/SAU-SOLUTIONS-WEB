import { useState, type FormEvent } from 'react'
import { ArrowRight, ShieldCheck } from 'lucide-react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useCommerce } from '../context/useCommerce'
import { loginWithEmail, registerWithEmail, resetPassword } from '../services/authService'

interface AuthProps {
  mode: 'login' | 'register'
}

export default function Auth({ mode }: AuthProps) {
  const isRegister = mode === 'register'
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const { signIn } = useCommerce()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const isPartner = isRegister && searchParams.get('type') === 'partner'

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (password.length < 8) {
      setError('Use at least 8 characters for your password.')
      return
    }
    setError('')
    setMessage('')
    setBusy(true)

    try {
      const result = isRegister
        ? await registerWithEmail({ name: name.trim(), email: email.trim().toLowerCase(), password, role: isPartner ? 'partner' : 'customer' })
        : await loginWithEmail({ email: email.trim().toLowerCase(), password })

      if (!result.success) {
        setError(result.message)
        setBusy(false)
        return
      }

      if (!result.profile) {
        setMessage(result.message)
        return
      }

      const profile = result.profile
      signIn({ id: profile.user_id, name: profile.full_name, email: profile.email, role: profile.role })
      setMessage(result.message)
      navigate('/profile')
    } catch {
      setError('Unable to complete authentication. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  async function handleForgotPassword() {
    if (!email.trim()) {
      setError('Enter your email address first.')
      return
    }

    const result = await resetPassword(email.trim().toLowerCase())
    setMessage(result.message)
    setError(result.success ? '' : result.message)
  }

  return <div className="auth-page">
    <div className="auth-card"><span className="auth-symbol"><ShieldCheck size={22} /></span><span className="section-kicker">{isPartner ? 'GROW YOUR WORK WITH SAU' : isRegister ? 'A GOOD PLACE TO START' : 'WELCOME BACK'}</span><h1>{isPartner ? 'Bring your work to SAU.' : isRegister ? 'Make everyday easier.' : 'Good to see you again.'}</h1><p>{isPartner ? 'Create a partner account and introduce your professional services to more local customers.' : isRegister ? 'Create your SAU profile to keep your activity in one place.' : 'Sign in to see your SAU profile, orders and bookings.'}</p>
      <form className="auth-form" onSubmit={submit}>
        {isRegister && <label>Your name<input required autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} /></label>}
        <label>Email address<input required type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} /></label>
        <label>Password<input required type="password" minLength={8} autoComplete={isRegister ? 'new-password' : 'current-password'} value={password} onChange={(event) => setPassword(event.target.value)} /><small>At least 8 characters</small></label>
        {error && <p className="form-error" role="alert">{error}</p>}
        {message && !error && <p className="form-success" role="status">{message}</p>}
        <button className="button button-primary full-button" type="submit" disabled={busy}>{busy ? 'Please wait...' : isPartner ? 'Create partner account' : isRegister ? 'Create account' : 'Sign in'} <ArrowRight size={16} /></button>
        {!isRegister && <button type="button" className="button button-outline full-button" onClick={() => void handleForgotPassword()}>Forgot password</button>}
      </form>
      <p className="auth-switch">{isRegister ? 'Already have a profile?' : 'New to SAU?'} <Link to={isRegister ? '/login' : '/register'}>{isRegister ? 'Sign in' : 'Create an account'}</Link></p>
      <p className="auth-demo-note">Your account is protected by Supabase authentication.</p>
    </div>
  </div>
}
