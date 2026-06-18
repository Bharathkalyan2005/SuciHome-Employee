import { Phone, Mail, MapPin, Sparkles } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-brand-dark text-white border-t-2 border-brand-gold">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Logo and About */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="bg-brand-green p-2 rounded-lg border border-brand-gold/20">
                <Sparkles className="h-5 w-5 text-brand-gold" />
              </div>
              <span className="text-xl font-extrabold tracking-tight font-sans">
                Suci<span className="text-brand-gold">Home</span>
              </span>
            </div>
            <p className="text-gray-300 text-sm leading-relaxed max-w-sm">
              SuciHome is India's leading home cleaning service provider. We offer a safe, professional, and rewarding work environment for our cleaning staff, safety coordinators, and management teams.
            </p>
          </div>

          {/* Contact Details */}
          <div className="space-y-4">
            <h3 className="text-brand-gold text-lg font-bold">Contact Info</h3>
            <ul className="space-y-3 text-sm text-gray-300">
              <li className="flex items-center space-x-2.5">
                <Phone className="h-4 w-4 text-brand-gold" />
                <a href="tel:9392420643" className="hover:text-brand-gold transition-colors">
                  +91 93924 20643
                </a>
              </li>
              <li className="flex items-center space-x-2.5">
                <Mail className="h-4 w-4 text-brand-gold" />
                <a href="mailto:Welcome@vrcpvtltd.com" className="hover:text-brand-gold transition-colors">
                  Welcome@vrcpvtltd.com
                </a>
              </li>
              <li className="flex items-start space-x-2.5">
                <MapPin className="h-4 w-4 text-brand-gold mt-1 shrink-0" />
                <span>
                  VRC Pvt Ltd Corporate Office,<br />
                  Visakhapatnam, Andhra Pradesh, India
                </span>
              </li>
            </ul>
          </div>

          {/* Quick Info / Work Hours */}
          <div className="space-y-4">
            <h3 className="text-brand-gold text-lg font-bold">Corporate Partner</h3>
            <p className="text-sm text-gray-300">
              Managed and operated by <strong>VRC Pvt Ltd</strong>. Register as an employee to access health insurance, fixed salaries, career growth opportunities, and flexible working shifts.
            </p>
            <div className="pt-2">
              <span className="inline-block bg-brand-green text-brand-gold font-bold text-xs px-3 py-1 rounded-full uppercase tracking-wider border border-brand-gold/20">
                Join India's Top Cleaning Team
              </span>
            </div>
          </div>

        </div>

        <div className="mt-12 pt-8 border-t border-gray-700/50 text-center text-xs text-gray-400">
          <p>&copy; {new Date().getFullYear()} SuciHome / VRC Pvt Ltd. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
