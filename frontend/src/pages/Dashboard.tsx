import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import Navbar from '../components/Navbar'

interface Stats {
  total_contacts: number
  total_campaigns: number
  total_sent: number
  total_delivered: number
  total_responses: number
}

export default function Dashboard() {
  const navigate = useNavigate()
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/dashboard')
      .then(res => setStats(res.data))
      .catch(() => navigate('/login'))
      .finally(() => setLoading(false))
  }, [])

  const cards = stats ? [
    { label: 'Contatos ativos', value: stats.total_contacts, color: 'text-blue-400' },
    { label: 'Campanhas criadas', value: stats.total_campaigns, color: 'text-purple-400' },
    { label: 'Mensagens enviadas', value: stats.total_sent, color: 'text-green-400' },
    { label: 'Mensagens entregues', value: stats.total_delivered, color: 'text-yellow-400' },
    { label: 'Respostas recebidas', value: stats.total_responses, color: 'text-pink-400' },
  ] : []

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <Navbar />

      <div className="max-w-4xl mx-auto px-6 py-8">
        <h2 className="text-xl font-semibold mb-6">Dashboard</h2>

        {loading ? (
          <p className="text-gray-400">Carregando...</p>
        ) : (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
            {cards.map(card => (
              <div key={card.label} className="bg-gray-900 rounded-xl p-6">
                <p className="text-sm text-gray-400 mb-2">{card.label}</p>
                <p className={`text-4xl font-bold ${card.color}`}>{card.value}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}