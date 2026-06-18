import React, { useState } from 'react';
import { Phone, Mail, MapPin, Send, MessageSquare } from 'lucide-react';

export default function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, send to support endpoint. Here we mock success.
    console.log('[Contact Submission]:', formData);
    setSubmitted(true);
    setFormData({ name: '', email: '', subject: '', message: '' });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-16 space-y-16">
      
      {/* Title Header */}
      <div className="text-center space-y-4">
        <span className="text-brand-gold font-bold text-xs uppercase tracking-widest bg-brand-green/10 px-4 py-1.5 rounded-full">
          Get In Touch
        </span>
        <h1 className="text-4xl sm:text-5xl font-extrabold text-brand-dark">
          Contact SuciHome Support
        </h1>
        <p className="text-brand-text max-w-2xl mx-auto text-lg leading-relaxed">
          Have questions about the registration process, salaries, or onboarding? Contact our HR team today.
        </p>
      </div>

      {/* Grid: Contact Details and Form */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Left column: Contact Info Cards */}
        <div className="md:col-span-1 space-y-6">
          <div className="bg-white p-8 rounded-3xl border border-brand-green/10 shadow-sm space-y-4 flex flex-col items-center text-center">
            <div className="bg-brand-lightGreen p-3 rounded-full text-brand-green">
              <Phone className="h-6 w-6" />
            </div>
            <h3 className="font-bold text-lg text-brand-dark">Call Support</h3>
            <p className="text-sm text-brand-text">Speak with our HR representatives.</p>
            <a href="tel:9392420643" className="text-brand-green hover:text-brand-gold font-extrabold text-lg transition-colors">
              +91 93924 20643
            </a>
          </div>

          <div className="bg-white p-8 rounded-3xl border border-brand-green/10 shadow-sm space-y-4 flex flex-col items-center text-center">
            <div className="bg-brand-lightGreen p-3 rounded-full text-brand-green">
              <Mail className="h-6 w-6" />
            </div>
            <h3 className="font-bold text-lg text-brand-dark">Email Support</h3>
            <p className="text-sm text-brand-text">Send your documents or queries via email.</p>
            <a href="mailto:Welcome@vrcpvtltd.com" className="text-brand-green hover:text-brand-gold font-extrabold text-sm sm:text-base break-all transition-colors">
              Welcome@vrcpvtltd.com
            </a>
          </div>

          <div className="bg-white p-8 rounded-3xl border border-brand-green/10 shadow-sm space-y-4 flex flex-col items-center text-center">
            <div className="bg-brand-lightGreen p-3 rounded-full text-brand-green">
              <MapPin className="h-6 w-6" />
            </div>
            <h3 className="font-bold text-lg text-brand-dark">Headquarters</h3>
            <p className="text-sm text-brand-text leading-relaxed">
              VRC Pvt Ltd Corporate Office,<br />
              Visakhapatnam, Andhra Pradesh, India
            </p>
          </div>
        </div>

        {/* Right column: Interactive form */}
        <div className="md:col-span-2 bg-white rounded-3xl p-8 border border-brand-green/10 shadow-sm">
          <h2 className="text-2xl font-extrabold text-brand-dark mb-6 flex items-center space-x-2">
            <MessageSquare className="h-6 w-6 text-brand-gold" />
            <span>Send Us a Message</span>
          </h2>

          {submitted ? (
            <div className="bg-brand-lightGreen/50 border border-brand-green/20 p-6 rounded-2xl text-center space-y-3">
              <h3 className="text-xl font-bold text-brand-green">Message Sent Successfully!</h3>
              <p className="text-brand-text text-sm">
                Thank you for reaching out. The SuciHome HR team will review your query and reply within 24-48 hours.
              </p>
              <button
                onClick={() => setSubmitted(false)}
                className="mt-4 bg-brand-green text-white font-bold px-6 py-2 rounded-xl text-sm hover:bg-brand-green/90"
              >
                Send Another Message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label htmlFor="name" className="block text-xs font-bold text-brand-dark uppercase tracking-wider">Your Full Name</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Enter your name"
                    className="w-full px-4 py-3 rounded-xl border border-brand-green/20 focus:outline-none focus:ring-2 focus:ring-brand-gold bg-brand-cream/30 text-brand-dark"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="email" className="block text-xs font-bold text-brand-dark uppercase tracking-wider">Your Email</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Enter your email"
                    className="w-full px-4 py-3 rounded-xl border border-brand-green/20 focus:outline-none focus:ring-2 focus:ring-brand-gold bg-brand-cream/30 text-brand-dark"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="subject" className="block text-xs font-bold text-brand-dark uppercase tracking-wider">Subject</label>
                <input
                  type="text"
                  id="subject"
                  name="subject"
                  required
                  value={formData.subject}
                  onChange={handleChange}
                  placeholder="What is this about?"
                  className="w-full px-4 py-3 rounded-xl border border-brand-green/20 focus:outline-none focus:ring-2 focus:ring-brand-gold bg-brand-cream/30 text-brand-dark"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="message" className="block text-xs font-bold text-brand-dark uppercase tracking-wider">Your Message</label>
                <textarea
                  id="message"
                  name="message"
                  required
                  rows={5}
                  value={formData.message}
                  onChange={handleChange}
                  placeholder="Describe your query in detail..."
                  className="w-full px-4 py-3 rounded-xl border border-brand-green/20 focus:outline-none focus:ring-2 focus:ring-brand-gold bg-brand-cream/30 text-brand-dark"
                ></textarea>
              </div>

              <button
                type="submit"
                className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 bg-brand-green hover:bg-brand-green/90 text-white font-bold px-8 py-3 rounded-xl shadow-md transition-all text-sm"
              >
                <span>Send Message</span>
                <Send className="h-4 w-4 text-brand-gold" />
              </button>
            </form>
          )}
        </div>
      </div>
      
    </div>
  );
}
