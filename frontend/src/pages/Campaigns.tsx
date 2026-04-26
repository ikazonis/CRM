import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import Navbar from '../components/Navbar'

interface Campaign {
  id: string
  name: string
  message: string
  status: string
  created_at: string
}

export default function Campaigns() {
  const navigate = useNavigate()
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [message, setMessage] = useState('')
  const [preview, setPreview] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    api.get('/campaigns')
      .then(res => setCampaigns(res.data || []))
      .catch(() => navigate('/login'))
      .finally(() => setLoading(false))
  }, [])

  function renderPreview(msg: string) {
    return msg.replace('{{nome}}', 'João Silva')
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await api.post('/campaigns', { name, message })
      setCampaigns(prev => [res.data, ...prev])
      setName('')
      setMessage('')
      setPreview('')
      setShowForm(false)
    } catch {
      alert('Erro ao criar campanha')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <Navbar />

      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Campanhas</h2>
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-green-500 hover:bg-green-600 text-white text-sm font-semibold px-4 py-2 rounded-lg transition"
          >
            Nova campanha
          </button>
        </div>

        {showForm && (
          <div className="bg-gray-900 rounded-xl p-6 mb-6">
            <h3 className="text-lg font-semibold mb-4">Nova campanha</h3>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="text-sm text-gray-400 mb-1 block">Nome da campanha</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full bg-gray-800 text-white rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Ex: Promoção de maio"
                  required
                />
              </div>

              <div>
                <label className="text-sm text-gray-400 mb-1 block">
                  Mensagem — use nome para personalizar
                </label>
                <textarea
                  value={message}
                  onChange={e => {
                    setMessage(e.target.value)
                    setPreview(renderPreview(e.target.value))
                  }}
                  className="w-full bg-gray-800 text-white rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-green-500 h-32 resize-none"
                  placeholder="Olá, temos uma oferta especial para você!"
                  required
                />
              </div>

              {preview && (
                <div className="bg-gray-800 rounded-lg p-4">
                  <p className="text-xs text-gray-400 mb-2">Preview:</p>
                  <p className="text-white text-sm">{preview}</p>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-green-500 hover:bg-green-600 text-white font-semibold px-6 py-2 rounded-lg transition disabled:opacity-50"
                >
                  {saving ? 'Salvando...' : 'Criar campanha'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="bg-gray-800 hover:bg-gray-700 text-white font-semibold px-6 py-2 rounded-lg transition"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        )}

        {loading ? (
          <p className="text-gray-400">Carregando...</p>
        ) : campaigns.length === 0 ? (
          <div className="bg-gray-900 rounded-xl p-8 text-center text-gray-400">
            Nenhuma campanha ainda. Crie sua primeira campanha!
          </div>
        ) : (
          <div className="space-y-4">
            {campaigns.map(c => (
              <div key={c.id} className="bg-gray-900 rounded-xl p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-white">{c.name}</h3>
                    <p className="text-gray-400 text-sm mt-1">{c.message}</p>
                  </div>
                  <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                    c.status === 'draft' ? 'bg-gray-800 text-gray-400' :
                    c.status === 'sent' ? 'bg-green-900 text-green-400' :
                    'bg-yellow-900 text-yellow-400'
                  }`}>
                    {c.status === 'draft' ? 'Rascunho' : c.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}