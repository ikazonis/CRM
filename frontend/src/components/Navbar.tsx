import { useNavigate } from 'react-router-dom'

export default function Navbar() {
  const navigate = useNavigate()

  function logout() {
    localStorage.removeItem('token')
    navigate('/login')
  }

  return (
    <nav className="bg-gray-900 px-6 py-4 flex justify-between items-center border-b border-gray-800">
      <h1 className="text-lg font-bold text-green-400">CRM WhatsApp</h1>
      <div className="flex gap-6 items-center">
        <button
          onClick={() => navigate('/contacts')}
          className="text-sm text-gray-400 hover:text-white transition"
        >
          Contatos
        </button>
        <button
          onClick={() => navigate('/campaigns')}
          className="text-sm text-gray-400 hover:text-white transition"
        >
          Campanhas
        </button>
        <button
          onClick={logout}
          className="text-sm text-gray-400 hover:text-white transition"
        >
          Sair
        </button>
      </div>
    </nav>
  )
}