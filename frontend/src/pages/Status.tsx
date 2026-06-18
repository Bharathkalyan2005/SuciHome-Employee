import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, CheckCircle2, Clock, AlertTriangle, FileText } from 'lucide-react';
import { API_BASE_URL } from '../config';

interface ApplicationStatusDetails {
  id: string;
  fullName: string;
  position: string;
  status: 'PENDING' | 'SHORTLISTED' | 'REJECTED';
  createdAt: string;
  email: string;
  mobile: string;
}

export default function Status() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchId, setSearchId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [details, setDetails] = useState<ApplicationStatusDetails | null>(null);

  const idParam = searchParams.get('id');

  useEffect(() => {
    if (idParam) {
      setSearchId(idParam);
      fetchStatus(idParam);
    }
  }, [idParam]);

  const fetchStatus = async (appId: string) => {
    setLoading(true);
    setError('');
    setDetails(null);
    try {
      const res = await fetch(`${API_BASE_URL}/status/${appId.trim()}`);
      if (!res.ok) {
        if (res.status === 404) {
          throw new Error('Application ID not found. Please double check the ID format.');
        } else {
          throw new Error('Server error occurred. Please try again later.');
        }
      }
      const data = await res.json();
      setDetails(data);
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchId.trim()) {
      setSearchParams({ id: searchId.trim() });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SHORTLISTED':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'REJECTED':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-brand-gold bg-yellow-50 border-yellow-200';
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-16 space-y-12">
      
      {/* Title Header */}
      <div className="text-center space-y-3">
        <span className="text-brand-gold font-bold text-xs uppercase tracking-widest bg-brand-green/10 px-4 py-1.5 rounded-full">
          Track Progress
        </span>
        <h1 className="text-4xl font-extrabold text-brand-dark">
          Track Your Application
        </h1>
        <p className="text-brand-text max-w-lg mx-auto text-sm sm:text-base">
          Input your unique SuciHome Application ID below to view your real-time registration and screening status.
        </p>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-3xl p-8 border border-brand-green/10 shadow-sm space-y-6">
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-4 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="e.g. SH-EMP-20260618-A3K9P"
              value={searchId}
              onChange={(e) => setSearchId(e.target.value)}
              className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-brand-green/20 focus:outline-none focus:ring-2 focus:ring-brand-gold text-brand-dark font-medium placeholder-gray-400 bg-brand-cream/20"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="bg-brand-green hover:bg-brand-green/90 text-white font-extrabold px-8 py-3.5 rounded-xl transition-colors shadow-md disabled:opacity-50 flex items-center justify-center space-x-2"
          >
            {loading ? 'Searching...' : 'Check Status'}
          </button>
        </form>

        {error && (
          <div className="flex items-center space-x-2 text-red-600 bg-red-50 p-4 rounded-xl border border-red-200 text-sm font-medium">
            <AlertTriangle className="h-5 w-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Status Detail Display */}
      {details && (
        <div className="bg-white rounded-3xl border border-brand-green/10 shadow-sm overflow-hidden divide-y divide-brand-green/10">
          
          {/* Header Card */}
          <div className="p-8 bg-brand-dark text-white flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <p className="text-xs uppercase tracking-widest text-brand-gold font-bold">Application ID</p>
              <h2 className="text-2xl font-extrabold tracking-wider mt-0.5">{details.id}</h2>
            </div>
            <div className={`px-4 py-2 rounded-full border text-sm font-bold flex items-center space-x-1.5 ${getStatusColor(details.status)}`}>
              {details.status === 'SHORTLISTED' && <CheckCircle2 className="h-4 w-4" />}
              {details.status === 'PENDING' && <Clock className="h-4 w-4" />}
              {details.status === 'REJECTED' && <AlertTriangle className="h-4 w-4" />}
              <span className="capitalize">{details.status.toLowerCase()}</span>
            </div>
          </div>

          {/* Stepper Timeline */}
          <div className="p-8">
            <h3 className="text-xs font-extrabold uppercase text-brand-dark tracking-wider mb-6">Onboarding Timeline</h3>
            <div className="relative">
              {/* Stepper Line */}
              <div className="absolute left-6 top-6 bottom-6 w-1 bg-gray-200 rounded">
                <div 
                  className={`w-full bg-brand-green rounded transition-all duration-500 ${
                    details.status === 'SHORTLISTED' ? 'h-full' : 'h-1/2'
                  }`}
                />
              </div>

              {/* Step 1: Submission */}
              <div className="relative flex items-start space-x-4 mb-8">
                <div className="bg-brand-green text-white p-3 rounded-full z-10 shadow-sm">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-extrabold text-brand-dark">Application Submitted</h4>
                  <p className="text-xs text-brand-text font-medium">
                    Submitted on {new Date(details.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                  </p>
                  <p className="text-brand-text text-sm mt-1 leading-relaxed">
                    Your form details, profile photo, and Aadhaar numbers have been successfully encrypted and saved in our VRC database.
                  </p>
                </div>
              </div>

              {/* Step 2: Under Review */}
              <div className="relative flex items-start space-x-4 mb-8">
                <div className={`p-3 rounded-full z-10 shadow-sm ${
                  details.status === 'PENDING' ? 'bg-brand-gold text-brand-dark animate-pulse' : 'bg-brand-green text-white'
                }`}>
                  <Clock className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-extrabold text-brand-dark">HR Screening & Verification</h4>
                  <p className="text-xs text-brand-text font-medium">
                    {details.status === 'PENDING' ? 'Active' : 'Completed'}
                  </p>
                  <p className="text-brand-text text-sm mt-1 leading-relaxed">
                    Our HR verification team is matching your profile and credentials with regional staffing quotas.
                  </p>
                </div>
              </div>

              {/* Step 3: Decision */}
              <div className="relative flex items-start space-x-4">
                <div className={`p-3 rounded-full z-10 shadow-sm ${
                  details.status === 'PENDING' 
                    ? 'bg-gray-100 text-gray-400' 
                    : details.status === 'SHORTLISTED' 
                    ? 'bg-green-600 text-white' 
                    : 'bg-red-600 text-white'
                }`}>
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-extrabold text-brand-dark">Screening Decision</h4>
                  <p className="text-xs text-brand-text font-medium">
                    {details.status === 'PENDING' ? 'Pending Review' : 'Finalized'}
                  </p>
                  <p className="text-brand-text text-sm mt-1 leading-relaxed">
                    {details.status === 'PENDING' && 'Once review completes, your status will update here and you will receive a WhatsApp message.'}
                    {details.status === 'SHORTLISTED' && 'Congratulations! You are shortlisted. Our recruitment team from VRC Pvt Ltd will contact you shortly to coordinate your onboarding training.'}
                    {details.status === 'REJECTED' && 'Thank you for your interest in SuciHome. Regrettably, your profile does not meet our current requirements. We will hold your details in our talent pool for future vacancies.'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Details Table */}
          <div className="p-8">
            <h3 className="text-xs font-extrabold uppercase text-brand-dark tracking-wider mb-4">Applicant Summary</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-brand-text">
              <div className="flex justify-between border-b border-brand-green/5 py-2">
                <span className="font-bold">Full Name</span>
                <span>{details.fullName}</span>
              </div>
              <div className="flex justify-between border-b border-brand-green/5 py-2">
                <span className="font-bold">Position Applied</span>
                <span className="capitalize">{details.position.toLowerCase().replace('_', ' ')}</span>
              </div>
              <div className="flex justify-between border-b border-brand-green/5 py-2">
                <span className="font-bold">Email Address</span>
                <span>{details.email.replace(/(.{3})(.*)(@.*)/, '$1***$3')}</span>
              </div>
              <div className="flex justify-between border-b border-brand-green/5 py-2">
                <span className="font-bold">Mobile Number</span>
                <span>{details.mobile.slice(0, 6) + 'XXXX'}</span>
              </div>
            </div>
          </div>
          
        </div>
      )}
      
    </div>
  );
}
