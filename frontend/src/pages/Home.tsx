import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Sparkles, ShieldCheck, DollarSign, Calendar, Search, Award } from 'lucide-react';

export default function Home() {
  const [appId, setAppId] = useState('');
  const navigate = useNavigate();

  const handleTrack = (e: React.FormEvent) => {
    e.preventDefault();
    if (appId.trim()) {
      navigate(`/status?id=${appId.trim()}`);
    }
  };

  const positions = [
    { title: 'Cleaner', desc: 'Execute professional home sanitization and deep cleaning.' },
    { title: 'Supervisor', desc: 'Lead field crews, manage materials, and ensure quality control.' },
    { title: 'Safety Officer', desc: 'Oversee environmental safety protocols and health compliance.' },
    { title: 'Manager', desc: 'Handle client service operations and manage regional logistics.' }
  ];

  return (
    <div className="space-y-16 pb-20">
      
      {/* Hero Section */}
      <section className="relative bg-brand-dark text-white py-24 px-4 overflow-hidden border-b-4 border-brand-gold">
        {/* Soft gold glow background shapes */}
        <div className="absolute top-[-50px] right-[-100px] w-96 h-96 bg-brand-gold/10 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-[-100px] left-[-50px] w-96 h-96 bg-brand-green/20 rounded-full blur-3xl"></div>

        <div className="max-w-5xl mx-auto text-center space-y-8 relative z-10">
          <div className="inline-flex items-center space-x-2 bg-brand-green border border-brand-gold/30 px-4 py-1.5 rounded-full text-brand-gold font-bold text-xs uppercase tracking-wider animate-pulse-gold">
            <Sparkles className="h-4 w-4" />
            <span>Now Hiring Across Major Cities in India</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight leading-tight text-white">
            Build Your Career with <br />
            <span className="text-brand-gold">SuciHome Onboarding</span>
          </h1>

          <p className="max-w-2xl mx-auto text-gray-300 text-lg sm:text-xl font-medium leading-relaxed">
            Join India's premium home cleaning company. We provide fixed salaries, medical insurance coverage, professional gear, and robust growth paths.
          </p>

          <div className="flex flex-col sm:flex-row justify-center items-center gap-4 pt-4">
            <Link
              to="/register"
              className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 bg-brand-gold hover:bg-brand-gold/90 text-brand-dark px-8 py-4 rounded-xl font-bold shadow-lg transform transition hover:-translate-y-0.5 hover-gold-glow"
            >
              <span>Apply Now</span>
              <ArrowRight className="h-5 w-5" />
            </Link>
            <Link
              to="/careers"
              className="w-full sm:w-auto inline-flex items-center justify-center bg-brand-green hover:bg-brand-green/80 text-white px-8 py-4 rounded-xl font-bold border border-brand-gold/20 transition hover:-translate-y-0.5"
            >
              Explore Job Roles
            </Link>
          </div>
        </div>
      </section>

      {/* Quick Status Check Bar */}
      <section className="max-w-4xl mx-auto px-4 -mt-24 relative z-20">
        <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-xl border border-brand-green/10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-1 text-center md:text-left">
            <h2 className="text-xl font-extrabold text-brand-dark flex items-center justify-center md:justify-start space-x-2">
              <Search className="h-5 w-5 text-brand-gold" />
              <span>Track Application Status</span>
            </h2>
            <p className="text-brand-text text-sm font-medium">Already registered? Input your Application ID to track your process.</p>
          </div>
          <form onSubmit={handleTrack} className="w-full md:w-auto flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              placeholder="e.g. SH-EMP-20260618-A3K9P"
              value={appId}
              onChange={(e) => setAppId(e.target.value)}
              className="px-4 py-3 rounded-xl border border-brand-green/20 focus:outline-none focus:ring-2 focus:ring-brand-gold text-brand-dark placeholder-gray-400 min-w-[260px] bg-brand-cream/50"
            />
            <button
              type="submit"
              className="bg-brand-green hover:bg-brand-green/90 text-white font-bold px-6 py-3 rounded-xl transition-all shadow-md flex items-center justify-center space-x-2"
            >
              <span>Search</span>
            </button>
          </form>
        </div>
      </section>

      {/* Why SuciHome Features Section */}
      <section className="max-w-6xl mx-auto px-4 space-y-12">
        <div className="text-center space-y-3">
          <h2 className="text-3xl font-extrabold text-brand-dark">Why Work With SuciHome?</h2>
          <p className="text-brand-text max-w-xl mx-auto font-medium">
            We value our employees as the cornerstone of our company and offer industry-leading benefits.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-brand-green/5 space-y-4 text-center">
            <div className="bg-brand-lightGreen p-4 rounded-full w-14 h-14 flex items-center justify-center mx-auto text-brand-green">
              <DollarSign className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-brand-dark">Assured Pay</h3>
            <p className="text-brand-text text-sm leading-relaxed">
              Attractive fixed salary packages paid on time directly to bank accounts, plus performance-based incentives.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-brand-green/5 space-y-4 text-center">
            <div className="bg-brand-lightGreen p-4 rounded-full w-14 h-14 flex items-center justify-center mx-auto text-brand-green">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-brand-dark">Full Insurance</h3>
            <p className="text-brand-text text-sm leading-relaxed">
              Comprehensive medical coverage for all field operations, protecting you and your family.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-brand-green/5 space-y-4 text-center">
            <div className="bg-brand-lightGreen p-4 rounded-full w-14 h-14 flex items-center justify-center mx-auto text-brand-green">
              <Calendar className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-brand-dark">Flexible Shifts</h3>
            <p className="text-brand-text text-sm leading-relaxed">
              Balance work and life. Select shifts that suit your family schedules and preference.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-brand-green/5 space-y-4 text-center">
            <div className="bg-brand-lightGreen p-4 rounded-full w-14 h-14 flex items-center justify-center mx-auto text-brand-green">
              <Award className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-brand-dark">Career Growth</h3>
            <p className="text-brand-text text-sm leading-relaxed">
              Clear ladders from cleaner to field supervisor and manager with continuous training.
            </p>
          </div>
        </div>
      </section>

      {/* Available Roles Section */}
      <section className="bg-white py-16 border-y border-brand-green/10">
        <div className="max-w-6xl mx-auto px-4 space-y-12">
          <div className="text-center space-y-3">
            <h2 className="text-3xl font-extrabold text-brand-dark">Positions We Are Hiring For</h2>
            <p className="text-brand-text max-w-xl mx-auto font-medium">
              We look for passionate service professionals ready to make home spaces beautiful.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {positions.map((pos) => (
              <div key={pos.title} className="bg-brand-cream border border-brand-green/5 hover-gold-glow p-6 rounded-2xl flex flex-col justify-between h-56">
                <div>
                  <h3 className="text-xl font-bold text-brand-dark mb-2">{pos.title}</h3>
                  <p className="text-brand-text text-sm leading-relaxed">{pos.desc}</p>
                </div>
                <Link
                  to={`/register?role=${pos.title.toLowerCase().replace(' ', '_')}`}
                  className="text-brand-green hover:text-brand-gold font-bold text-sm flex items-center space-x-1 mt-4"
                >
                  <span>Apply for Role</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>
      
    </div>
  );
}
