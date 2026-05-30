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
      <h1 
        className="text-xl font-extrabold tracking-wide text-instagram-gradient cursor-pointer select-none"
        onClick={() => navigate('/dashboard')}
      >
        CRM WhatsApp
      </h1>
      <div className="flex gap-6 items-center">
        {links.map(link => (
          <button
            key={link.path}
            onClick={() => navigate(link.path)}
            className={`text-sm transition-all duration-200 cursor-pointer ${
              location.pathname === link.path
                ? 'text-white font-bold'
                : 'text-gray-400 hover:text-white font-medium'
            }`}
          >
            {link.label}
          </button>
        ))}
        <button
          onClick={logout}
          className="text-sm text-gray-400 hover:text-red-400 font-medium transition-all duration-200 cursor-pointer"
        >
          Sair
        </button>
      </div>
    </nav>
  )
}