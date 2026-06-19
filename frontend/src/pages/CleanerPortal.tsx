import React, { useState, useEffect, useRef } from 'react';
import api from '../lib/axiosInstance';
import toast from 'react-hot-toast';
import { DollarSign, Award, Calendar, LogOut, ArrowRight, User } from 'lucide-react';

interface Earning {
  id: string;
  date: string;
  jobsCompleted: number;
  baseAmount: string;
  bonusAmount: string;
  totalAmount: string;
  notes: string | null;
  status: 'UNPAID' | 'REQUESTED' | 'PAID';
}

interface Payout {
  id: string;
  requestId: string;
  amount: string;
  fromDate: string;
  toDate: string;
  method: 'UPI' | 'BANK_TRANSFER' | 'CASH';
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'PAID';
  createdAt: string;
}

export default function CleanerPortal() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mobile, setMobile] = useState('');
  const [pin, setPin] = useState(['', '', '', '']);
  const pinRefs = [useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null)];

  // Dashboard state
  const [employeeInfo, setEmployeeInfo] = useState<{ name: string; id: string; role: string } | null>(null);
  const [earnings, setEarnings] = useState<Earning[]>([]);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [totalEarned, setTotalEarned] = useState(0);
  const [totalUnpaid, setTotalUnpaid] = useState(0);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const d = new Date();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    return `${d.getFullYear()}-${mm}`;
  });

  // Modal state
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [modalFromDate, setModalFromDate] = useState('');
  const [modalToDate, setModalToDate] = useState('');
  const [modalMethod, setModalMethod] = useState<'UPI' | 'BANK_TRANSFER' | 'CASH'>('UPI');
  const [upiId, setUpiId] = useState('');
  const [bankAccount, setBankAccount] = useState('');
  const [bankIfsc, setBankIfsc] = useState('');
  const [calculatedAmount, setCalculatedAmount] = useState(0);
  const [modalLoading, setModalLoading] = useState(false);

  // Check login on mount
  useEffect(() => {
    const token = localStorage.getItem('sucihome_employee_token');
    const storedEmp = localStorage.getItem('sucihome_employee_info');
    if (token && storedEmp) {
      try {
        setEmployeeInfo(JSON.parse(storedEmp));
        setIsLoggedIn(true);
      } catch {
        handleLogout();
      }
    }
  }, []);

  // Fetch dashboard data
  useEffect(() => {
    if (isLoggedIn) {
      fetchDashboardData();
    }
  }, [isLoggedIn, selectedMonth]);

  // Calculate unpaid amount on modal date change
  useEffect(() => {
    if (modalFromDate && modalToDate) {
      const from = new Date(modalFromDate);
      const to = new Date(modalToDate);
      const sum = earnings
        .filter(e => e.status === 'UNPAID')
        .filter(e => {
          const edate = new Date(e.date);
          return edate >= from && edate <= to;
        })
        .reduce((s, e) => s + parseFloat(e.totalAmount), 0);
      setCalculatedAmount(sum);
    } else {
      setCalculatedAmount(0);
    }
  }, [modalFromDate, modalToDate, earnings]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [earningsRes, payoutsRes] = await Promise.all([
        api.get(`/employee/my-earnings?month=${selectedMonth}`),
        api.get('/employee/my-payouts')
      ]);

      setEarnings(earningsRes.data.earnings);
      setTotalEarned(earningsRes.data.totalEarned);
      setTotalUnpaid(earningsRes.data.totalUnpaid);
      setPayouts(payoutsRes.data.requests);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to retrieve earnings data');
      if (err.response?.status === 401 || err.response?.status === 403) {
        handleLogout();
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const pinStr = pin.join('');
    if (!mobile || pinStr.length < 4) {
      toast.error('Please enter mobile number and 4-digit PIN');
      return;
    }
    setLoading(true);
    try {
      const res = await api.post('/employee/login', { mobile, pin: pinStr });
      localStorage.setItem('sucihome_employee_token', res.data.token);
      localStorage.setItem('sucihome_employee_info', JSON.stringify(res.data.employee));
      setEmployeeInfo(res.data.employee);
      setIsLoggedIn(true);
      toast.success('Login successful!');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Invalid credentials or connection issue');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('sucihome_employee_token');
    localStorage.removeItem('sucihome_employee_info');
    setIsLoggedIn(false);
    setEmployeeInfo(null);
    setPin(['', '', '', '']);
  };

  const handlePinChange = (index: number, val: string) => {
    if (!/^\d*$/.test(val)) return;
    const newPin = [...pin];
    newPin[index] = val.slice(-1);
    setPin(newPin);

    // Auto-focus next input
    if (val && index < 3) {
      pinRefs[index + 1].current?.focus();
    }
  };

  const handlePinKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !pin[index] && index > 0) {
      pinRefs[index - 1].current?.focus();
    }
  };

  const submitPayoutRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalFromDate || !modalToDate) {
      toast.error('Please select a date range');
      return;
    }
    if (calculatedAmount <= 0) {
      toast.error('No unpaid earnings in this date range');
      return;
    }
    if (modalMethod === 'UPI' && !upiId) {
      toast.error('UPI ID is required');
      return;
    }
    if (modalMethod === 'BANK_TRANSFER' && (!bankAccount || !bankIfsc)) {
      toast.error('Bank Account Number and IFSC are required');
      return;
    }

    setModalLoading(true);
    try {
      await api.post('/employee/request-payout', {
        fromDate: modalFromDate,
        toDate: modalToDate,
        method: modalMethod,
        upiId: modalMethod === 'UPI' ? upiId : null,
        bankAccount: modalMethod === 'BANK_TRANSFER' ? bankAccount : null,
        bankIfsc: modalMethod === 'BANK_TRANSFER' ? bankIfsc : null,
      });

      toast.success('Payout request sent successfully!');
      setShowPayoutModal(false);
      // Reset modal inputs
      setModalFromDate('');
      setModalToDate('');
      setUpiId('');
      setBankAccount('');
      setBankIfsc('');
      // Refresh dashboard
      fetchDashboardData();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to submit payout request');
    } finally {
      setModalLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PAID':
        return <span className="bg-green-100 text-green-800 border-green-200 px-2 py-0.5 rounded-full text-xs font-bold border inline-flex items-center gap-1">PAID ✓</span>;
      case 'APPROVED':
        return <span className="bg-blue-100 text-blue-800 border-blue-200 px-2 py-0.5 rounded-full text-xs font-bold border inline-flex items-center gap-1">APPROVED</span>;
      case 'REJECTED':
        return <span className="bg-red-100 text-red-800 border-red-200 px-2 py-0.5 rounded-full text-xs font-bold border inline-flex items-center gap-1">REJECTED ✗</span>;
      case 'REQUESTED':
        return <span className="bg-purple-100 text-purple-800 border-purple-200 px-2 py-0.5 rounded-full text-xs font-bold border inline-flex items-center gap-1">REQUESTED</span>;
      default:
        return <span className="bg-yellow-100 text-yellow-800 border-yellow-200 px-2 py-0.5 rounded-full text-xs font-bold border inline-flex items-center gap-1">UNPAID</span>;
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-brand-cream flex items-center justify-center px-4 py-12">
        <form 
          onSubmit={handleLogin}
          className="bg-white rounded-3xl p-8 sm:p-10 w-full max-w-md shadow-xl border border-brand-green/10 space-y-6"
        >
          {/* Logo */}
          <div className="text-center space-y-3">
            <div className="flex justify-center">
              <img 
                src="/logo.png" 
                alt="SuciHome Logo" 
                className="h-[48px] w-auto" 
                style={{ height: '48px' }}
              />
            </div>
            <h2 className="text-2xl font-extrabold tracking-tight text-brand-dark font-sans leading-none">
              Cleaner Portal
            </h2>
            <p className="text-brand-text text-sm">
              Log in to view daily earnings and request payouts.
            </p>
          </div>

          {/* Mobile number */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-brand-dark uppercase tracking-wider">
              Mobile Number
            </label>
            <input 
              type="tel"
              required
              placeholder="e.g. 9876543210"
              value={mobile}
              onChange={e => setMobile(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-brand-green/20 focus:outline-none focus:ring-1 focus:ring-brand-gold bg-brand-cream/10 text-sm text-brand-dark"
            />
          </div>

          {/* PIN */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-brand-dark uppercase tracking-wider text-center">
              Enter 4-Digit Login PIN
            </label>
            <div className="flex justify-center gap-3">
              {pin.map((digit, index) => (
                <input
                  key={index}
                  ref={pinRefs[index]}
                  type="password"
                  maxLength={1}
                  required
                  value={digit}
                  onChange={e => handlePinChange(index, e.target.value)}
                  onKeyDown={e => handlePinKeyDown(index, e)}
                  className="w-12 h-14 text-center text-xl font-bold rounded-xl border border-brand-green/20 focus:outline-none focus:ring-1 focus:ring-brand-gold bg-brand-cream/10 text-brand-dark"
                />
              ))}
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-brand-green hover:bg-brand-green/90 text-white font-extrabold py-3.5 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75"
          >
            <span>{loading ? 'Logging in...' : 'Login to Portal'}</span>
            <ArrowRight className="h-4 w-4 text-brand-gold" />
          </button>

          {/* Forgot details */}
          <div className="text-center pt-2">
            <p className="text-xs text-brand-text font-semibold">
              Forgot PIN? Contact HR: <a href="tel:9392420643" className="text-brand-gold hover:underline">9392420643</a>
            </p>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 space-y-8">
      {/* Header Panel */}
      <div className="bg-white rounded-3xl p-6 border border-brand-green/10 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center space-x-4">
          <div className="bg-brand-lightGreen p-3 rounded-2xl text-brand-green">
            <User className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-brand-dark leading-tight">Hi, {employeeInfo?.name}! 👋</h1>
            <p className="text-brand-text text-xs uppercase font-bold tracking-wider mt-0.5">{employeeInfo?.role} Portal</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 bg-brand-cream border border-brand-green/10 text-brand-green hover:bg-red-50 hover:text-red-600 hover:border-red-200 font-bold px-5 py-2.5 rounded-xl text-sm transition-all shadow-xs"
        >
          <LogOut className="h-4 w-4" />
          <span>Logout</span>
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-brand-green/5 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Earned ({selectedMonth})</p>
            <h3 className="text-3xl font-extrabold text-brand-dark">₹{totalEarned}</h3>
          </div>
          <div className="bg-green-50 p-3.5 rounded-xl text-green-600">
            <Award className="h-6 w-6" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-brand-green/5 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider font-sans">Available to Request</p>
            <h3 className="text-3xl font-extrabold text-brand-dark">₹{totalUnpaid}</h3>
          </div>
          <div className="bg-brand-lightGreen p-3.5 rounded-xl text-brand-green">
            <DollarSign className="h-6 w-6 text-brand-gold" />
          </div>
        </div>
      </div>

      {/* Primary Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4">
        {/* Month Selector */}
        <div className="flex items-center space-x-2 bg-white px-3 py-2 rounded-xl border border-brand-green/10">
          <Calendar className="h-4 w-4 text-brand-gold" />
          <input 
            type="month"
            value={selectedMonth}
            onChange={e => setSelectedMonth(e.target.value)}
            className="text-sm font-bold text-brand-dark focus:outline-none cursor-pointer"
          />
        </div>
        
        {/* Request Payout Button */}
        <button
          onClick={() => {
            if (totalUnpaid <= 0) {
              toast.error('No unpaid earnings to request payout for');
              return;
            }
            setShowPayoutModal(true);
          }}
          className="bg-brand-green hover:bg-brand-green/90 text-white font-extrabold px-6 py-3.5 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
        >
          <span>💰 Request Payout</span>
        </button>
      </div>

      {/* Grid: Daily Earnings & Payout History */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Daily Earnings Card */}
        <div className="bg-white rounded-3xl p-6 border border-brand-green/10 shadow-sm space-y-4">
          <h2 className="text-xl font-extrabold text-brand-dark border-b border-brand-green/5 pb-2">
            Daily Earnings
          </h2>
          {loading ? (
            <p className="text-center py-6 text-gray-400 font-bold text-sm">Loading earnings...</p>
          ) : earnings.length === 0 ? (
            <p className="text-center py-6 text-gray-400 font-semibold text-sm">No daily earnings logged for this month.</p>
          ) : (
            <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
              {earnings.map(e => (
                <div key={e.id} className="p-3 bg-brand-cream/20 border border-brand-green/5 rounded-xl flex justify-between items-center text-sm">
                  <div className="space-y-0.5">
                    <p className="font-extrabold text-brand-dark">
                      {new Date(e.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </p>
                    <p className="text-xs text-brand-text font-semibold">
                      {e.jobsCompleted} job{e.jobsCompleted !== 1 ? 's' : ''} logged
                    </p>
                  </div>
                  <div className="text-right space-y-1">
                    <p className="font-extrabold text-brand-dark">₹{parseFloat(e.totalAmount)}</p>
                    {getStatusBadge(e.status)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Payout History Card */}
        <div className="bg-white rounded-3xl p-6 border border-brand-green/10 shadow-sm space-y-4">
          <h2 className="text-xl font-extrabold text-brand-dark border-b border-brand-green/5 pb-2">
            Payout History
          </h2>
          {loading ? (
            <p className="text-center py-6 text-gray-400 font-bold text-sm">Loading payouts...</p>
          ) : payouts.length === 0 ? (
            <p className="text-center py-6 text-gray-400 font-semibold text-sm">No payout requests submitted yet.</p>
          ) : (
            <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
              {payouts.map(p => (
                <div key={p.id} className="p-3 bg-brand-cream/20 border border-brand-green/5 rounded-xl flex justify-between items-center text-sm">
                  <div className="space-y-0.5">
                    <p className="font-extrabold text-brand-dark truncate max-w-[150px]">
                      {p.requestId}
                    </p>
                    <p className="text-xs text-brand-text font-semibold">
                      {new Date(p.fromDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} - {new Date(p.toDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </p>
                  </div>
                  <div className="text-right space-y-1">
                    <p className="font-extrabold text-brand-dark">₹{parseFloat(p.amount)}</p>
                    {getStatusBadge(p.status)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* Request Payout Modal */}
      {showPayoutModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-brand-dark/40 backdrop-blur-xs flex items-center justify-center p-4">
          <form 
            onSubmit={submitPayoutRequest}
            className="bg-white rounded-3xl max-w-md w-full border border-brand-green/10 shadow-2xl p-6 sm:p-8 space-y-6"
          >
            <div className="flex justify-between items-center border-b border-brand-green/5 pb-3">
              <h3 className="text-xl font-extrabold text-brand-dark">💰 Request Payout</h3>
              <button 
                type="button"
                onClick={() => setShowPayoutModal(false)}
                className="text-gray-400 hover:text-red-500 font-bold text-lg"
              >
                ✕
              </button>
            </div>

            {/* Date range selection */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-brand-dark uppercase tracking-wider">From Date</label>
                <input 
                  type="date"
                  required
                  value={modalFromDate}
                  onChange={e => setModalFromDate(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-brand-green/20 focus:outline-none focus:ring-1 focus:ring-brand-gold bg-brand-cream/10 text-xs text-brand-dark cursor-pointer"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-brand-dark uppercase tracking-wider">To Date</label>
                <input 
                  type="date"
                  required
                  value={modalToDate}
                  onChange={e => setModalToDate(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-brand-green/20 focus:outline-none focus:ring-1 focus:ring-brand-gold bg-brand-cream/10 text-xs text-brand-dark cursor-pointer"
                />
              </div>
            </div>

            {/* Amount calculation preview */}
            <div className="bg-brand-lightGreen/50 p-4 rounded-2xl border border-brand-green/10 flex justify-between items-center">
              <span className="text-xs font-bold text-brand-green">Total Unpaid Amount:</span>
              <span className="text-lg font-extrabold text-brand-dark">₹{calculatedAmount}</span>
            </div>

            {/* Method selection */}
            <div className="space-y-2">
              <label className="block text-[10px] font-bold text-brand-dark uppercase tracking-wider">Payout Method</label>
              <div className="grid grid-cols-3 gap-2">
                {(['UPI', 'BANK_TRANSFER', 'CASH'] as const).map(m => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setModalMethod(m)}
                    className={`py-2 rounded-xl text-xs font-bold transition-all border ${
                      modalMethod === m 
                        ? 'bg-brand-green text-white border-brand-green' 
                        : 'bg-brand-cream/10 text-brand-dark border-brand-green/20 hover:bg-brand-lightGreen'
                    }`}
                  >
                    {m.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>

            {/* Dynamic details input */}
            {modalMethod === 'UPI' && (
              <div className="space-y-1 animate-fade-in">
                <label className="block text-[10px] font-bold text-brand-dark uppercase tracking-wider">UPI ID</label>
                <input 
                  type="text"
                  required
                  placeholder="e.g. mobile@ybl"
                  value={upiId}
                  onChange={e => setUpiId(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-brand-green/20 focus:outline-none focus:ring-1 focus:ring-brand-gold bg-brand-cream/10 text-xs text-brand-dark"
                />
              </div>
            )}

            {modalMethod === 'BANK_TRANSFER' && (
              <div className="space-y-3 animate-fade-in">
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-brand-dark uppercase tracking-wider">Bank Account Number</label>
                  <input 
                    type="text"
                    required
                    placeholder="Enter Account Number"
                    value={bankAccount}
                    onChange={e => setBankAccount(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-brand-green/20 focus:outline-none focus:ring-1 focus:ring-brand-gold bg-brand-cream/10 text-xs text-brand-dark"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-brand-dark uppercase tracking-wider">IFSC Code</label>
                  <input 
                    type="text"
                    required
                    placeholder="e.g. SBIN0001234"
                    value={bankIfsc}
                    onChange={e => setBankIfsc(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-brand-green/20 focus:outline-none focus:ring-1 focus:ring-brand-gold bg-brand-cream/10 text-xs text-brand-dark uppercase"
                  />
                </div>
              </div>
            )}

            {/* Submit */}
            <div className="space-y-2">
              <button
                type="submit"
                disabled={modalLoading || calculatedAmount <= 0}
                className="w-full bg-brand-green hover:bg-brand-green/90 text-white font-extrabold py-3 rounded-xl transition-all shadow-md disabled:opacity-50 text-sm cursor-pointer"
              >
                {modalLoading ? 'Sending request...' : 'Submit Request'}
              </button>
              <p className="text-[10px] text-center text-gray-400 font-semibold leading-relaxed">
                Confirmation: Request sent! HR will process within 24-48 hours.
              </p>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
