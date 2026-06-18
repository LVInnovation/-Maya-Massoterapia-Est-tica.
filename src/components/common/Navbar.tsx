import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { SiteConfig } from '../../content/siteContent';
import { clearAuthentication, isAuthenticated } from '../../lib/auth';

interface NavbarProps {
  content: SiteConfig;
  onNavigate?: (section: string) => void;
}

const Navbar = ({ content, onNavigate }: NavbarProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const navItems = [
    { label: content.header.navHome, section: 'home' },
    { label: content.header.navProfessionals, section: 'professionals' },
    { label: content.header.navServices, section: 'services' },
    { label: content.header.navBooking, section: 'booking' },
  ];

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
      return;
    }

    navigate('/', { state: { scrollTo: section } });
  };

  const handleLogout = () => {
    clearAuthentication();
    setMenuOpen(false);
    navigate('/');
  };

  if (isAdminPage) return null;

  return (
    <nav className="fixed left-0 right-0 top-0 z-50 border-b border-gold-400/20 bg-dark-800/90 shadow-dark-lg backdrop-blur-lg">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <Link
            to="/"
            onClick={() => setMenuOpen(false)}
            className="w-[11rem] shrink-0 font-serif text-base font-bold leading-tight text-gold-400 transition-colors duration-300 hover:text-gold-300 sm:w-auto sm:text-3xl"
          >
            <span className="block break-words sm:hidden">{content.siteName}</span>
            <span className="hidden sm:inline">{content.siteName}</span>
          </Link>

          {/* MENU DESKTOP */}
          <div className="hidden items-center space-x-8 md:flex">
            {navItems.map((item) => (
              <button
                key={item.section}
                type="button"
                onClick={() => handleNavClick(item.section)}
                className="text-sm font-medium uppercase tracking-wide text-gray-300 transition-colors duration-200 hover:text-gold-400"
              >
                {item.label}
              </button>
            ))}

            {loggedIn && (
              <>
                <Link
                  to="/admin"
                  className="text-sm font-medium uppercase tracking-wide text-gray-300 transition-colors duration-200 hover:text-gold-400"
                >
                  {content.header.admin}
                </Link>

                <Link
                  to="/agenda"
                  className="text-sm font-medium uppercase tracking-wide text-gray-300 transition-colors duration-200 hover:text-gold-400"
                >
                  {content.header.agenda}
                </Link>

                <Link
                  to="/notificacoes"
                  className="text-sm font-medium uppercase tracking-wide text-gray-300 transition-colors duration-200 hover:text-gold-400"
                >
                  {content.header.notifications}
                </Link>
              </>
            )}
          </div>

          {/* BOTÕES DIREITA DESKTOP */}
          <div className="hidden items-center gap-3 md:flex">
            <button
              type="button"
              onClick={() => handleNavClick('booking')}
              className="rounded-full bg-gold-400 px-6 py-2 text-sm font-semibold text-dark-800 transition-all duration-300 hover:bg-gold-300 hover:shadow-gold-glow"
            >
              {content.buttons.scheduleNow}
            </button>

            {loggedIn ? (
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-full border border-gold-400 px-5 py-2 text-sm font-medium text-gold-400 transition-all duration-300 hover:bg-gold-400/10 hover:shadow-gold-glow"
              >
                {content.header.logout}
              </button>
            ) : (
              <Link
                to="/login"
                className="rounded-full border border-gold-400 px-5 py-2 text-sm font-medium text-gold-400 transition-all duration-300 hover:bg-gold-400/10 hover:shadow-gold-glow"
              >
                {content.header.login}
              </Link>
            )}
          </div>

          {/* BOTÕES MOBILE */}
          <div className="flex items-center gap-2 md:hidden">
            {loggedIn ? (
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-full border border-gold-400 px-3 py-1.5 text-xs font-medium text-gold-400 transition-all duration-300 hover:bg-gold-400/10"
              >
                {content.header.logout}
              </button>
            ) : (
              <Link
                to="/login"
                onClick={() => setMenuOpen(false)}
                className="rounded-full border border-gold-400 px-3 py-1.5 text-xs font-medium text-gold-400 transition-all duration-300 hover:bg-gold-400/10"
              >
                {content.header.login}
              </Link>
            )}

            <button
              type="button"
              onClick={() => setMenuOpen((current) => !current)}
              aria-label={
                menuOpen
                  ? content.header.closeMenuAria
                  : content.header.openMenuAria
              }
              aria-expanded={menuOpen}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full text-gold-400 transition hover:bg-dark-700"
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
          <div className="border-t border-gold-400/20 bg-dark-700/50 backdrop-blur py-3 md:hidden">
            <div className="grid gap-2">
              {navItems.map((item) => (
                <button
                  key={item.section}
                  type="button"
                  onClick={() => handleNavClick(item.section)}
                  className="rounded-2xl px-4 py-3 text-left text-sm font-medium text-gray-300 transition hover:bg-gold-400/10 hover:text-gold-400"
                >
                  {item.label}
                </button>
              ))}

              {loggedIn && (
                <>
                  <Link
                    to="/admin"
                    onClick={() => setMenuOpen(false)}
                    className="rounded-2xl px-4 py-3 text-sm font-medium text-gray-300 transition hover:bg-gold-400/10 hover:text-gold-400"
                  >
                    {content.header.admin}
                  </Link>

                  <Link
                    to="/agenda"
                    onClick={() => setMenuOpen(false)}
                    className="rounded-2xl px-4 py-3 text-sm font-medium text-gray-300 transition hover:bg-gold-400/10 hover:text-gold-400"
                  >
                    {content.header.agenda}
                  </Link>

                  <Link
                    to="/notificacoes"
                    onClick={() => setMenuOpen(false)}
                    className="rounded-2xl px-4 py-3 text-sm font-medium text-gray-300 transition hover:bg-gold-400/10 hover:text-gold-400"
                  >
                    {content.header.notifications}
                  </Link>
                </>
              )}

              <button
                type="button"
                onClick={() => handleNavClick('booking')}
                className="mt-2 rounded-full bg-gold-400 px-4 py-3 text-sm font-semibold text-dark-800 transition-all hover:bg-gold-300 hover:shadow-gold-glow"
              >
                {content.buttons.scheduleNow}
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
