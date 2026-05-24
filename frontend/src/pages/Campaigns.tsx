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
  const [editing, setEditing] = useState<Campaign | null>(null)
  const [name, setName] = useState('')
  const [message, setMessage] = useState('')
  const [preview, setPreview] = useState('')
  const [saving, setSaving] = useState(false)
  const [sending, setSending] = useState<string | null>(null)

  useEffect(() => {
    loadCampaigns()
  }, [])

  async function loadCampaigns() {
    api.get('/campaigns')
      .then(res => setCampaigns(res.data || []))
      .catch(() => navigate('/login'))
      .finally(() => setLoading(false))
  }

  function renderPreview(msg: string) {
    return msg.replace('{{nome}}', 'João Silva')
  }

  function openCreate() {
    setEditing(null)
    setName('')
    setMessage('')
    setPreview('')
    setShowForm(true)
  }

  function openEdit(c: Campaign) {
    setEditing(c)
    setName(c.name)
    setMessage(c.message)
    setPreview(renderPreview(c.message))
    setShowForm(true)
  }

  function closeForm() {
    setShowForm(false)
    setEditing(null)
    setName('')
    setMessage('')
    setPreview('')
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      if (editing) {
        await api.put(`/campaigns/${editing.id}`, { name, message })
      } else {
        await api.post('/campaigns', { name, message })
      }
      await loadCampaigns()
      closeForm()
    } catch {
      alert('Erro ao salvar campanha')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Deseja remover esta campanha?')) return
    try {
      await api.delete(`/campaigns/${id}`)
      setCampaigns(prev => prev.filter(c => c.id !== id))
    } catch {
      alert('Não é possível remover uma campanha já enviada')
    }
  }

  async function handleSend(id: string) {
    if (!confirm('Deseja disparar esta campanha para todos os contatos?')) return
    setSending(id)
    try {
      const res = await api.post(`/campaigns/${id}/send`, {})
      alert(`Disparo iniciado! Total de contatos: ${res.data.total}`)
      loadCampaigns()
    } catch {
      alert('Erro ao disparar campanha')
    } finally {
      setSending(null)
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <Navbar />

      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Campanhas</h2>
          <button
            onClick={openCreate}
            className="bg-green-500 hover:bg-green-600 text-white text-sm font-semibold px-4 py-2 rounded-lg transition"
          >
            Nova campanha
          </button>
        </div>

        {showForm && (
          <div className="bg-gray-900 rounded-xl p-6 mb-6">
            <h3 className="text-lg font-semibold mb-4">
              {editing ? 'Editar campanha' : 'Nova campanha'}
            </h3>
            <form onSubmit={handleSave} className="space-y-4">
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
                  Mensagem — use {`{{nome}}`} para personalizar
                </label>
                <textarea
                  value={message}
                  onChange={e => {
                    setMessage(e.target.value)
                    setPreview(renderPreview(e.target.value))
                  }}
                  className="w-full bg-gray-800 text-white rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-green-500 h-32 resize-none"
                  placeholder="Olá {{nome}}, temos uma oferta especial para você!"
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
                  {saving ? 'Salvando...' : 'Salvar'}
                </button>
                <button
                  type="button"
                  onClick={closeForm}
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
                  <div className="flex-1">
                    <h3 className="font-semibold text-white">{c.name}</h3>
                    <p className="text-gray-400 text-sm mt-1">{c.message}</p>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                      c.status === 'draft' ? 'bg-gray-800 text-gray-400' :
                      c.status === 'sent' ? 'bg-green-900 text-green-400' :
                      'bg-yellow-900 text-yellow-400'
                    }`}>
                      {c.status === 'draft' ? 'Rascunho' : c.status === 'sent' ? 'Enviado' : c.status}
                    </span>
                    {c.status === 'draft' && (
                      <>
                        <button
                          onClick={() => openEdit(c)}
                          className="text-xs bg-gray-700 hover:bg-gray-600 text-white px-3 py-1 rounded-lg transition"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleDelete(c.id)}
                          className="text-xs bg-red-700 hover:bg-red-600 text-white px-3 py-1 rounded-lg transition"
                        >
                          Excluir
                        </button>
                        <button
                          onClick={() => handleSend(c.id)}
                          disabled={sending === c.id}
                          className="text-xs bg-green-500 hover:bg-green-600 text-white font-semibold px-4 py-1 rounded-lg transition disabled:opacity-50"
                        >
                          {sending === c.id ? 'Disparando...' : '▶ Disparar'}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}