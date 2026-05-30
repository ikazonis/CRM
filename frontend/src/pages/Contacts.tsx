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

  const isPhoneValid = (val: string) => {
    const clean = val.replace(/[\s\-\(\)]/g, '')
    return /^55[1-9][1-9]\d{8,9}$/.test(clean)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    const cleanPhone = phone.replace(/[\s\-\(\)]/g, '')
    if (!isPhoneValid(cleanPhone)) {
      alert('Telefone inválido. Deve seguir o formato: 55 + DDD + Número (ex: 552199999999 ou 5521999999999).')
      return
    }

    setSaving(true)
    try {
      if (editing) {
        await api.put(`/contacts/${editing.id}`, { name, phone: cleanPhone })
      } else {
        await api.post('/contacts', { name, phone: cleanPhone })
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

  // async function handleDeleteAll() {
  //   if (!confirm('Tem certeza que deseja remover todos os contatos?')) return
  //   await api.delete('/contacts')
  //   setContacts([])
  // }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <Navbar />

      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold tracking-wide select-none">Contatos</h2>
          <div className="flex gap-3">
            <label className="bg-gray-700 hover:bg-gray-600 active:scale-[0.98] text-white text-xs font-bold px-4 py-2.5 rounded-md cursor-pointer transition duration-150 select-none">
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
              className="bg-green-500 hover:bg-green-600 active:scale-[0.98] text-white text-xs font-bold px-4 py-2.5 rounded-md transition duration-150 cursor-pointer select-none"
            >
              Novo contato
            </button>
          </div>
        </div>

        {showForm && (
          <div className="bg-gray-900 border border-gray-800 rounded-md p-6 mb-6">
            <h3 className="text-md font-bold text-white uppercase tracking-wider mb-4">
              {editing ? 'Editar contato' : 'Novo contato'}
            </h3>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-400 mb-1 block uppercase tracking-wider">Nome</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full bg-gray-950 border border-gray-800 text-white text-sm rounded-md px-3.5 py-2.5 outline-none focus:border-gray-500 transition-all duration-200"
                  placeholder="Nome do contato"
                  required
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-400 mb-1 block uppercase tracking-wider">Telefone</label>
                <input
                  type="text"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  className="w-full bg-gray-950 border border-gray-800 text-white text-sm rounded-md px-3.5 py-2.5 outline-none focus:border-gray-500 transition-all duration-200"
                  placeholder="5521999990001"
                  required
                />
                {phone && !isPhoneValid(phone) && (
                  <p className="text-red-500 text-xs mt-1 font-semibold">
                    Formato inválido. Use: 55 + DDD + Número (ex: 552199999999)
                  </p>
                )}
              </div>
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
        ) : contacts.length === 0 ? (
          <div className="bg-gray-900 border border-gray-800 rounded-md p-8 text-center text-gray-400 text-sm font-medium">
            Nenhum contato ainda. Crie um ou importe um CSV.
          </div>
        ) : (
          <div className="bg-gray-900 border border-gray-800 rounded-md overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-800 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">
                  <th className="px-6 py-4">Nome</th>
                  <th className="px-6 py-4">Telefone</th>
                  <th className="px-6 py-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {contacts.map(c => (
                  <tr key={c.id} className="border-b border-gray-800 hover:bg-gray-950 transition duration-150">
                    <td className="px-6 py-4 text-sm font-semibold">{c.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-400 font-medium">{c.phone}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => openEdit(c)}
                          className="text-xs font-semibold bg-gray-700 hover:bg-gray-600 active:scale-[0.96] text-white px-3.5 py-1.5 rounded-md transition duration-150 cursor-pointer select-none"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleDelete(c.id)}
                          className="text-xs font-semibold bg-red-950/40 hover:bg-red-900/60 active:scale-[0.96] text-red-400 px-3.5 py-1.5 rounded-md transition duration-150 cursor-pointer select-none border border-red-900/30"
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