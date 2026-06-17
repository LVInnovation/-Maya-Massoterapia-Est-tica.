import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

interface NavbarProps {
  onNavigate?: (section: string) => void;
}

const navItems = [
  { label: 'Início', section: 'home' },
  { label: 'Profissionais', section: 'professionals' },
  { label: 'Serviços', section: 'services' },
  { label: 'Agendamento', section: 'booking' },
];

const isAuthenticated = () => sessionStorage.getItem('maya_auth') === 'true'

const Navbar = ({ onNavigate }: NavbarProps) => {
  const location = useLocation();
  const navigate = useNavigate();

  const isAdminPage =
    location.pathname === '/admin' ||
    location.pathname === '/agenda' ||
    location.pathname === '/notificacoes';

  const [menuOpen, setMenuOpen] = useState(false);
  const loggedIn = isAuthenticated();

  const handleNavClick = (section: string) => {
    setMenuOpen(false);

    if (location.pathname === '/') {
      onNavigate?.(section);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('maya_auth');
    setMenuOpen(false);
    navigate('/');
  };

  if (isAdminPage) return null;

  return (
    <nav className="fixed left-0 right-0 top-0 z-50 border-b border-[#4f3f12] bg-[#080808]/95 shadow-xl backdrop-blur-md">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <Link
            to="/"
            onClick={() => setMenuOpen(false)}
            className="font-serif text-2xl font-bold text-pink-300 sm:text-3xl"
          >
            Maya Massoterapia & Estética
          </Link>

          {/* MENU DESKTOP */}
          <div className="hidden items-center space-x-8 md:flex">
            {navItems.map((item) => (
              <button
                key={item.section}
                type="button"
                onClick={() => handleNavClick(item.section)}
                className="text-sm font-medium uppercase tracking-wide text-[#f4ecd6] transition-colors duration-200 hover:text-pink-300"
              >
                {item.label}
              </button>
            ))}

            {loggedIn && (
              <>
                <Link
                  to="/admin"
                  className="text-sm font-medium uppercase tracking-wide text-[#f4ecd6] transition-colors duration-200 hover:text-pink-300"
                >
                  Admin
                </Link>

                <Link
                  to="/agenda"
                  className="text-sm font-medium uppercase tracking-wide text-[#f4ecd6] transition-colors duration-200 hover:text-pink-300"
                >
                  Agenda
                </Link>

                <Link
                  to="/notificacoes"
                  className="text-sm font-medium uppercase tracking-wide text-[#f4ecd6] transition-colors duration-200 hover:text-pink-300"
                >
                  Notificações
                </Link>
              </>
            )}
          </div>

          {/* BOTÕES DIREITA DESKTOP */}
          <div className="hidden items-center gap-3 md:flex">
            <button
              type="button"
              onClick={() => onNavigate?.('booking')}
              className="rounded-full bg-pink-500 px-5 py-2 text-sm font-medium text-black transition-colors duration-200 hover:bg-pink-400"
            >
              Agendar agora
            </button>

            {loggedIn ? (
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-full border border-pink-300 px-4 py-2 text-sm font-medium text-pink-300 transition hover:bg-pink-900/20"
              >
                Sair
              </button>
            ) : (
              <Link
                to="/login"
                className="rounded-full border border-pink-300 px-4 py-2 text-sm font-medium text-pink-300 transition hover:bg-pink-900/20"
              >
                Login
              </Link>
            )}
          </div>

          {/* BOTÕES MOBILE */}
          <div className="flex items-center gap-2 md:hidden">
            {loggedIn ? (
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-full border border-pink-300 px-3 py-1.5 text-xs font-medium text-pink-300 transition hover:bg-pink-900/20"
              >
                Sair
              </button>
            ) : (
              <Link
                to="/login"
                className="rounded-full border border-pink-300 px-3 py-1.5 text-xs font-medium text-pink-300 transition hover:bg-pink-900/20"
              >
                Login
              </Link>
            )}

            <button
              type="button"
              onClick={() => setMenuOpen((current) => !current)}
              aria-label={menuOpen ? 'Fechar menu' : 'Abrir menu'}
              aria-expanded={menuOpen}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full text-pink-500 transition hover:bg-pink-50"
            >
              {menuOpen ? (
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* MENU MOBILE ABERTO */}
        {menuOpen && (
          <div className="border-t border-pink-100 py-3 md:hidden">
            <div className="grid gap-2">
              {navItems.map((item) => (
                <button
                  key={item.section}
                  type="button"
                  onClick={() => handleNavClick(item.section)}
                  className="rounded-2xl px-4 py-3 text-left text-sm font-medium text-gray-700 transition hover:bg-pink-50 hover:text-pink-600"
                >
                  {item.label}
                </button>
              ))}

              {loggedIn && (
                <>
                  <Link
                    to="/admin"
                    onClick={() => setMenuOpen(false)}
                    className="rounded-2xl px-4 py-3 text-sm font-medium text-[#f4ecd6] transition hover:bg-pink-900/20 hover:text-pink-300"
                  >
                    Admin
                  </Link>

                  <Link
                    to="/agenda"
                    onClick={() => setMenuOpen(false)}
                    className="rounded-2xl px-4 py-3 text-sm font-medium text-[#f4ecd6] transition hover:bg-pink-900/20 hover:text-pink-300"
                  >
                    Agenda
                  </Link>

                  <Link
                    to="/notificacoes"
                    onClick={() => setMenuOpen(false)}
                    className="rounded-2xl px-4 py-3 text-sm font-medium text-[#f4ecd6] transition hover:bg-pink-900/20 hover:text-pink-300"
                  >
                    Notificações
                  </Link>
                </>
              )}

              <button
                type="button"
                onClick={() => handleNavClick('booking')}
                className="mt-1 rounded-full bg-pink-500 px-4 py-3 text-sm font-semibold text-black transition hover:bg-pink-400"
              >
                Agendar agora
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;