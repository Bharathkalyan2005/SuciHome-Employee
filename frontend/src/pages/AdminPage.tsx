import { useState, useEffect } from 'react'
import api from '../lib/axiosInstance'
import toast from 'react-hot-toast'
import { Users, Clock, CheckCircle, XCircle, Search, Download, MessageSquare, Eye, RefreshCw, Send, Check, DollarSign, Activity, PlusCircle } from 'lucide-react'

interface Application {
  id: string;
  fullName: string;
  mobile: string;
  email: string;
  gender: string;
  dateOfBirth: string;
  address: string;
  city: string;
  state: string;
  pinCode: string;
  position: string;
  experience: number;
  expectedSalary: number;
  photoUrl: string;
  aadhaarFrontUrl: string;
  aadhaarBackUrl: string;
  resumeUrl: string | null;
  status: 'PENDING' | 'SHORTLISTED' | 'REJECTED';
  createdAt: string;
  preferredCities: string[];
  aadhaarDecrypted?: string;
  aadhaarMasked?: string;
}

interface Stats {
  total: number;
  pending: number;
  shortlisted: number;
  rejected: number;
}

export default function AdminPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [checking,   setChecking]   = useState(true)
  const [email,      setEmail]      = useState('')
  const [password,   setPassword]   = useState('')
  const [loading,    setLoading]    = useState(false)

  // Check existing session on load
  useEffect(() => {
    const token = localStorage.getItem('sucihome_admin_token')
    if (token) {
      try {
        const decoded = JSON.parse(atob(token.split('.')[1]))
        const expired = decoded.exp * 1000 < Date.now()
        if (!expired) {
          setIsLoggedIn(true)
        } else {
          localStorage.removeItem('sucihome_admin_token')
        }
      } catch {
        localStorage.removeItem('sucihome_admin_token')
      }
    }
    setChecking(false)
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await api.post('/auth/admin-login', {
        email, password
      })
      localStorage.setItem(
        'sucihome_admin_token', 
        res.data.token
      )
      setIsLoggedIn(true)
      toast.success('Welcome back, Admin!')
    } catch (err: any) {
      toast.error(
        err.response?.data?.error || 
        'Invalid email or password'
      )
    } finally {
      setLoading(false)
    }
  }

  if (checking) return null

  // LOGIN FORM — shown when not logged in
  if (!isLoggedIn) {
    return (
      <div style={{
        minHeight     : '100vh',
        background    : '#F5F0E8',
        display       : 'flex',
        alignItems    : 'center',
        justifyContent: 'center',
        padding       : '24px',
      }}>
        <form
          onSubmit={handleLogin}
          style={{
            background   : '#FFFFFF',
            borderRadius : '24px',
            padding      : '40px',
            width        : '100%',
            maxWidth     : '400px',
            boxShadow    : '0 8px 40px rgba(27,67,50,0.12)',
            border       : '1px solid rgba(27,67,50,0.1)',
          }}
        >
          <div style={{ textAlign: 'center', marginBottom: '28px' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '12px' }}>
              <img 
                src="/logo.png" 
                alt="SuciHome Logo" 
                style={{ height: '56px', width: 'auto' }}
              />
            </div>
            <h2 style={{
              color     : '#0D2B1F',
              fontSize  : '22px',
              fontWeight: '700',
              fontFamily: 'serif',
              margin    : '0 0 4px',
            }}>
              Admin Login
            </h2>
            <p style={{ color: '#5C6B5E', fontSize: '13px', margin: '0' }}>
              HR Dashboard Access
            </p>
          </div>

          <label style={{
            color: '#2D4A35', fontSize: '13px',
            fontWeight: '600', display: 'block',
            marginBottom: '6px',
          }}>
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="Welcome@vrcpvtltd.com"
            required
            style={{
              width       : '100%',
              padding     : '12px 14px',
              border      : '1px solid rgba(27,67,50,0.2)',
              borderRadius: '10px',
              marginBottom: '16px',
              fontSize    : '14px',
              outline     : 'none',
              boxSizing   : 'border-box'
            }}
          />

          <label style={{
            color: '#2D4A35', fontSize: '13px',
            fontWeight: '600', display: 'block',
            marginBottom: '6px',
          }}>
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            style={{
              width       : '100%',
              padding     : '12px 14px',
              border      : '1px solid rgba(27,67,50,0.2)',
              borderRadius: '10px',
              marginBottom: '24px',
              fontSize    : '14px',
              outline     : 'none',
              boxSizing   : 'border-box'
            }}
          />

          <button
            type="submit"
            disabled={loading}
            style={{
              width       : '100%',
              padding     : '14px',
              background  : '#1B4332',
              color       : '#FFFFFF',
              border      : 'none',
              borderRadius: '12px',
              fontWeight  : '700',
              fontSize    : '15px',
              cursor      : loading ? 'wait' : 'pointer',
              opacity     : loading ? 0.7 : 1,
            }}
          >
            {loading ? 'Logging in...' : 'Login to Dashboard'}
          </button>
        </form>
      </div>
    )
  }

  // DASHBOARD — shown when logged in
  return (
    <AdminDashboard
      onLogout={() => {
        localStorage.removeItem('sucihome_admin_token')
        setIsLoggedIn(false)
      }}
    />
  )
}

