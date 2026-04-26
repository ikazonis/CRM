import { useNavigate, useLocation } from 'react-router-dom'

export default function Navbar() {
  const navigate = useNavigate()
  const location = useLocation()

  function logout() {
    localStorage.removeItem('token')
    navigate('/login')
  }

  const links = [
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'Contatos', path: '/contacts' },
    { label: 'Campanhas', path: '/campaigns' },
  ]

  return (
    <nav className="bg-gray-900 px-6 py-4 flex justify-between items-center border-b border-gray-800">
      <h1 className="text-lg font-bold text-green-400">CRM WhatsApp</h1>
      <div className="flex gap-6 items-center">
        {links.map(link => (
          <button
            key={link.path}
            onClick={() => navigate(link.path)}
            className={`text-sm transition ${
              location.pathname === link.path
                ? 'text-white font-semibold'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            {link.label}
          </button>
        ))}
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