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

  const responseRate = stats && stats.total_sent > 0 
    ? (stats.total_responses / stats.total_sent) * 100 
    : 0
  const responseRateFormatted = responseRate.toFixed(1)

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <Navbar />

      <div className="max-w-4xl mx-auto px-6 py-8">
        <h2 className="text-xl font-semibold mb-6 select-none">Dashboard</h2>

        {loading || !stats ? (
          <p className="text-gray-400">Carregando...</p>
        ) : (
          <>
            {/* Grid de Cards Estatísticos */}
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
              {cards.map(card => (
                <div key={card.label} className="bg-gray-900 border border-gray-800 rounded-xl p-6 transition duration-200 hover:border-gray-700">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">{card.label}</p>
                  <p className={`text-3xl font-black ${card.color}`}>{card.value}</p>
                </div>
              ))}
            </div>

            {/* Seção do Gráfico de Dimensões (Mensagens Enviadas vs Recebidas) */}
            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Barras Comparativas de Dimensões */}
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 md:col-span-2 flex flex-col justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-6">Mapeamento de Mensagens</h3>
                  
                  <div className="space-y-6">
                    {/* Dimensão: Mensagens Enviadas */}
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-gray-400 font-semibold">Mensagens Enviadas</span>
                        <span className="text-white font-black">{stats.total_sent}</span>
                      </div>
                      <div className="w-full bg-gray-950 h-5 rounded-full overflow-hidden p-0.5 border border-gray-800">
                        <div 
                          className="bg-green-500 h-full rounded-full transition-all duration-1000 ease-out"
                          style={{ width: stats.total_sent > 0 ? '100%' : '0%' }}
                        />
                      </div>
                    </div>

                    {/* Dimensão: Mensagens Recebidas */}
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-gray-400 font-semibold">Respostas Recebidas (Mensagens Recebidas)</span>
                        <span className="text-white font-black">{stats.total_responses}</span>
                      </div>
                      <div className="w-full bg-gray-950 h-5 rounded-full overflow-hidden p-0.5 border border-gray-800">
                        <div 
                          className="bg-instagram-gradient h-full rounded-full transition-all duration-1000 ease-out"
                          style={{ width: `${stats.total_sent > 0 ? Math.min((stats.total_responses / stats.total_sent) * 100, 100) : 0}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-gray-500 mt-6 leading-relaxed">
                  * Este gráfico compara a quantidade de mensagens que foram disparadas ativamente com as respostas recebidas de volta dos contatos.
                </p>
              </div>

              {/* Anel de Progresso Circular (Taxa de Resposta) */}
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 flex flex-col items-center justify-between">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider w-full text-left">Conversão</h3>
                
                <div className="relative w-36 h-36 flex items-center justify-center my-4">
                  {/* Círculo SVG de Progresso */}
                  <svg className="w-full h-full transform -rotate-90">
                    <circle
                      cx="72"
                      cy="72"
                      r="60"
                      className="stroke-gray-950"
                      strokeWidth="8"
                      fill="transparent"
                    />
                    <circle
                      cx="72"
                      cy="72"
                      r="60"
                      stroke="url(#instaCircularGradient)"
                      strokeWidth="8"
                      fill="transparent"
                      strokeDasharray={376.99}
                      strokeDashoffset={376.99 * (1 - Math.min(responseRate, 100) / 100)}
                      strokeLinecap="round"
                      className="transition-all duration-1000 ease-out"
                    />
                    <defs>
                      <linearGradient id="instaCircularGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#f09433" />
                        <stop offset="35%" stopColor="#dc2743" />
                        <stop offset="70%" stopColor="#cc2366" />
                        <stop offset="100%" stopColor="#bc1888" />
                      </linearGradient>
                    </defs>
                  </svg>
                  
                  <div className="absolute flex flex-col items-center">
                    <span className="text-2xl font-black text-white">{responseRateFormatted}%</span>
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">Resposta</span>
                  </div>
                </div>

                <div className="text-center w-full">
                  <p className="text-xs text-gray-400 font-semibold">
                    {stats.total_sent > 0 
                      ? `${stats.total_responses} respostas de ${stats.total_sent} envios`
                      : 'Sem mensagens enviadas'
                    }
                  </p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}