function AdminDashboard({ onLogout }: { onLogout: () => void }) {
  const [currentView, setCurrentView] = useState<'applications' | 'earnings'>('applications');
  
  // Hiring states
  const [showHireModal, setShowHireModal] = useState(false);
  const [hirePin, setHirePin] = useState('');
  const [hiring, setHiring] = useState(false);

  // Earnings & Payouts state
  const [activeEmployees, setActiveEmployees] = useState<any[]>([]);
  const [earningsSummary, setEarningsSummary] = useState<any>({ todayTotal: 0, pendingPayouts: 0, monthTotal: 0, activeCleaners: 0 });
  const [allEarnings, setAllEarnings] = useState<any[]>([]);
  const [payoutRequests, setPayoutRequests] = useState<any[]>([]);
  
  // Filters for Earnings Table
  const [earnEmployeeId, setEarnEmployeeId] = useState('');
  const [earnCity, setEarnCity] = useState('');
  const [earnFromDate, setEarnFromDate] = useState('');
  const [earnToDate, setEarnToDate] = useState('');
  const [earnStatus, setEarnStatus] = useState('');
  const [selectedEarnIds, setSelectedEarnIds] = useState<string[]>([]);

  // Log Earning Form State
  const [logEmployeeId, setLogEmployeeId] = useState('');
  const [logDate, setLogDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [logJobs, setLogJobs] = useState('');
  const [logBase, setLogBase] = useState('');
  const [logBonus, setLogBonus] = useState('');
  const [logNotes, setLogNotes] = useState('');
  const [logLoading, setLogLoading] = useState(false);

  // Payout action modal state
  const [payoutActionRequest, setPayoutActionRequest] = useState<any | null>(null);
  const [payoutActionStatus, setPayoutActionStatus] = useState<'APPROVED' | 'REJECTED' | 'PAID'>('PAID');
  const [paidTxnId, setPaidTxnId] = useState('');
  const [payoutAdminNotes, setPayoutAdminNotes] = useState('');
  const [payoutActionLoading, setPayoutActionLoading] = useState(false);

  const [applications, setApplications] = useState<Application[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, pending: 0, shortlisted: 0, rejected: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPosition, setFilterPosition] = useState('');

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkMessage, setBulkMessage] = useState('Dear {name}, we are pleased to inform you that you have been shortlisted for the SuciHome role. Please report to VRC Office on Monday. Contact: 9392420643.');
  const [bulkSending, setBulkSending] = useState(false);
  const [bulkSuccessMsg, setBulkSuccessMsg] = useState('');

  const [activeApp, setActiveApp] = useState<Application | null>(null);

  useEffect(() => {
    fetchData();
  }, [filterStatus, filterPosition]);

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const statsRes = await api.get('/admin/stats');
      setStats(statsRes.data);

      let url = '/admin/applications?';
      if (filterStatus) url += `status=${filterStatus}&`;
      if (filterPosition) url += `position=${filterPosition}&`;
      if (search) url += `search=${encodeURIComponent(search)}&`;

      const appRes = await api.get(url);
      setApplications(appRes.data);
    } catch (err: any) {
      const errMsg = err.response?.data?.error || err.message || 'Error syncing database records';
      setError(errMsg);
      if (err.response?.status === 401 || err.response?.status === 403) {
        onLogout();
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchEarningsData = async () => {
    try {
      const [empRes, summaryRes, earnRes, payoutRes] = await Promise.all([
        api.get('/admin/employees/active'),
        api.get('/admin/summary'),
        api.get(`/admin/all?employeeId=${earnEmployeeId}&city=${earnCity}&fromDate=${earnFromDate}&toDate=${earnToDate}&status=${earnStatus}`),
        api.get('/admin/payout-requests')
      ]);

      setActiveEmployees(empRes.data.employees);
      setEarningsSummary(summaryRes.data);
      setAllEarnings(earnRes.data.earnings);
      setPayoutRequests(payoutRes.data.requests);
    } catch (err) {
      console.error('Error fetching earnings data:', err);
      toast.error('Failed to sync earnings records');
    }
  };

  useEffect(() => {
    if (currentView === 'earnings') {
      fetchEarningsData();
    }
  }, [currentView, earnEmployeeId, earnCity, earnFromDate, earnToDate, earnStatus]);

  const handleLogEarning = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!logEmployeeId || !logDate || !logBase) {
      toast.error('Please enter employee, date and base amount');
      return;
    }
    setLogLoading(true);
    try {
      await api.post('/admin/log', {
        employeeId: logEmployeeId,
        date: logDate,
        jobsCompleted: parseInt(logJobs) || 0,
        baseAmount: parseFloat(logBase),
        bonusAmount: parseFloat(logBonus) || 0,
        notes: logNotes
      });
      toast.success('Daily earning logged successfully!');
      setLogJobs('');
      setLogBase('');
      setLogBonus('');
      setLogNotes('');
      fetchEarningsData();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to log daily earning');
    } finally {
      setLogLoading(false);
    }
  };

  const handlePayoutAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payoutActionRequest) return;
    setPayoutActionLoading(true);
    try {
      await api.patch(`/admin/payout-requests/${payoutActionRequest.id}`, {
        status: payoutActionStatus,
        adminNotes: payoutAdminNotes,
        paidVia: payoutActionStatus === 'PAID' ? paidTxnId : undefined
      });
      toast.success(`Payout request marked as ${payoutActionStatus}`);
      setPayoutActionRequest(null);
      setPaidTxnId('');
      setPayoutAdminNotes('');
      fetchEarningsData();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to update payout status');
    } finally {
      setPayoutActionLoading(false);
    }
  };

  const handleBulkPay = async () => {
    if (selectedEarnIds.length === 0) return;
    try {
      await api.post('/admin/bulk-pay', { ids: selectedEarnIds });
      toast.success('Marked selected entries as PAID');
      setSelectedEarnIds([]);
      fetchEarningsData();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to pay selected entries');
    }
  };

  const handleHire = async (appId: string) => {
    if (!/^\d{4}$/.test(hirePin)) {
      toast.error('PIN must be exactly 4 digits');
      return;
    }
    setHiring(true);
    try {
      await api.post('/admin/employees/hire', { applicationId: appId, pin: hirePin });
      toast.success('Candidate hired successfully! Employee record created.');
      setShowHireModal(false);
      setHirePin('');
      fetchData();
      setActiveApp(null);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to hire candidate');
    } finally {
      setHiring(false);
    }
  };

  const updateStatus = async (appId: string, status: 'SHORTLISTED' | 'REJECTED') => {
    try {
      await api.patch(`/admin/applications/${appId}/status`, { status });
      setApplications(prev => prev.map(app => app.id === appId ? { ...app, status } : app));
      if (activeApp && activeApp.id === appId) {
        setActiveApp(prev => prev ? { ...prev, status } : null);
      }
      toast.success(`Candidate status updated to ${status}`);
      fetchData();
    } catch (err: any) {
      const errMsg = err.response?.data?.error || err.message || 'Failed to update status';
      toast.error(errMsg);
    }
  };

  const handleCSVExport = async () => {
    try {
      const res = await api.get('/admin/applications/export', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `sucihome_applicants_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      toast.success('CSV Export successful!');
    } catch (err: any) {
      toast.error('Failed to export CSV file');
    }
  };

  const handleSelectRow = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedIds.length === applications.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(applications.map(app => app.id));
    }
  };

  const handleBulkWhatsAppSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedIds.length === 0) {
      toast.error('Please select at least one applicant.');
      return;
    }
    setBulkSending(true);
    setBulkSuccessMsg('');
    try {
      const res = await api.post('/admin/applications/bulk-whatsapp', { ids: selectedIds, message: bulkMessage });
      setBulkSuccessMsg(res.data.message);
      toast.success(res.data.message);
      setSelectedIds([]);
    } catch (err: any) {
      const errMsg = err.response?.data?.error || err.message || 'Error dispatching bulk WhatsApp campaigns';
      toast.error(errMsg);
    } finally {
      setBulkSending(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'SHORTLISTED':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'REJECTED':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header and Logout */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-brand-dark">Admin Dashboard</h1>
          <p className="text-brand-text text-sm">Review applications, filter fields, export databases, and dispatch WhatsApp alerts.</p>
        </div>
        <button
          onClick={onLogout}
          className="bg-brand-cream border border-brand-green/10 text-brand-green hover:bg-red-50 hover:text-red-600 hover:border-red-200 font-bold px-6 py-2.5 rounded-xl text-sm transition-all shadow-sm"
        >
          Sign Out
        </button>
      </div>

      {/* Tabs */}
      <div className="flex space-x-2 border-b border-brand-green/10 pb-4">
        <button
          onClick={() => setCurrentView('applications')}
          className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
            currentView === 'applications'
              ? 'bg-brand-green text-white shadow-sm'
              : 'text-brand-text hover:bg-brand-lightGreen hover:text-brand-green'
          }`}
        >
          📋 Applications Onboarding
        </button>
        <button
          onClick={() => setCurrentView('earnings')}
          className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
            currentView === 'earnings'
              ? 'bg-brand-green text-white shadow-sm'
              : 'text-brand-text hover:bg-brand-lightGreen hover:text-brand-green'
          }`}
        >
          💰 Earnings & Payouts
        </button>
      </div>

      {currentView === 'applications' && (
        <>
          {/* Statistics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-brand-green/5 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Applications</p>
            <h3 className="text-3xl font-extrabold text-brand-dark">{stats.total}</h3>
          </div>
          <div className="bg-brand-lightGreen p-3.5 rounded-xl text-brand-green">
            <Users className="h-6 w-6" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-brand-green/5 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Pending Screening</p>
            <h3 className="text-3xl font-extrabold text-brand-dark">{stats.pending}</h3>
          </div>
          <div className="bg-yellow-50 p-3.5 rounded-xl text-brand-gold">
            <Clock className="h-6 w-6" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-brand-green/5 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Shortlisted Candidates</p>
            <h3 className="text-3xl font-extrabold text-green-700">{stats.shortlisted}</h3>
          </div>
          <div className="bg-green-50 p-3.5 rounded-xl text-green-600">
            <CheckCircle className="h-6 w-6" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-brand-green/5 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Rejected Applications</p>
            <h3 className="text-3xl font-extrabold text-red-700">{stats.rejected}</h3>
          </div>
          <div className="bg-red-50 p-3.5 rounded-xl text-red-600">
            <XCircle className="h-6 w-6" />
          </div>
        </div>
      </div>

      {/* Main Grid: Database Table + WhatsApp Tool */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Table & Filters (Left 3 cols) */}
        <div className="lg:col-span-3 space-y-6">
          {error && (
            <div className="flex items-center space-x-2 text-red-600 bg-red-50 p-4 rounded-xl border border-red-200 text-sm font-medium">
              <AlertCircleIcon className="h-5 w-5 shrink-0" />
              <span>{error}</span>
            </div>
          )}
          <div className="bg-white rounded-3xl border border-brand-green/10 shadow-sm overflow-hidden">
            
            {/* Filters Bar */}
            <div className="p-6 bg-brand-cream/30 border-b border-brand-green/10 flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="w-full md:w-auto flex flex-col sm:flex-row gap-4 items-center flex-1">
                {/* Search */}
                <div className="relative w-full sm:max-w-xs">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search name, phone, ID..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 rounded-xl border border-brand-green/20 focus:outline-none focus:ring-1 focus:ring-brand-gold bg-white text-xs sm:text-sm text-brand-dark"
                  />
                </div>
                {/* Filter Position */}
                <select
                  value={filterPosition}
                  onChange={(e) => setFilterPosition(e.target.value)}
                  className="w-full sm:w-auto px-3 py-2 rounded-xl border border-brand-green/20 focus:outline-none focus:ring-1 focus:ring-brand-gold bg-white text-xs sm:text-sm text-brand-dark"
                >
                  <option value="">All Positions</option>
                  <option value="CLEANER">Cleaner</option>
                  <option value="SUPERVISOR">Supervisor</option>
                  <option value="SAFETY_OFFICER">Safety Officer</option>
                  <option value="MANAGER">Manager</option>
                </select>
                {/* Filter Status */}
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full sm:w-auto px-3 py-2 rounded-xl border border-brand-green/20 focus:outline-none focus:ring-1 focus:ring-brand-gold bg-white text-xs sm:text-sm text-brand-dark"
                >
                  <option value="">All Statuses</option>
                  <option value="PENDING">Pending</option>
                  <option value="SHORTLISTED">Shortlisted</option>
                  <option value="REJECTED">Rejected</option>
                </select>

                <button
                  onClick={fetchData}
                  className="bg-brand-lightGreen text-brand-green p-2.5 rounded-xl hover:bg-brand-green hover:text-white transition-all shadow-sm"
                >
                  <RefreshCw className="h-4 w-4" />
                </button>
              </div>

              {/* Actions */}
              <button
                onClick={handleCSVExport}
                className="w-full md:w-auto flex items-center justify-center space-x-2 bg-brand-gold hover:bg-brand-gold/90 text-brand-dark font-extrabold px-5 py-2.5 rounded-xl text-sm transition-colors shadow-sm"
              >
                <Download className="h-4 w-4" />
                <span>Export CSV</span>
              </button>
            </div>

            {/* Table Area */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-brand-text">
                <thead>
                  <tr className="bg-brand-cream/10 border-b border-brand-green/10 text-[10px] font-bold uppercase tracking-wider text-brand-dark">
                    <th className="py-4 px-6 text-center">
                      <input
                        type="checkbox"
                        checked={selectedIds.length === applications.length && applications.length > 0}
                        onChange={handleSelectAll}
                        className="h-4 w-4 text-brand-green focus:ring-brand-gold rounded cursor-pointer"
                      />
                    </th>
                    <th className="py-4 px-6">ID & Name</th>
                    <th className="py-4 px-6">Job position</th>
                    <th className="py-4 px-6">Exp (Yrs)</th>
                    <th className="py-4 px-6">Expected Pay</th>
                    <th className="py-4 px-6">Aadhaar (Decrypted)</th>
                    <th className="py-4 px-6">Status</th>
                    <th className="py-4 px-6 text-right">Review</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-green/5 text-sm">
                  {loading ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-gray-400 font-bold">
                        Syncing database records...
                      </td>
                    </tr>
                  ) : applications.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-gray-400 font-bold">
                        No applications matched your filter query.
                      </td>
                    </tr>
                  ) : (
                    applications.map((app) => (
                      <tr key={app.id} className="hover:bg-brand-lightGreen/20 transition-colors">
                        <td className="py-4 px-6 text-center">
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(app.id)}
                            onChange={() => handleSelectRow(app.id)}
                            className="h-4 w-4 text-brand-green focus:ring-brand-gold rounded cursor-pointer"
                          />
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex flex-col">
                            <span className="font-extrabold text-brand-dark leading-tight">{app.fullName}</span>
                            <span className="text-[10px] font-bold text-gray-400 mt-0.5">{app.id}</span>
                          </div>
                        </td>
                        <td className="py-4 px-6 capitalize font-semibold text-xs text-brand-dark">
                          {app.position.toLowerCase().replace('_', ' ')}
                        </td>
                        <td className="py-4 px-6 font-semibold">{app.experience} yrs</td>
                        <td className="py-4 px-6 font-bold text-brand-dark">₹{app.expectedSalary.toLocaleString()}</td>
                        <td className="py-4 px-6 font-mono text-xs">{app.aadhaarMasked}</td>
                        <td className="py-4 px-6">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${getStatusBadge(app.status)}`}>
                            {app.status}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-right">
                          <button
                            onClick={() => setActiveApp(app)}
                            className="bg-brand-cream border border-brand-green/10 text-brand-green hover:bg-brand-green hover:text-white p-2 rounded-xl transition-all shadow-xs"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

          </div>
        </div>

        {/* WhatsApp Panel (Right 1 col) */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-brand-green/10 shadow-sm space-y-6">
            <h2 className="text-xl font-extrabold text-brand-dark flex items-center space-x-2">
              <MessageSquare className="h-5 w-5 text-brand-gold" />
              <span>Bulk WhatsApp Campaign</span>
            </h2>

            <div className="space-y-2">
              <p className="text-xs text-brand-text leading-relaxed font-semibold">
                Select candidates using checkboxes in the table to queue messages.
              </p>
              <div className="bg-brand-lightGreen/50 px-3 py-1.5 rounded-lg border border-brand-green/10 flex justify-between items-center text-xs">
                <span className="font-bold text-brand-green">Selected:</span>
                <span className="font-extrabold bg-brand-green text-white px-2 py-0.5 rounded-md">
                  {selectedIds.length} applicants
                </span>
              </div>
            </div>

            {bulkSuccessMsg && (
              <div className="flex items-start space-x-2 text-green-700 bg-green-50 p-3.5 rounded-xl border border-green-200 text-xs font-semibold">
                <Check className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{bulkSuccessMsg}</span>
              </div>
            )}

            <form onSubmit={handleBulkWhatsAppSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="block text-[10px] font-bold text-brand-dark uppercase tracking-wider">Message Template</label>
                <textarea
                  required
                  rows={6}
                  value={bulkMessage}
                  onChange={(e) => setBulkMessage(e.target.value)}
                  placeholder="e.g. Hi {name}, details here..."
                  className="w-full px-3 py-2 rounded-xl border border-brand-green/20 focus:outline-none focus:ring-1 focus:ring-brand-gold bg-brand-cream/10 text-xs leading-relaxed text-brand-dark"
                />
                <span className="text-[10px] text-gray-400 block font-medium">Use <code>{'{name}'}</code> to personalize applicant full name dynamically.</span>
              </div>

              <button
                type="submit"
                disabled={bulkSending || selectedIds.length === 0}
                className="w-full bg-brand-green hover:bg-brand-green/90 text-white font-extrabold py-3 rounded-xl transition-all shadow-md disabled:opacity-50 flex items-center justify-center space-x-2 text-xs"
              >
                <Send className="h-3.5 w-3.5 text-brand-gold" />
                <span>{bulkSending ? 'Sending campaign...' : 'Send WhatsApp Campaign'}</span>
              </button>
            </form>
          </div>
        </div>

      </div>
      </>
      )}

      {/* Earnings & Payouts Tab View */}
      {currentView === 'earnings' && (
        <div className="space-y-8 animate-fade-in">
          
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-brand-green/5 shadow-sm flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Today's Total Logged</p>
                <h3 className="text-3xl font-extrabold text-brand-dark">₹{earningsSummary.todayTotal}</h3>
              </div>
              <div className="bg-brand-lightGreen p-3.5 rounded-xl text-brand-green">
                <DollarSign className="h-6 w-6 text-brand-gold" />
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-brand-green/5 shadow-sm flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Pending Payouts</p>
                <h3 className="text-3xl font-extrabold text-brand-gold">{earningsSummary.pendingPayouts}</h3>
              </div>
              <div className="bg-yellow-50 p-3.5 rounded-xl text-brand-gold">
                <Clock className="h-6 w-6" />
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-brand-green/5 shadow-sm flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">This Month Total</p>
                <h3 className="text-3xl font-extrabold text-green-700">₹{earningsSummary.monthTotal}</h3>
              </div>
              <div className="bg-green-50 p-3.5 rounded-xl text-green-600">
                <Activity className="h-6 w-6" />
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-brand-green/5 shadow-sm flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Active Cleaners</p>
                <h3 className="text-3xl font-extrabold text-brand-dark">{earningsSummary.activeCleaners}</h3>
              </div>
              <div className="bg-brand-lightGreen p-3.5 rounded-xl text-brand-green">
                <Users className="h-6 w-6" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Left Col: Log Daily Earning form */}
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-white rounded-3xl p-6 border border-brand-green/10 shadow-sm space-y-6">
                <h2 className="text-xl font-extrabold text-brand-dark flex items-center space-x-2 border-b border-brand-green/5 pb-2">
                  <PlusCircle className="h-5 w-5 text-brand-gold" />
                  <span>Log Daily Earning</span>
                </h2>

                <form onSubmit={handleLogEarning} className="space-y-4">
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-brand-dark uppercase tracking-wider">Select Employee</label>
                    <select
                      required
                      value={logEmployeeId}
                      onChange={e => setLogEmployeeId(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-brand-green/20 focus:outline-none focus:ring-1 focus:ring-brand-gold bg-white text-xs text-brand-dark"
                    >
                      <option value="">-- Select Employee --</option>
                      {activeEmployees.map((emp: any) => (
                        <option key={emp.id} value={emp.id}>
                          {emp.fullName} ({emp.jobPosition.toLowerCase()})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-brand-dark uppercase tracking-wider">Date</label>
                    <input
                      type="date"
                      required
                      value={logDate}
                      onChange={e => setLogDate(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-brand-green/20 focus:outline-none focus:ring-1 focus:ring-brand-gold bg-white text-xs text-brand-dark cursor-pointer"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-brand-dark uppercase tracking-wider">Jobs Completed</label>
                    <input
                      type="number"
                      required
                      placeholder="e.g. 3"
                      value={logJobs}
                      onChange={e => setLogJobs(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-brand-green/20 focus:outline-none focus:ring-1 focus:ring-brand-gold bg-white text-xs text-brand-dark"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-brand-dark uppercase tracking-wider">Base Amount (₹)</label>
                    <input
                      type="number"
                      required
                      placeholder="e.g. 450"
                      value={logBase}
                      onChange={e => setLogBase(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-brand-green/20 focus:outline-none focus:ring-1 focus:ring-brand-gold bg-white text-xs text-brand-dark"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-brand-dark uppercase tracking-wider">Bonus Amount (₹, optional)</label>
                    <input
                      type="number"
                      placeholder="e.g. 50"
                      value={logBonus}
                      onChange={e => setLogBonus(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-brand-green/20 focus:outline-none focus:ring-1 focus:ring-brand-gold bg-white text-xs text-brand-dark"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-brand-dark uppercase tracking-wider">Notes (optional)</label>
                    <textarea
                      placeholder="Enter notes..."
                      rows={2}
                      value={logNotes}
                      onChange={e => setLogNotes(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-brand-green/20 focus:outline-none focus:ring-1 focus:ring-brand-gold bg-white text-xs text-brand-dark"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={logLoading}
                    className="w-full bg-brand-green hover:bg-brand-green/90 text-white font-extrabold py-3 rounded-xl transition-all shadow-md disabled:opacity-50 text-xs"
                  >
                    {logLoading ? 'Saving Entry...' : 'Save Entry'}
                  </button>
                </form>
              </div>
            </div>

            {/* Right Col: Earnings Table & Payout Requests (2 cols) */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Payout Requests Tab */}
              <div className="bg-white rounded-3xl p-6 border border-brand-green/10 shadow-sm space-y-4">
                <h2 className="text-xl font-extrabold text-brand-dark border-b border-brand-green/5 pb-2">
                  Payout Requests
                </h2>
                
                {payoutRequests.length === 0 ? (
                  <p className="text-center py-6 text-gray-400 font-semibold text-sm">No payout requests found.</p>
                ) : (
                  <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                    {payoutRequests.map((req: any) => (
                      <div key={req.id} className="p-4 bg-brand-cream/20 border border-brand-green/5 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-sm">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-brand-dark">{req.requestId}</span>
                            <span className="text-[10px] font-bold text-gray-400">{req.employee.fullName} ({req.employee.city})</span>
                          </div>
                          <p className="text-xs text-brand-text font-semibold">
                            ₹{req.amount} | {req.method} | {new Date(req.fromDate).toLocaleDateString()} to {new Date(req.toDate).toLocaleDateString()}
                          </p>
                          {req.method === 'UPI' && req.upiId && <p className="text-[10px] text-gray-400 font-mono">UPI ID: {req.upiId}</p>}
                          {req.method === 'BANK_TRANSFER' && req.bankAccount && <p className="text-[10px] text-gray-400 font-mono">Bank: {req.bankAccount} | {req.bankIfsc}</p>}
                        </div>
                        <div className="flex gap-2 w-full sm:w-auto">
                          {req.status === 'PENDING' ? (
                            <>
                              <button
                                onClick={() => {
                                  setPayoutActionRequest(req);
                                  setPayoutActionStatus('APPROVED');
                                }}
                                className="bg-green-600 hover:bg-green-700 text-white font-bold px-3 py-1.5 rounded-lg text-xs"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => {
                                  setPayoutActionRequest(req);
                                  setPayoutActionStatus('REJECTED');
                                }}
                                className="bg-red-600 hover:bg-red-700 text-white font-bold px-3 py-1.5 rounded-lg text-xs"
                              >
                                Reject
                              </button>
                            </>
                          ) : req.status === 'APPROVED' ? (
                            <button
                              onClick={() => {
                                setPayoutActionRequest(req);
                                setPayoutActionStatus('PAID');
                              }}
                              className="bg-brand-gold hover:bg-brand-gold/90 text-brand-dark font-extrabold px-3 py-1.5 rounded-lg text-xs"
                            >
                              Mark as Paid
                            </button>
                          ) : (
                            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">{req.status}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Earnings Table */}
              <div className="bg-white rounded-3xl border border-brand-green/10 shadow-sm overflow-hidden">
                <div className="p-6 bg-brand-cream/30 border-b border-brand-green/10 space-y-4">
                  <h2 className="text-xl font-extrabold text-brand-dark">Earnings Table</h2>
                  
                  {/* Filters */}
                  <div className="flex flex-wrap items-center gap-3">
                    <select
                      value={earnEmployeeId}
                      onChange={e => setEarnEmployeeId(e.target.value)}
                      className="px-3 py-2 rounded-xl border border-brand-green/20 focus:outline-none focus:ring-1 focus:ring-brand-gold bg-white text-xs text-brand-dark"
                    >
                      <option value="">All Employees</option>
                      {activeEmployees.map((emp: any) => (
                        <option key={emp.id} value={emp.id}>{emp.fullName}</option>
                      ))}
                    </select>

                    <input
                      type="text"
                      placeholder="City..."
                      value={earnCity}
                      onChange={e => setEarnCity(e.target.value)}
                      className="px-3 py-2 rounded-xl border border-brand-green/20 focus:outline-none focus:ring-1 focus:ring-brand-gold bg-white text-xs text-brand-dark"
                    />

                    <input
                      type="date"
                      value={earnFromDate}
                      onChange={e => setEarnFromDate(e.target.value)}
                      className="px-3 py-2 rounded-xl border border-brand-green/20 focus:outline-none focus:ring-1 focus:ring-brand-gold bg-white text-xs text-brand-dark"
                    />

                    <input
                      type="date"
                      value={earnToDate}
                      onChange={e => setEarnToDate(e.target.value)}
                      className="px-3 py-2 rounded-xl border border-brand-green/20 focus:outline-none focus:ring-1 focus:ring-brand-gold bg-white text-xs text-brand-dark"
                    />

                    <select
                      value={earnStatus}
                      onChange={e => setEarnStatus(e.target.value)}
                      className="px-3 py-2 rounded-xl border border-brand-green/20 focus:outline-none focus:ring-1 focus:ring-brand-gold bg-white text-xs text-brand-dark"
                    >
                      <option value="">All Statuses</option>
                      <option value="UNPAID">Unpaid</option>
                      <option value="REQUESTED">Requested</option>
                      <option value="PAID">Paid</option>
                    </select>

                    {selectedEarnIds.length > 0 && (
                      <button
                        onClick={handleBulkPay}
                        className="bg-brand-gold hover:bg-brand-gold/90 text-brand-dark font-extrabold py-2 px-3 rounded-xl text-xs transition-colors"
                      >
                        Paid Selected ({selectedEarnIds.length})
                      </button>
                    )}
                  </div>
                </div>

                <div className="overflow-x-auto max-h-[300px] overflow-y-auto">
                  <table className="w-full text-left border-collapse text-brand-text">
                    <thead>
                      <tr className="bg-brand-cream/10 border-b border-brand-green/10 text-[10px] font-bold uppercase tracking-wider text-brand-dark">
                        <th className="py-3 px-4 text-center">
                          <input
                            type="checkbox"
                            checked={selectedEarnIds.length === allEarnings.length && allEarnings.length > 0}
                            onChange={() => {
                              if (selectedEarnIds.length === allEarnings.length) {
                                setSelectedEarnIds([]);
                              } else {
                                setSelectedEarnIds(allEarnings.map(e => e.id));
                              }
                            }}
                            className="h-3.5 w-3.5 text-brand-green focus:ring-brand-gold rounded cursor-pointer"
                          />
                        </th>
                        <th className="py-3 px-4">Date</th>
                        <th className="py-3 px-4">Employee</th>
                        <th className="py-3 px-4">Jobs</th>
                        <th className="py-3 px-4">Amount</th>
                        <th className="py-3 px-4">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-brand-green/5 text-xs">
                      {allEarnings.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-8 text-center text-gray-400 font-bold">
                            No daily earnings match the filters.
                          </td>
                        </tr>
                      ) : (
                        allEarnings.map((e: any) => (
                          <tr key={e.id} className="hover:bg-brand-lightGreen/20 transition-colors">
                            <td className="py-3 px-4 text-center">
                              <input
                                type="checkbox"
                                checked={selectedEarnIds.includes(e.id)}
                                onChange={() => {
                                  setSelectedEarnIds(prev =>
                                    prev.includes(e.id) ? prev.filter(x => x !== e.id) : [...prev, e.id]
                                  );
                                }}
                                className="h-3.5 w-3.5 text-brand-green focus:ring-brand-gold rounded cursor-pointer"
                              />
                            </td>
                            <td className="py-3 px-4 font-bold text-brand-dark">
                              {new Date(e.date).toLocaleDateString()}
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex flex-col">
                                <span className="font-extrabold text-brand-dark">{e.employee.fullName}</span>
                                <span className="text-[9px] text-gray-400">{e.employee.city}</span>
                              </div>
                            </td>
                            <td className="py-3 px-4 font-semibold">{e.jobsCompleted}</td>
                            <td className="py-3 px-4 font-bold text-brand-dark">₹{parseFloat(e.totalAmount)}</td>
                            <td className="py-3 px-4">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                e.status === 'PAID' ? 'bg-green-100 text-green-800 border-green-200' :
                                e.status === 'REQUESTED' ? 'bg-purple-100 text-purple-800 border-purple-200' :
                                'bg-yellow-100 text-yellow-800 border-yellow-200'
                              }`}>
                                {e.status}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>

          </div>

        </div>
      )}

      {/* Document Viewer Modal */}
      {activeApp && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-brand-dark/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-3xl w-full border border-brand-green/10 shadow-2xl overflow-hidden">
            
            {/* Modal Header */}
            <div className="p-6 bg-brand-dark text-white flex justify-between items-center border-b-2 border-brand-gold">
              <div className="flex items-center space-x-4">
                <img
                  src={activeApp.photoUrl}
                  alt={activeApp.fullName}
                  className="w-12 h-12 rounded-full object-cover border-2 border-brand-gold shadow"
                />
                <div>
                  <h3 className="text-xl font-extrabold leading-none">{activeApp.fullName}</h3>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-brand-gold mt-1 inline-block">
                    {activeApp.position.replace('_', ' ')} Applied
                  </span>
                </div>
              </div>
              <button
                onClick={() => setActiveApp(null)}
                className="bg-brand-green hover:bg-red-50 hover:text-red-600 px-3.5 py-1.5 rounded-xl text-sm font-bold border border-brand-gold/15"
              >
                Close
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-8 space-y-6 max-h-[70vh] overflow-y-auto">
              
              {/* Status Update Actions */}
              <div className="bg-brand-cream/40 border border-brand-green/10 p-4 rounded-2xl flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-bold text-brand-dark uppercase tracking-wider">Review Status:</span>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusBadge(activeApp.status)}`}>
                    {activeApp.status}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2 w-full sm:w-auto justify-end">
                  <button
                    onClick={() => setShowHireModal(true)}
                    className="flex-1 sm:flex-initial bg-brand-gold hover:bg-brand-gold/90 text-brand-dark font-extrabold px-4 py-2 rounded-xl text-xs shadow transition-colors"
                  >
                    🤝 Hire Candidate (Set PIN)
                  </button>
                  <button
                    onClick={() => updateStatus(activeApp.id, 'SHORTLISTED')}
                    className="flex-1 sm:flex-initial bg-green-600 hover:bg-green-700 text-white font-bold px-4 py-2 rounded-xl text-xs shadow transition-colors"
                  >
                    Shortlist Candidate
                  </button>
                  <button
                    onClick={() => updateStatus(activeApp.id, 'REJECTED')}
                    className="flex-1 sm:flex-initial bg-red-600 hover:bg-red-700 text-white font-bold px-4 py-2 rounded-xl text-xs shadow transition-colors"
                  >
                    Reject Application
                  </button>
                </div>
              </div>

              {/* Data Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm text-brand-text border-b border-brand-green/10 pb-6">
                <div>
                  <h4 className="text-xs font-extrabold uppercase text-brand-dark tracking-wider mb-2">Onboarding Fields</h4>
                  <div className="space-y-2">
                    <p className="flex justify-between py-1 border-b border-brand-green/5">
                      <span className="font-bold">Contact No:</span>
                      <a href={`tel:${activeApp.mobile}`} className="hover:text-brand-gold transition-colors">{activeApp.mobile}</a>
                    </p>
                    <p className="flex justify-between py-1 border-b border-brand-green/5">
                      <span className="font-bold">Email:</span>
                      <a href={`mailto:${activeApp.email}`} className="hover:text-brand-gold transition-colors">{activeApp.email}</a>
                    </p>
                    <p className="flex justify-between py-1 border-b border-brand-green/5">
                      <span className="font-bold">Aadhaar (Decrypted):</span>
                      <span className="font-mono font-bold tracking-widest">{activeApp.aadhaarDecrypted}</span>
                    </p>
                    <p className="flex justify-between py-1 border-b border-brand-green/5">
                      <span className="font-bold">DOB:</span>
                      <span>{new Date(activeApp.dateOfBirth).toLocaleDateString()}</span>
                    </p>
                    <p className="flex justify-between py-1 border-b border-brand-green/5">
                      <span className="font-bold">Gender:</span>
                      <span className="capitalize">{activeApp.gender}</span>
                    </p>
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-extrabold uppercase text-brand-dark tracking-wider mb-2">Job Preferences</h4>
                  <div className="space-y-2">
                    <p className="flex justify-between py-1 border-b border-brand-green/5">
                      <span className="font-bold">Experience:</span>
                      <span>{activeApp.experience} Years</span>
                    </p>
                    <p className="flex justify-between py-1 border-b border-brand-green/5">
                      <span className="font-bold">Expected Salary:</span>
                      <span className="font-bold">₹{activeApp.expectedSalary.toLocaleString()}</span>
                    </p>
                    <p className="flex justify-between py-1 border-b border-brand-green/5">
                      <span className="font-bold">Address:</span>
                      <span className="text-right max-w-[200px] truncate">{activeApp.address}</span>
                    </p>
                    <p className="flex justify-between py-1 border-b border-brand-green/5">
                      <span className="font-bold">PIN/City/State:</span>
                      <span>{activeApp.pinCode}, {activeApp.city}, {activeApp.state}</span>
                    </p>
                    <div className="flex flex-col py-1">
                      <span className="font-bold">Preferred Cities:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {activeApp.preferredCities.map((c, i) => (
                          <span key={i} className="bg-brand-cream border border-brand-green/10 text-brand-green font-bold text-[10px] px-2 py-0.5 rounded-md">
                            {c}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Documents Scans Grid */}
              <div className="space-y-4">
                <h4 className="text-xs font-extrabold uppercase text-brand-dark tracking-wider">Candidate Verification Documents</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  
                  {/* Aadhaar Front */}
                  <div className="bg-brand-cream/20 border border-brand-green/5 p-4 rounded-2xl flex flex-col items-center justify-between space-y-3">
                    <span className="text-xs font-bold text-brand-dark">Aadhaar Card Front Scan</span>
                    {activeApp.aadhaarFrontUrl.endsWith('.pdf') ? (
                      <a
                        href={activeApp.aadhaarFrontUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="bg-brand-green text-white text-xs font-bold px-4 py-2 rounded-xl shadow"
                      >
                        Open Front PDF Document
                      </a>
                    ) : (
                      <img
                        src={activeApp.aadhaarFrontUrl}
                        alt="Aadhaar Front"
                        className="w-full h-32 object-contain rounded-lg border bg-white shadow-xs"
                      />
                    )}
                  </div>

                  {/* Aadhaar Back */}
                  <div className="bg-brand-cream/20 border border-brand-green/5 p-4 rounded-2xl flex flex-col items-center justify-between space-y-3">
                    <span className="text-xs font-bold text-brand-dark">Aadhaar Card Back Scan</span>
                    {activeApp.aadhaarBackUrl.endsWith('.pdf') ? (
                      <a
                        href={activeApp.aadhaarBackUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="bg-brand-green text-white text-xs font-bold px-4 py-2 rounded-xl shadow"
                      >
                        Open Back PDF Document
                      </a>
                    ) : (
                      <img
                        src={activeApp.aadhaarBackUrl}
                        alt="Aadhaar Back"
                        className="w-full h-32 object-contain rounded-lg border bg-white shadow-xs"
                      />
                    )}
                  </div>
                  
                </div>

                {/* Resume download */}
                {activeApp.resumeUrl ? (
                  <div className="bg-brand-cream/20 border border-brand-green/5 p-4 rounded-2xl flex items-center justify-between">
                    <span className="text-xs font-bold text-brand-dark">Resume PDF Uploaded</span>
                    <a
                      href={activeApp.resumeUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="bg-brand-gold hover:bg-brand-gold/90 text-brand-dark font-extrabold px-6 py-2.5 rounded-xl text-xs shadow transition-colors"
                    >
                      View Candidate Resume
                    </a>
                  </div>
                ) : (
                  <div className="bg-gray-50 border border-dashed p-4 rounded-2xl text-center text-xs text-gray-400 font-semibold">
                    No resume PDF uploaded for this application.
                  </div>
                )}
              </div>

            </div>

          </div>
        </div>
      )}

      {/* Hiring Confirmation & Set PIN Modal */}
      {showHireModal && activeApp && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-brand-dark/40 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-sm w-full border border-brand-green/10 shadow-2xl p-6 space-y-6">
            <h3 className="text-xl font-extrabold text-brand-dark">🤝 Hire Candidate</h3>
            
            <p className="text-xs text-brand-text leading-relaxed font-semibold">
              You are hiring <strong>{activeApp.fullName}</strong>. Set a 4-digit PIN for them to log into the Cleaner Portal.
            </p>

            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-brand-dark uppercase tracking-wider">4-Digit PIN</label>
              <input
                type="password"
                maxLength={4}
                required
                placeholder="e.g. 1234"
                value={hirePin}
                onChange={e => {
                  if (/^\d*$/.test(e.target.value)) setHirePin(e.target.value);
                }}
                className="w-full px-3 py-2.5 rounded-xl border border-brand-green/20 focus:outline-none focus:ring-1 focus:ring-brand-gold bg-brand-cream/10 text-center text-lg font-bold tracking-widest text-brand-dark"
              />
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowHireModal(false);
                  setHirePin('');
                }}
                className="flex-1 bg-brand-cream text-brand-green font-bold py-2.5 rounded-xl text-xs border border-brand-green/15"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={hiring || hirePin.length < 4}
                onClick={() => handleHire(activeApp.id)}
                className="flex-1 bg-brand-green hover:bg-brand-green/90 text-white font-extrabold py-2.5 rounded-xl text-xs shadow disabled:opacity-50"
              >
                {hiring ? 'Hiring...' : 'Confirm Hire'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payout Action Confirmation Modal */}
      {payoutActionRequest && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-brand-dark/40 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <form 
            onSubmit={handlePayoutAction}
            className="bg-white rounded-3xl max-w-sm w-full border border-brand-green/10 shadow-2xl p-6 space-y-6"
          >
            <h3 className="text-xl font-extrabold text-brand-dark">💰 Update Payout Status</h3>
            
            <div className="space-y-1">
              <p className="text-xs text-brand-text font-semibold">
                Employee: <strong>{payoutActionRequest.employee.fullName}</strong>
              </p>
              <p className="text-xs text-brand-text font-semibold">
                Amount: <strong>₹{payoutActionRequest.amount}</strong> ({payoutActionRequest.method})
              </p>
              <p className="text-xs text-brand-text font-semibold">
                Action: <strong className="uppercase">{payoutActionStatus}</strong>
              </p>
            </div>

            {payoutActionStatus === 'PAID' && (
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-brand-dark uppercase tracking-wider">Transaction Reference ID (optional)</label>
                <input
                  type="text"
                  placeholder="e.g. TXN123456789"
                  value={paidTxnId}
                  onChange={e => setPaidTxnId(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-brand-green/20 focus:outline-none focus:ring-1 focus:ring-brand-gold bg-brand-cream/10 text-xs text-brand-dark"
                />
              </div>
            )}

            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-brand-dark uppercase tracking-wider">Admin Notes (optional)</label>
              <textarea
                placeholder="Enter notes..."
                rows={2}
                value={payoutAdminNotes}
                onChange={e => setPayoutAdminNotes(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-brand-green/20 focus:outline-none focus:ring-1 focus:ring-brand-gold bg-brand-cream/10 text-xs text-brand-dark"
              />
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setPayoutActionRequest(null);
                  setPaidTxnId('');
                  setPayoutAdminNotes('');
                }}
                className="flex-1 bg-brand-cream text-brand-green font-bold py-2.5 rounded-xl text-xs border border-brand-green/15"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={payoutActionLoading}
                className="flex-1 bg-brand-green hover:bg-brand-green/90 text-white font-extrabold py-2.5 rounded-xl text-xs shadow disabled:opacity-50"
              >
                {payoutActionLoading ? 'Saving...' : 'Confirm'}
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}

function AlertCircleIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={2}
      stroke="currentColor"
      {...props}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
      />
    </svg>
  );
}
