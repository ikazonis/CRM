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

  useEffect(() => {
    api.get('/contacts')
      .then(res => setContacts(res.data || []))
      .catch(() => navigate('/login'))
      .finally(() => setLoading(false))
  }, [])

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
                Limpar contatos
              </button>
            )}
            <label className="bg-green-500 hover:bg-green-600 text-white text-sm font-semibold px-4 py-2 rounded-lg cursor-pointer transition">
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
                  const updated = await api.get('/contacts')
                  setContacts(updated.data || [])
                }}
              />
            </label>
          </div>
        </div>

        {loading ? (
          <p className="text-gray-400">Carregando...</p>
        ) : contacts.length === 0 ? (
          <div className="bg-gray-900 rounded-xl p-8 text-center text-gray-400">
            Nenhum contato ainda. Importe um CSV para começar.
          </div>
        ) : (
          <div className="bg-gray-900 rounded-xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-800 text-left text-sm text-gray-400">
                  <th className="px-6 py-4">Nome</th>
                  <th className="px-6 py-4">Telefone</th>
                </tr>
              </thead>
              <tbody>
                {contacts.map(c => (
                  <tr key={c.id} className="border-b border-gray-800 hover:bg-gray-800 transition">
                    <td className="px-6 py-4">{c.name}</td>
                    <td className="px-6 py-4 text-gray-400">{c.phone}</td>
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