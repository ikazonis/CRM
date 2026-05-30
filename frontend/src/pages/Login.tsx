import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'

export default function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await api.post('/login', { email, password })
      localStorage.setItem('token', res.data.token)
      navigate('/dashboard')
    } catch {
      setError('Email ou senha inválidos')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="bg-gray-900 border border-gray-800 p-10 rounded-md w-full max-w-sm flex flex-col items-center">
        <h1 className="text-3xl font-extrabold tracking-wide text-instagram-gradient mb-2 select-none">
          CRM WhatsApp
        </h1>
        <p className="text-gray-400 text-sm mb-8 text-center font-medium">
          Entre para ver estatísticas de suas campanhas
        </p>
 
        <form onSubmit={handleSubmit} className="space-y-4 w-full">
          <div>
            <label className="text-xs font-semibold text-gray-400 mb-1 block uppercase tracking-wider">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full bg-gray-950 border border-gray-800 text-white text-sm rounded-md px-3.5 py-2.5 outline-none focus:border-gray-500 transition-all duration-200"
              placeholder="seu@email.com"
              required
            />
          </div>
 
          <div>
            <label className="text-xs font-semibold text-gray-400 mb-1 block uppercase tracking-wider">Senha</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full bg-gray-950 border border-gray-800 text-white text-sm rounded-md px-3.5 py-2.5 outline-none focus:border-gray-500 transition-all duration-200"
              placeholder="••••••••"
              required
            />
          </div>
 
          {error && <p className="text-red-500 text-xs text-center font-medium">{error}</p>}
 
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-500 hover:bg-green-600 active:scale-[0.98] text-white font-semibold text-sm py-2.5 rounded-md transition-all duration-150 disabled:opacity-50 cursor-pointer select-none"
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
 
        <div className="w-full border-t border-gray-800 my-6"></div>
 
        <p className="text-gray-400 text-sm text-center">
          Não tem uma conta?{' '}
          <a href="/register" className="text-green-400 font-bold hover:underline">
            Cadastre-se
          </a>
        </p>
      </div>
    </div>
  )
}