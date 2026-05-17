import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import Navbar from '../components/Navbar'

interface Contact {
  id: string
  name: string
  phone: string
}

export default function Contacts() {
  const navigate = useNavigate()
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Contact | null>(null)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadContacts()
  }, [])

  async function loadContacts() {
    api.get('/contacts')
      .then(res => setContacts(res.data || []))
      .catch(() => navigate('/login'))
      .finally(() => setLoading(false))
  }

  function openCreate() {
    setEditing(null)
    setName('')
    setPhone('')
    setShowForm(true)
  }

  function openEdit(c: Contact) {
    setEditing(c)
    setName(c.name)
    setPhone(c.phone)
    setShowForm(true)
  }

  function closeForm() {
    setShowForm(false)
    setEditing(null)
    setName('')
    setPhone('')
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      if (editing) {
        await api.put(`/contacts/${editing.id}`, { name, phone })
      } else {
        await api.post('/contacts', { name, phone })
      }
      await loadContacts()
      closeForm()
    } catch {
      alert('Erro ao salvar contato')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Tem certeza que deseja remover este contato?')) return
    await api.delete(`/contacts/${id}`)
    setContacts(prev => prev.filter(c => c.id !== id))
  }

  async function handleDeleteAll() {
    if (!confirm('Tem certeza que deseja remover todos os contatos?')) return
    await api.delete('/contacts')
    setContacts([])
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <Navbar />

      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Contatos</h2>
          <div className="flex gap-3">
            {contacts.length > 0 && (
              <button
                onClick={handleDeleteAll}
                className="bg-red-600 hover:bg-red-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition"
              >
                Limpar tudo
              </button>
            )}
            <label className="bg-gray-700 hover:bg-gray-600 text-white text-sm font-semibold px-4 py-2 rounded-lg cursor-pointer transition">
              Importar CSV
              <input
                type="file"
                accept=".csv"
                className="hidden"
                onChange={async e => {
                  const file = e.target.files?.[0]
                  if (!file) return
                  const form = new FormData()
                  form.append('file', file)
                  const res = await api.post('/contacts/import', form)
                  alert(`Importados: ${res.data.imported} | Pulados: ${res.data.skipped}`)
                  loadContacts()
                }}
              />
            </label>
            <button
              onClick={openCreate}
              className="bg-green-500 hover:bg-green-600 text-white text-sm font-semibold px-4 py-2 rounded-lg transition"
            >
              Novo contato
            </button>
          </div>
        </div>

        {showForm && (
          <div className="bg-gray-900 rounded-xl p-6 mb-6">
            <h3 className="text-lg font-semibold mb-4">
              {editing ? 'Editar contato' : 'Novo contato'}
            </h3>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="text-sm text-gray-400 mb-1 block">Nome</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full bg-gray-800 text-white rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Nome do contato"
                  required
                />
              </div>
              <div>
                <label className="text-sm text-gray-400 mb-1 block">Telefone</label>
                <input
                  type="text"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  className="w-full bg-gray-800 text-white rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="5521999990001"
                  required
                />
              </div>
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
        ) : contacts.length === 0 ? (
          <div className="bg-gray-900 rounded-xl p-8 text-center text-gray-400">
            Nenhum contato ainda. Crie um ou importe um CSV.
          </div>
        ) : (
          <div className="bg-gray-900 rounded-xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-800 text-left text-sm text-gray-400">
                  <th className="px-6 py-4">Nome</th>
                  <th className="px-6 py-4">Telefone</th>
                  <th className="px-6 py-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {contacts.map(c => (
                  <tr key={c.id} className="border-b border-gray-800 hover:bg-gray-800 transition">
                    <td className="px-6 py-4">{c.name}</td>
                    <td className="px-6 py-4 text-gray-400">{c.phone}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex gap-2 justify-end">
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
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}