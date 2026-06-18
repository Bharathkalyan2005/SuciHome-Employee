import { Link } from 'react-router-dom';
import { DollarSign, Briefcase, Award, ShieldAlert } from 'lucide-react';

export default function Careers() {
  const roles = [
    {
      id: 'cleaner',
      title: 'Cleaner',
      salaryRange: '₹12,000 - ₹18,000 / month',
      description: 'Responsible for delivering top-grade residential and deep sanitization services. Requires high attention to detail and punctuality.',
      requirements: ['No prior experience required (free training provided)', 'Basic communication skills', 'Reliable and punctual'],
      icon: Briefcase,
    },
    {
      id: 'supervisor',
      title: 'Supervisor',
      salaryRange: '₹20,000 - ₹28,000 / month',
      description: 'Manages a team of cleaners on field visits. Inspects clean standards, manages supply inventories, and interfaces directly with customers.',
      requirements: ['1-3 years of housekeeping or lead cleaning experience', 'Basic smartphone usage and app logging knowledge', 'Strong team leading capacity'],
      icon: Award,
    },
    {
      id: 'safety_officer',
      title: 'Safety Officer',
      salaryRange: '₹25,000 - ₹35,000 / month',
      description: 'Coordinates chemical handling, sanitization compliance, and safety standards during specialized deep-cleaning or hazard situations.',
      requirements: ['Certification in safety or hygiene standards', '2+ years experience in facilities, hospital cleaning, or industrial safety', 'Excellent hazard reporting skills'],
      icon: ShieldAlert,
    },
    {
      id: 'manager',
      title: 'Manager',
      salaryRange: '₹35,000 - ₹50,000 / month',
      description: 'Coordinates city logistics, supervises all regional supervisors, monitors customer satisfaction ratings, and handles corporate customer relationships.',
      requirements: ['Graduate degree or equivalent management experience', '3+ years managing teams in retail, hospitality, or on-demand services', 'Strong verbal and written English/local language'],
      icon: DollarSign,
    },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-16 space-y-16">
      
      {/* Title Header */}
      <div className="text-center space-y-4">
        <span className="text-brand-gold font-bold text-xs uppercase tracking-widest bg-brand-green/10 px-4 py-1.5 rounded-full">
          We Are Hiring
        </span>
        <h1 className="text-4xl sm:text-5xl font-extrabold text-brand-dark">
          Explore Careers at SuciHome
        </h1>
        <p className="text-brand-text max-w-2xl mx-auto text-lg leading-relaxed">
          Select a role that fits your experience. We offer competitive salaries, health coverage, and rapid promotion programs.
        </p>
      </div>

      {/* Role Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {roles.map((role) => {
          const Icon = role.icon;
          return (
            <div
              key={role.id}
              className="bg-white rounded-3xl p-8 border border-brand-green/10 shadow-sm hover-gold-glow flex flex-col justify-between space-y-6"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="bg-brand-lightGreen p-3 rounded-2xl text-brand-green">
                    <Icon className="h-6 w-6" />
                  </div>
                  <span className="bg-brand-green text-brand-gold font-bold text-sm px-4 py-1 rounded-full border border-brand-gold/20">
                    {role.salaryRange}
                  </span>
                </div>
                
                <h3 className="text-2xl font-extrabold text-brand-dark">{role.title}</h3>
                
                <p className="text-brand-text text-sm leading-relaxed">
                  {role.description}
                </p>

                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-brand-dark uppercase tracking-wider">Key Requirements:</h4>
                  <ul className="space-y-1 text-sm text-brand-text">
                    {role.requirements.map((req, index) => (
                      <li key={index} className="flex items-start">
                        <span className="text-brand-gold mr-2 font-bold">•</span>
                        <span>{req}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="pt-4 border-t border-brand-green/10">
                <Link
                  to={`/register?role=${role.id}`}
                  className="w-full inline-flex justify-center items-center bg-brand-green hover:bg-brand-green/90 text-white font-bold py-3 rounded-xl transition-colors shadow-md text-sm"
                >
                  Apply For This Position
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      {/* Perks Callout */}
      <div className="bg-brand-dark rounded-3xl p-8 sm:p-12 text-white border-2 border-brand-gold relative overflow-hidden">
        <div className="absolute top-[-50px] right-[-50px] w-64 h-64 bg-brand-green/40 rounded-full blur-2xl"></div>
        <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div className="space-y-4">
            <h2 className="text-3xl font-extrabold text-brand-gold font-sans">Ready to Get Started?</h2>
            <p className="text-gray-300 leading-relaxed">
              Fill out our simple 3-step registration form. Prepare your Aadhaar card number, a profile photo, and your resume (optional).
            </p>
          </div>
          <div className="flex justify-end">
            <Link
              to="/register"
              className="w-full sm:w-auto text-center bg-brand-gold hover:bg-brand-gold/90 text-brand-dark font-extrabold px-8 py-4 rounded-xl shadow-lg transition-all text-base"
            >
              Start Application
            </Link>
          </div>
        </div>
      </div>
      
    </div>
  );
}
