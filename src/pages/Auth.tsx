import { useState, type FormEvent } from 'react'
import { ArrowRight, ShieldCheck } from 'lucide-react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useCommerce } from '../context/useCommerce'

interface AuthProps {
  mode: 'login' | 'register'
}

export default function Auth({ mode }: AuthProps) {
  const isRegister = mode === 'register'
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const { signIn } = useCommerce()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const isPartner = isRegister && searchParams.get('type') === 'partner'

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (password.length < 8) {
      setError('Use at least 8 characters for your password.')
      return
    }
    setError('')
    signIn({ name: isRegister ? name.trim() : (email.split('@')[0] || 'SAU member'), email: email.trim().toLowerCase(), role: isPartner ? 'partner' : 'customer' })
    navigate('/profile')
  }

  return <div className="auth-page">
    <div className="auth-card"><span className="auth-symbol"><ShieldCheck size={22} /></span><span className="section-kicker">{isPartner ? 'GROW YOUR WORK WITH SAU' : isRegister ? 'A GOOD PLACE TO START' : 'WELCOME BACK'}</span><h1>{isPartner ? 'Bring your work to SAU.' : isRegister ? 'Make everyday easier.' : 'Good to see you again.'}</h1><p>{isPartner ? 'Create a partner demo profile and introduce your professional services to more local customers.' : isRegister ? 'Create your SAU profile to keep your activity in one place.' : 'Sign in to see your SAU profile, orders and bookings.'}</p>
      <form className="auth-form" onSubmit={submit}>
        {isRegister && <label>Your name<input required autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} /></label>}
        <label>Email address<input required type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} /></label>
        <label>Password<input required type="password" minLength={8} autoComplete={isRegister ? 'new-password' : 'current-password'} value={password} onChange={(event) => setPassword(event.target.value)} /><small>At least 8 characters</small></label>
        {error && <p className="form-error" role="alert">{error}</p>}
        <button className="button button-primary full-button" type="submit">{isPartner ? 'Create partner demo profile' : isRegister ? 'Create demo account' : 'Sign in'} <ArrowRight size={16} /></button>
      </form>
      <p className="auth-switch">{isRegister ? 'Already have a profile?' : 'New to SAU?'} <Link to={isRegister ? '/login' : '/register'}>{isRegister ? 'Sign in' : 'Create an account'}</Link></p>
      <p className="auth-demo-note">Demo profile stored in this browser only. No authentication server is connected.</p>
    </div>
  </div>
}
