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
          <h2 className="text-xl font-bold tracking-wide select-none">Campanhas</h2>
          <button
            onClick={openCreate}
            className="bg-green-500 hover:bg-green-600 active:scale-[0.98] text-white text-xs font-bold px-4 py-2.5 rounded-md transition duration-150 cursor-pointer select-none"
          >
            Nova campanha
          </button>
        </div>

        {showForm && (
          <div className="bg-gray-900 border border-gray-800 rounded-md p-6 mb-6">
            <h3 className="text-md font-bold text-white uppercase tracking-wider mb-4">
              {editing ? 'Editar campanha' : 'Nova campanha'}
            </h3>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-400 mb-1 block uppercase tracking-wider">Nome da campanha</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full bg-gray-950 border border-gray-800 text-white text-sm rounded-md px-3.5 py-2.5 outline-none focus:border-gray-500 transition-all duration-200"
                  placeholder="Ex: Promoção de maio"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-400 mb-1 block uppercase tracking-wider">
                  Mensagem — use {`{{nome}}`} para personalizar
                </label>
                <textarea
                  value={message}
                  onChange={e => {
                    setMessage(e.target.value)
                    setPreview(renderPreview(e.target.value))
                  }}
                  className="w-full bg-gray-950 border border-gray-800 text-white text-sm rounded-md px-3.5 py-2.5 outline-none focus:border-gray-500 h-32 resize-none transition-all duration-200"
                  placeholder="Olá {{nome}}, temos uma oferta especial para você!"
                  required
                />
              </div>

              {preview && (
                <div className="bg-gray-950 border border-gray-850 rounded-md p-4">
                  <p className="text-xs font-semibold text-gray-400 mb-1 block uppercase tracking-wider">Visualização</p>
                  <p className="text-white text-sm leading-relaxed">{preview}</p>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-green-500 hover:bg-green-600 active:scale-[0.98] text-white text-xs font-bold px-5 py-2 rounded-md transition duration-150 disabled:opacity-50 cursor-pointer select-none"
                >
                  {saving ? 'Salvando...' : 'Salvar'}
                </button>
                <button
                  type="button"
                  onClick={closeForm}
                  className="bg-gray-800 hover:bg-gray-700 active:scale-[0.98] text-white text-xs font-bold px-5 py-2 rounded-md transition duration-150 cursor-pointer select-none"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        )}

        {loading ? (
          <p className="text-gray-400 text-sm">Carregando...</p>
        ) : campaigns.length === 0 ? (
          <div className="bg-gray-900 border border-gray-800 rounded-md p-8 text-center text-gray-400 text-sm font-medium">
            Nenhuma campanha ainda. Crie sua primeira campanha!
          </div>
        ) : (
          <div className="space-y-4">
            {campaigns.map(c => (
              <div key={c.id} className="bg-gray-900 border border-gray-800 rounded-md p-6 transition duration-200 hover:border-gray-700">
                <div className="flex justify-between items-start flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <h3 className="font-bold text-white text-md tracking-wide">{c.name}</h3>
                    <p className="text-gray-400 text-sm mt-2 leading-relaxed">{c.message}</p>
                  </div>
                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <span className={`text-xs px-2.5 py-1 rounded-md font-bold uppercase tracking-wider border ${
                      c.status === 'draft' ? 'bg-gray-950 text-gray-400 border-gray-800' :
                      c.status === 'sent' ? 'bg-blue-950/40 text-blue-400 border-blue-900/30' :
                      'bg-yellow-950/40 text-yellow-500 border-yellow-900/30'
                    }`}>
                      {c.status === 'draft' ? 'Rascunho' : c.status === 'sent' ? 'Enviado' : c.status}
                    </span>
                    {c.status === 'draft' && (
                      <div className="flex gap-2 ml-2">
                        <button
                          onClick={() => openEdit(c)}
                          className="text-xs font-semibold bg-gray-700 hover:bg-gray-600 active:scale-[0.96] text-white px-3 py-1.5 rounded-md transition duration-150 cursor-pointer select-none"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleDelete(c.id)}
                          className="text-xs font-semibold bg-red-950/40 hover:bg-red-900/60 active:scale-[0.96] text-red-400 px-3 py-1.5 rounded-md transition duration-150 cursor-pointer border border-red-900/30 select-none"
                        >
                          Excluir
                        </button>
                        <button
                          onClick={() => handleSend(c.id)}
                          disabled={sending === c.id}
                          className="text-xs font-bold bg-green-500 hover:bg-green-600 active:scale-[0.96] text-white px-4 py-1.5 rounded-md transition duration-150 disabled:opacity-50 cursor-pointer select-none"
                        >
                          {sending === c.id ? 'Disparando...' : '▶ Disparar'}
                        </button>
                      </div>
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