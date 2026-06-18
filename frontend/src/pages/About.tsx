import { Phone, Mail, Award, Users, BookOpen, Clock } from 'lucide-react';

export default function About() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-16 space-y-16">
      
      {/* Title Header */}
      <div className="text-center space-y-4">
        <span className="text-brand-gold font-bold text-xs uppercase tracking-widest bg-brand-green/10 px-4 py-1.5 rounded-full">
          Who We Are
        </span>
        <h1 className="text-4xl sm:text-5xl font-extrabold text-brand-dark">
          About SuciHome
        </h1>
        <p className="text-brand-text max-w-2xl mx-auto text-lg leading-relaxed">
          SuciHome is a subsidiary of <strong>VRC Pvt Ltd</strong>. We are changing the face of the professional home cleaning industry in India.
        </p>
      </div>

      {/* Grid: Story and Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
        <div className="space-y-6">
          <h2 className="text-3xl font-bold text-brand-dark">Our Mission & Vision</h2>
          <p className="text-brand-text leading-relaxed">
            Founded under the banner of VRC Pvt Ltd, SuciHome was created with a dual mission: to provide Indian households with unmatched, premium, hotel-grade cleaning services, and to establish a highly professional, respectful, and well-compensated environment for our service agents.
          </p>
          <p className="text-brand-text leading-relaxed">
            We believe that clean spaces foster healthy minds. By empowering our cleaners with top-of-the-line mechanical scrubbers, organic sanitizers, and rigorous safety gear, we guarantee an exceptional outcome for our customers while protecting the physical well-being of our staff.
          </p>
          
          {/* Contact Details Card */}
          <div className="bg-white p-6 rounded-2xl border border-brand-green/10 shadow-sm space-y-4">
            <h3 className="text-lg font-bold text-brand-dark">VRC Pvt Ltd Office</h3>
            <div className="flex flex-col space-y-2 text-sm text-brand-text font-medium">
              <span className="flex items-center space-x-2">
                <Phone className="h-4 w-4 text-brand-gold" />
                <span>Call Us: +91 93924 20643</span>
              </span>
              <span className="flex items-center space-x-2">
                <Mail className="h-4 w-4 text-brand-gold" />
                <span>Email Us: Welcome@vrcpvtltd.com</span>
              </span>
            </div>
          </div>
        </div>

        {/* Visual Pillars */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-brand-green/5 space-y-3">
            <div className="bg-brand-lightGreen p-3 rounded-xl w-12 h-12 flex items-center justify-center text-brand-green">
              <Award className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-brand-dark">Premium Quality</h3>
            <p className="text-brand-text text-sm leading-relaxed">
              We train our staff in advanced cleaning techniques using European standards.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-brand-green/5 space-y-3">
            <div className="bg-brand-lightGreen p-3 rounded-xl w-12 h-12 flex items-center justify-center text-brand-green">
              <Users className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-brand-dark">Dignified Labor</h3>
            <p className="text-brand-text text-sm leading-relaxed">
              Every staff member is treated with respect and offered transparent salaries.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-brand-green/5 space-y-3">
            <div className="bg-brand-lightGreen p-3 rounded-xl w-12 h-12 flex items-center justify-center text-brand-green">
              <BookOpen className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-brand-dark">Continuous Training</h3>
            <p className="text-brand-text text-sm leading-relaxed">
              We provide free monthly training sessions to upgrade your skills.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-brand-green/5 space-y-3">
            <div className="bg-brand-lightGreen p-3 rounded-xl w-12 h-12 flex items-center justify-center text-brand-green">
              <Clock className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-brand-dark">On-Time Always</h3>
            <p className="text-brand-text text-sm leading-relaxed">
              Punctuality is our key value. We value our employee and customer schedules.
            </p>
          </div>
        </div>
      </div>
      
    </div>
  );
}
