import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, Sparkles } from 'lucide-react';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'About', path: '/about' },
    { name: 'Careers', path: '/careers' },
    { name: 'Register', path: '/register' },
    { name: 'Track Status', path: '/status' },
    { name: 'Contact', path: '/contact' },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="sticky top-0 z-50 glass-panel shadow-sm border-b border-brand-green/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20">
          
          {/* Logo Section */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2 group">
              <div className="bg-brand-green p-2.5 rounded-xl transition-transform duration-300 group-hover:scale-105 shadow-md">
                <Sparkles className="h-6 w-6 text-brand-gold" />
              </div>
              <div className="flex flex-col">
                <span className="text-2xl font-extrabold tracking-tight text-brand-dark font-sans leading-none flex items-center">
                  Suci<span className="text-brand-gold">Home</span>
                </span>
                <span className="text-[10px] font-semibold tracking-wider text-brand-text uppercase mt-0.5">
                  VRC Pvt Ltd
                </span>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center space-x-1">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`px-4 py-2 rounded-lg text-sm font-semibold tracking-wide transition-all duration-200 ${
                  isActive(link.path)
                    ? 'bg-brand-green text-white shadow-sm'
                    : 'text-brand-text hover:bg-brand-lightGreen hover:text-brand-green'
                }`}
              >
                {link.name}
              </Link>
            ))}
            <button
              onClick={() => navigate('/admin')}
              style={{
                display     : 'flex',
                alignItems  : 'center',
                gap         : '6px',
                background  : '#1B4332',
                color       : '#FFFFFF',
                border      : 'none',
                borderRadius: '20px',
                padding     : '8px 16px',
                cursor      : 'pointer',
                fontSize    : '14px',
                fontWeight  : '600',
                marginLeft  : '16px'
              }}
            >
              ⚙️ Admin
            </button>
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              type="button"
              className="inline-flex items-center justify-center p-2 rounded-lg text-brand-green hover:bg-brand-lightGreen focus:outline-none"
              aria-controls="mobile-menu"
              aria-expanded={isOpen}
            >
              <span className="sr-only">Open main menu</span>
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden glass-panel border-t border-brand-green/10" id="mobile-menu">
          <div className="px-2 pt-2 pb-4 space-y-1 sm:px-3">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setIsOpen(false)}
                className={`block px-4 py-3 rounded-lg text-base font-semibold transition-all ${
                  isActive(link.path)
                    ? 'bg-brand-green text-white'
                    : 'text-brand-text hover:bg-brand-lightGreen hover:text-brand-green'
                }`}
              >
                {link.name}
              </Link>
            ))}
            <button
              onClick={() => {
                setIsOpen(false);
                navigate('/admin');
              }}
              style={{
                display     : 'flex',
                alignItems  : 'center',
                justifyContent: 'center',
                gap         : '6px',
                background  : '#1B4332',
                color       : '#FFFFFF',
                border      : 'none',
                borderRadius: '20px',
                padding     : '12px 24px',
                cursor      : 'pointer',
                fontSize    : '16px',
                fontWeight  : '600',
                width       : '100%',
                marginTop   : '16px'
              }}
            >
              ⚙️ Admin Dashboard
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}
