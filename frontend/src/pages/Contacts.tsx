import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import Navbar from '../components/Navbar'

interface Contact {
  id: string
  name: string
  phone: string
  email?: string
  birth_date?: string
  gender?: string
  is_vip: boolean
  zipcode?: string
  address?: string
  city?: string
  state?: string
}

const emptyForm = {
  name: '',
  phone: '',
  email: '',
  birth_date: '',
  gender: '',
  is_vip: false,
  zipcode: '',
  address: '',
  city: '',
  state: '',
}

type FormState = typeof emptyForm

export default function Contacts() {
  const navigate = useNavigate()
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Contact | null>(null)
  const [form, setForm] = useState<FormState>(emptyForm)
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

  function set(field: keyof FormState) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm(prev => ({ ...prev, [field]: e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value }))
  }

  function openCreate() {
    setEditing(null)
    setForm(emptyForm)
    setShowForm(true)
  }

  function openEdit(c: Contact) {
    setEditing(c)
    setForm({
      name: c.name,
      phone: c.phone,
      email: c.email ?? '',
      birth_date: c.birth_date ?? '',
      gender: c.gender ?? '',
      is_vip: c.is_vip,
      zipcode: c.zipcode ?? '',
      address: c.address ?? '',
      city: c.city ?? '',
      state: c.state ?? '',
    })
    setShowForm(true)
  }

  function closeForm() {
    setShowForm(false)
    setEditing(null)
    setForm(emptyForm)
  }

  const isPhoneValid = (val: string) => {
    const clean = val.replace(/[\s\-\(\)]/g, '')
    return /^55[1-9][1-9]\d{8,9}$/.test(clean)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    const cleanPhone = form.phone.replace(/[\s\-\(\)]/g, '')
    if (!isPhoneValid(cleanPhone)) {
      alert('Telefone inválido. Use: 55 + DDD + Número (ex: 552199999999).')
      return
    }

    const payload = {
      name: form.name,
      phone: cleanPhone,
      email: form.email || null,
      birth_date: form.birth_date || null,
      gender: form.gender || null,
      is_vip: form.is_vip,
      zipcode: form.zipcode || null,
      address: form.address || null,
      city: form.city || null,
      state: form.state || null,
    }

    setSaving(true)
    try {
      if (editing) {
        await api.put(`/contacts/${editing.id}`, payload)
      } else {
        await api.post('/contacts', payload)
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

  const inputClass = 'w-full bg-gray-950 border border-gray-800 text-white text-sm rounded-md px-3.5 py-2.5 outline-none focus:border-gray-500 transition-all duration-200'
  const labelClass = 'text-xs font-semibold text-gray-400 mb-1 block uppercase tracking-wider'

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
                  const fd = new FormData()
                  fd.append('file', file)
                  const res = await api.post('/contacts/import', fd)
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
            <h3 className="text-md font-bold text-white uppercase tracking-wider mb-5">
              {editing ? 'Editar contato' : 'Novo contato'}
            </h3>
            <form onSubmit={handleSave} className="space-y-4">

              {/* Nome + Telefone */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Nome</label>
                  <input type="text" value={form.name} onChange={set('name')} className={inputClass} placeholder="Nome do contato" required />
                </div>
                <div>
                  <label className={labelClass}>Telefone</label>
                  <input type="text" value={form.phone} onChange={set('phone')} className={inputClass} placeholder="5521999990001" required />
                  {form.phone && !isPhoneValid(form.phone) && (
                    <p className="text-red-500 text-xs mt-1 font-semibold">
                      Formato inválido. Use: 55 + DDD + Número
                    </p>
                  )}
                </div>
              </div>

              {/* Email + Data de nascimento */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>E-mail</label>
                  <input type="email" value={form.email} onChange={set('email')} className={inputClass} placeholder="email@exemplo.com" />
                </div>
                <div>
                  <label className={labelClass}>Data de nascimento</label>
                  <input type="date" value={form.birth_date} onChange={set('birth_date')} className={inputClass} />
                </div>
              </div>

              {/* Gênero + VIP */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Gênero</label>
                  <select value={form.gender} onChange={set('gender')} className={inputClass}>
                    <option value="">Não informado</option>
                    <option value="masculino">Masculino</option>
                    <option value="feminino">Feminino</option>
                    <option value="outro">Outro</option>
                  </select>
                </div>
                <div className="flex items-center gap-3 pt-6">
                  <input
                    id="is_vip"
                    type="checkbox"
                    checked={form.is_vip}
                    onChange={set('is_vip')}
                    className="w-4 h-4 accent-yellow-400 cursor-pointer"
                  />
                  <label htmlFor="is_vip" className="text-sm font-semibold text-yellow-400 cursor-pointer select-none">
                    Cliente VIP
                  </label>
                </div>
              </div>

              {/* CEP + Estado + Cidade */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className={labelClass}>CEP</label>
                  <input type="text" value={form.zipcode} onChange={set('zipcode')} className={inputClass} placeholder="00000-000" maxLength={9} />
                </div>
                <div>
                  <label className={labelClass}>Estado (UF)</label>
                  <input type="text" value={form.state} onChange={set('state')} className={inputClass} placeholder="SP" maxLength={2} />
                </div>
                <div>
                  <label className={labelClass}>Cidade</label>
                  <input type="text" value={form.city} onChange={set('city')} className={inputClass} placeholder="São Paulo" />
                </div>
              </div>

              {/* Endereço */}
              <div>
                <label className={labelClass}>Endereço</label>
                <input type="text" value={form.address} onChange={set('address')} className={inputClass} placeholder="Rua, número, complemento" />
              </div>

              <div className="flex gap-3 pt-1">
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
                  <th className="px-6 py-4">E-mail</th>
                  <th className="px-6 py-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {contacts.map(c => (
                  <tr key={c.id} className="border-b border-gray-800 hover:bg-gray-950 transition duration-150">
                    <td className="px-6 py-4 text-sm font-semibold">
                      <span>{c.name}</span>
                      {c.is_vip && (
                        <span className="ml-2 text-xs font-bold text-yellow-400 bg-yellow-400/10 px-1.5 py-0.5 rounded">VIP</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-400 font-medium">{c.phone}</td>
                    <td className="px-6 py-4 text-sm text-gray-400 font-medium">{c.email ?? '—'}</td>
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
