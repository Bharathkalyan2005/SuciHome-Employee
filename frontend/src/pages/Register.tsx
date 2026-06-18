import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { User, MapPin, FileCheck, CheckCircle2, ChevronRight, ChevronLeft, Upload, AlertCircle } from 'lucide-react';
import { API_BASE_URL } from '../config';

interface FormDataState {
  fullName: string;
  mobile: string;
  email: string;
  gender: string;
  dateOfBirth: string;
  aadhaar: string;
  address: string;
  city: string;
  state: string;
  pinCode: string;
  position: string;
  experience: number;
  preferredCities: string[];
  expectedSalary: string;
}

const initialFormState: FormDataState = {
  fullName: '',
  mobile: '',
  email: '',
  gender: '',
  dateOfBirth: '',
  aadhaar: '',
  address: '',
  city: '',
  state: '',
  pinCode: '',
  position: 'cleaner',
  experience: 0,
  preferredCities: [],
  expectedSalary: '',
};

export default function Register() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  // Step control (1, 2, 3 or 'success')
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<FormDataState>(initialFormState);
  
  // File uploads state
  const [photo, setPhoto] = useState<File | null>(null);
  const [aadhaarFront, setAadhaarFront] = useState<File | null>(null);
  const [aadhaarBack, setAadhaarBack] = useState<File | null>(null);
  const [resume, setResume] = useState<File | null>(null);

  // File previews
  const [photoPreview, setPhotoPreview] = useState<string>('');

  // UI States
  const [pinLoading, setPinLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successAppId, setSuccessAppId] = useState('');

  // Handle URL role parameter if any
  useEffect(() => {
    const roleParam = searchParams.get('role');
    if (roleParam && ['cleaner', 'supervisor', 'safety_officer', 'manager'].includes(roleParam.toLowerCase())) {
      setFormData(prev => ({ ...prev, position: roleParam.toLowerCase() }));
    }
  }, [searchParams]);

  // Handle Input Changes
  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  // Handle PIN code input and autofill
  const handlePinChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const pin = e.target.value.replace(/\D/g, '').slice(0, 6);
    setFormData(prev => ({ ...prev, pinCode: pin }));

    if (pin.length === 6) {
      setPinLoading(true);
      setErrorMsg('');
      try {
        const res = await fetch(`https://api.postalpincode.in/pincode/${pin}`);
        const data = await res.json();
        if (data && data[0]?.Status === 'Success' && data[0]?.PostOffice?.length > 0) {
          const postOffice = data[0].PostOffice[0];
          setFormData(prev => ({
            ...prev,
            city: postOffice.District || postOffice.Name,
            state: postOffice.State
          }));
        } else {
          // If public API fails, keep it editable
          console.warn('PIN Code not found or API down');
        }
      } catch (err) {
        console.error('PIN Code auto-fill error:', err);
      } finally {
        setPinLoading(false);
      }
    }
  };

  // Job salary range display helper
  const roleSalaries: Record<string, string> = {
    cleaner: '₹12,000 - ₹18,000 / month',
    supervisor: '₹20,000 - ₹28,000 / month',
    safety_officer: '₹25,000 - ₹35,000 / month',
    manager: '₹35,000 - ₹50,000 / month',
  };

  // Handle preferred cities check
  const handleCitySelect = (city: string) => {
    setFormData(prev => {
      const alreadySelected = prev.preferredCities.includes(city);
      if (alreadySelected) {
        return { ...prev, preferredCities: prev.preferredCities.filter(c => c !== city) };
      } else {
        return { ...prev, preferredCities: [...prev.preferredCities, city] };
      }
    });
  };

  // Handle File Input Changes & Validations
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setErrorMsg('Photo size must be less than 2MB');
        return;
      }
      setPhoto(file);
      setErrorMsg('');
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, setter: React.Dispatch<React.SetStateAction<File | null>>, maxSize: number) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > maxSize * 1024 * 1024) {
        setErrorMsg(`File must be less than ${maxSize}MB`);
        return;
      }
      setter(file);
      setErrorMsg('');
    }
  };

  // Form validations for Step transitions
  const validateStep = (currentStep: number): boolean => {
    setErrorMsg('');
    
    if (currentStep === 1) {
      if (!formData.fullName.trim()) return fail('Full Name is required');
      
      // Indian Mobile validation
      const cleanMobile = formData.mobile.replace(/\D/g, '');
      if (!/^[6-9]\d{9}$/.test(cleanMobile)) {
        return fail('Please enter a valid 10-digit Indian mobile number');
      }
      
      // Email validation
      if (!/\S+@\S+\.\S+/.test(formData.email)) {
        return fail('Please enter a valid email address');
      }
      
      if (!formData.gender) return fail('Please select your gender');
      
      // DOB Check (at least 18 years old)
      if (!formData.dateOfBirth) return fail('Date of birth is required');
      const birthDate = new Date(formData.dateOfBirth);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      if (age < 18 || age > 65) {
        return fail('Applicant must be between 18 and 65 years old');
      }

      // Aadhaar check
      const cleanAadhaar = formData.aadhaar.replace(/\D/g, '');
      if (!/^\d{12}$/.test(cleanAadhaar)) {
        return fail('Aadhaar number must be exactly 12 digits');
      }
    }

    if (currentStep === 2) {
      if (!formData.address.trim()) return fail('Permanent Address is required');
      if (!formData.pinCode || formData.pinCode.length !== 6) return fail('Please enter a valid 6-digit PIN code');
      if (!formData.city.trim()) return fail('City is required');
      if (!formData.state.trim()) return fail('State is required');
      if (formData.preferredCities.length === 0) return fail('Please select at least one preferred city');
      if (!formData.expectedSalary || parseFloat(formData.expectedSalary) <= 0) return fail('Expected Salary must be a positive number');
    }

    return true;
  };

  const fail = (msg: string): boolean => {
    setErrorMsg(msg);
    return false;
  };

  const handleNext = () => {
    if (validateStep(step)) {
      setStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    setErrorMsg('');
    setStep(prev => prev - 1);
  };

  // Submit form data to backend
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!photo || !aadhaarFront || !aadhaarBack) {
      setErrorMsg('Please upload all required files (Photo, Aadhaar Front, and Aadhaar Back)');
      return;
    }

    setSubmitting(true);
    setErrorMsg('');

    const form = new FormData();
    // Text fields
    form.append('fullName', formData.fullName);
    form.append('mobile', formData.mobile);
    form.append('email', formData.email);
    form.append('gender', formData.gender);
    form.append('dateOfBirth', formData.dateOfBirth);
    form.append('aadhaar', formData.aadhaar);
    form.append('address', formData.address);
    form.append('city', formData.city);
    form.append('state', formData.state);
    form.append('pinCode', formData.pinCode);
    form.append('position', formData.position);
    form.append('experience', String(formData.experience));
    form.append('expectedSalary', formData.expectedSalary);
    form.append('preferredCities', JSON.stringify(formData.preferredCities));

    // File fields
    form.append('photo', photo);
    form.append('aadhaarFront', aadhaarFront);
    form.append('aadhaarBack', aadhaarBack);
    if (resume) {
      form.append('resume', resume);
    }

    try {
      const res = await fetch(`${API_BASE_URL}/register`, {
        method: 'POST',
        body: form,
      });

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Server error occurred during submission.');
      }

      // Success
      setSuccessAppId(data.applicationId);
      localStorage.setItem('sucihome_last_app_id', data.applicationId);
      setStep(4); // Trigger success screen
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to submit application');
    } finally {
      setSubmitting(false);
    }
  };

  // Available Cities
  const cities = ['Visakhapatnam', 'Hyderabad', 'Bengaluru', 'Mumbai', 'Chennai', 'Bhopal'];

  return (
    <div className="max-w-4xl mx-auto px-4 py-16 space-y-12">
      
      {/* Title Header */}
      {step !== 4 && (
        <div className="text-center space-y-3">
          <span className="text-brand-gold font-bold text-xs uppercase tracking-widest bg-brand-green/10 px-4 py-1.5 rounded-full">
            Onboarding Form
          </span>
          <h1 className="text-4xl font-extrabold text-brand-dark">
            Join the SuciHome Crew
          </h1>
          <p className="text-brand-text max-w-lg mx-auto text-sm sm:text-base">
            Complete the 3-step application form below. All your inputs are securely encrypted and verified.
          </p>
        </div>
      )}

      {/* Stepper Header */}
      {step !== 4 && (
        <div className="relative bg-white rounded-3xl p-6 border border-brand-green/10 shadow-sm flex justify-around items-center">
          <div className="flex flex-col items-center space-y-2 relative z-10">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all ${
              step >= 1 ? 'bg-brand-green text-white shadow' : 'bg-gray-100 text-gray-400'
            }`}>
              <User className="h-5 w-5" />
            </div>
            <span className="text-xs font-bold text-brand-dark hidden sm:inline">1. Personal</span>
          </div>

          <div className="h-0.5 bg-gray-200 flex-1 mx-4 -mt-4 relative">
            <div className={`h-full bg-brand-green transition-all duration-300 ${step >= 2 ? 'w-full' : 'w-0'}`} />
          </div>

          <div className="flex flex-col items-center space-y-2 relative z-10">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all ${
              step >= 2 ? 'bg-brand-green text-white shadow' : 'bg-gray-100 text-gray-400'
            }`}>
              <MapPin className="h-5 w-5" />
            </div>
            <span className="text-xs font-bold text-brand-dark hidden sm:inline">2. Job & Address</span>
          </div>

          <div className="h-0.5 bg-gray-200 flex-1 mx-4 -mt-4 relative">
            <div className={`h-full bg-brand-green transition-all duration-300 ${step >= 3 ? 'w-full' : 'w-0'}`} />
          </div>

          <div className="flex flex-col items-center space-y-2 relative z-10">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all ${
              step >= 3 ? 'bg-brand-green text-white shadow' : 'bg-gray-100 text-gray-400'
            }`}>
              <FileCheck className="h-5 w-5" />
            </div>
            <span className="text-xs font-bold text-brand-dark hidden sm:inline">3. Uploads</span>
          </div>
        </div>
      )}

      {/* Form Card */}
      {step !== 4 && (
        <div className="bg-white rounded-3xl p-8 border border-brand-green/10 shadow-sm relative overflow-hidden">
          
          {errorMsg && (
            <div className="mb-6 flex items-start space-x-2 text-red-600 bg-red-50 p-4 rounded-xl border border-red-200 text-sm font-medium">
              <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            
            {/* STEP 1: Personal Details */}
            {step === 1 && (
              <div className="space-y-6">
                <h2 className="text-xl font-bold text-brand-dark pb-2 border-b border-brand-green/10">Personal Details</h2>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-brand-dark uppercase tracking-wider">Full Name</label>
                    <input
                      type="text"
                      name="fullName"
                      required
                      value={formData.fullName}
                      onChange={handleTextChange}
                      placeholder="e.g. Ramesh Kumar"
                      className="w-full px-4 py-3 rounded-xl border border-brand-green/20 focus:outline-none focus:ring-2 focus:ring-brand-gold bg-brand-cream/20 text-brand-dark"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-brand-dark uppercase tracking-wider">Mobile Number (+91)</label>
                    <input
                      type="tel"
                      name="mobile"
                      required
                      value={formData.mobile}
                      onChange={handleTextChange}
                      placeholder="10-digit mobile number"
                      className="w-full px-4 py-3 rounded-xl border border-brand-green/20 focus:outline-none focus:ring-2 focus:ring-brand-gold bg-brand-cream/20 text-brand-dark"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-brand-dark uppercase tracking-wider">Email Address</label>
                    <input
                      type="email"
                      name="email"
                      required
                      value={formData.email}
                      onChange={handleTextChange}
                      placeholder="e.g. ramesh@example.com"
                      className="w-full px-4 py-3 rounded-xl border border-brand-green/20 focus:outline-none focus:ring-2 focus:ring-brand-gold bg-brand-cream/20 text-brand-dark"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-brand-dark uppercase tracking-wider">Date of Birth</label>
                    <input
                      type="date"
                      name="dateOfBirth"
                      required
                      value={formData.dateOfBirth}
                      onChange={handleTextChange}
                      className="w-full px-4 py-3 rounded-xl border border-brand-green/20 focus:outline-none focus:ring-2 focus:ring-brand-gold bg-brand-cream/20 text-brand-dark"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-brand-dark uppercase tracking-wider">Gender</label>
                    <div className="flex space-x-6 py-2">
                      {['Male', 'Female', 'Other'].map(g => (
                        <label key={g} className="flex items-center space-x-2 text-brand-text font-semibold text-sm cursor-pointer select-none">
                          <input
                            type="radio"
                            name="gender"
                            value={g.toLowerCase()}
                            checked={formData.gender === g.toLowerCase()}
                            onChange={handleTextChange}
                            className="h-4.5 w-4.5 text-brand-green focus:ring-brand-gold"
                          />
                          <span>{g}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-brand-dark uppercase tracking-wider">Aadhaar Number (12 digits)</label>
                    <input
                      type="text"
                      name="aadhaar"
                      required
                      maxLength={12}
                      value={formData.aadhaar}
                      onChange={(e) => {
                        const clean = e.target.value.replace(/\D/g, '').slice(0, 12);
                        setFormData(prev => ({ ...prev, aadhaar: clean }));
                      }}
                      placeholder="e.g. 567890123456"
                      className="w-full px-4 py-3 rounded-xl border border-brand-green/20 focus:outline-none focus:ring-2 focus:ring-brand-gold bg-brand-cream/20 text-brand-dark tracking-widest font-semibold"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2: Address & Job Role */}
            {step === 2 && (
              <div className="space-y-8">
                <h2 className="text-xl font-bold text-brand-dark pb-2 border-b border-brand-green/10">Address & Job Role</h2>
                
                {/* PIN Code Autofill trigger */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-brand-dark uppercase tracking-wider">PIN Code</label>
                    <div className="relative">
                      <input
                        type="text"
                        name="pinCode"
                        required
                        value={formData.pinCode}
                        onChange={handlePinChange}
                        placeholder="e.g. 530003"
                        className="w-full px-4 py-3 rounded-xl border border-brand-green/20 focus:outline-none focus:ring-2 focus:ring-brand-gold bg-brand-cream/20 text-brand-dark font-bold tracking-widest"
                      />
                      {pinLoading && (
                        <div className="absolute right-3 top-3 w-5 h-5 border-2 border-brand-gold border-t-transparent rounded-full animate-spin" />
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-brand-dark uppercase tracking-wider">City (Auto-filled)</label>
                    <input
                      type="text"
                      name="city"
                      required
                      value={formData.city}
                      onChange={handleTextChange}
                      placeholder="District / City"
                      className="w-full px-4 py-3 rounded-xl border border-brand-green/20 focus:outline-none focus:ring-2 focus:ring-brand-gold bg-brand-cream/20 text-brand-dark font-semibold"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-brand-dark uppercase tracking-wider">State (Auto-filled)</label>
                    <input
                      type="text"
                      name="state"
                      required
                      value={formData.state}
                      onChange={handleTextChange}
                      placeholder="State"
                      className="w-full px-4 py-3 rounded-xl border border-brand-green/20 focus:outline-none focus:ring-2 focus:ring-brand-gold bg-brand-cream/20 text-brand-dark font-semibold"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-bold text-brand-dark uppercase tracking-wider">Permanent Address</label>
                  <textarea
                    name="address"
                    required
                    rows={2}
                    value={formData.address}
                    onChange={handleTextChange}
                    placeholder="House No, Street, Landmark details"
                    className="w-full px-4 py-3 rounded-xl border border-brand-green/20 focus:outline-none focus:ring-2 focus:ring-brand-gold bg-brand-cream/20 text-brand-dark"
                  />
                </div>

                {/* Job Position cards */}
                <div className="space-y-3">
                  <label className="block text-xs font-bold text-brand-dark uppercase tracking-wider">Select Job Position</label>
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                    {Object.keys(roleSalaries).map((roleKey) => {
                      const label = roleKey.toUpperCase().replace('_', ' ');
                      const isSelected = formData.position === roleKey;
                      return (
                        <div
                          key={roleKey}
                          onClick={() => setFormData(prev => ({ ...prev, position: roleKey }))}
                          className={`cursor-pointer border-2 rounded-2xl p-4 flex flex-col justify-between h-36 transition-all ${
                            isSelected 
                              ? 'bg-brand-green border-brand-gold text-white shadow-md' 
                              : 'bg-brand-cream/50 border-brand-green/10 text-brand-dark hover:border-brand-gold'
                          }`}
                        >
                          <div>
                            <span className={`text-xs font-extrabold uppercase px-2 py-0.5 rounded-full ${
                              isSelected ? 'bg-brand-gold text-brand-dark' : 'bg-brand-green/10 text-brand-green'
                            }`}>
                              Role
                            </span>
                            <h3 className="font-extrabold text-base mt-2">{label}</h3>
                          </div>
                          
                          {/* Hover salary display */}
                          <div className="mt-2 pt-2 border-t border-current/10">
                            <span className="text-[10px] font-bold block opacity-75">Estimated Pay:</span>
                            <span className="text-[11px] font-extrabold text-brand-gold">{roleSalaries[roleKey]}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {/* Experience Slider */}
                  <div className="space-y-2 bg-brand-cream/20 border border-brand-green/5 p-4 rounded-2xl">
                    <div className="flex justify-between items-center mb-1">
                      <label className="block text-xs font-bold text-brand-dark uppercase tracking-wider">Experience (Years)</label>
                      <span className="bg-brand-green text-white font-extrabold text-sm px-2.5 py-0.5 rounded-lg shadow-sm">
                        {formData.experience} Years
                      </span>
                    </div>
                    <input
                      type="range"
                      name="experience"
                      min={0}
                      max={20}
                      value={formData.experience}
                      onChange={(e) => setFormData(prev => ({ ...prev, experience: parseInt(e.target.value, 10) }))}
                      className="w-full accent-brand-gold h-1.5 bg-gray-200 rounded-lg cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-gray-400 font-bold px-1">
                      <span>Entry (0)</span>
                      <span>Mid (10)</span>
                      <span>Expert (20)</span>
                    </div>
                  </div>

                  {/* Expected Salary Input */}
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-brand-dark uppercase tracking-wider">Expected Monthly Salary (₹)</label>
                    <input
                      type="number"
                      name="expectedSalary"
                      required
                      value={formData.expectedSalary}
                      onChange={handleTextChange}
                      placeholder="e.g. 15000"
                      className="w-full px-4 py-3 rounded-xl border border-brand-green/20 focus:outline-none focus:ring-2 focus:ring-brand-gold bg-brand-cream/20 text-brand-dark font-extrabold text-lg"
                    />
                  </div>
                </div>

                {/* Preferred Cities multi-select */}
                <div className="space-y-3">
                  <label className="block text-xs font-bold text-brand-dark uppercase tracking-wider">Preferred Cities (Select one or more)</label>
                  <div className="flex flex-wrap gap-2">
                    {cities.map(city => {
                      const isSelected = formData.preferredCities.includes(city);
                      return (
                        <button
                          type="button"
                          key={city}
                          onClick={() => handleCitySelect(city)}
                          className={`px-4 py-2 rounded-xl text-sm font-bold border transition-all ${
                            isSelected
                              ? 'bg-brand-green text-white border-brand-green shadow-sm'
                              : 'bg-brand-cream/30 text-brand-text border-brand-green/10 hover:border-brand-gold'
                          }`}
                        >
                          {city}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3: Document Uploads */}
            {step === 3 && (
              <div className="space-y-6">
                <h2 className="text-xl font-bold text-brand-dark pb-2 border-b border-brand-green/10">Upload Documents</h2>
                
                {/* Photo Upload with circular preview */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center bg-brand-cream/30 border border-brand-green/5 p-6 rounded-3xl">
                  <div className="md:col-span-1 flex flex-col items-center">
                    <p className="text-xs font-bold text-brand-dark uppercase tracking-wider mb-2">Photo Preview</p>
                    {photoPreview ? (
                      <img
                        src={photoPreview}
                        alt="Profile Preview"
                        className="w-28 h-28 object-cover rounded-full border-4 border-brand-gold shadow-md"
                      />
                    ) : (
                      <div className="w-28 h-28 bg-gray-100 rounded-full border-4 border-dashed border-gray-300 flex items-center justify-center text-gray-400 text-[10px] font-bold text-center p-2">
                        Upload circular photo (2MB)
                      </div>
                    )}
                  </div>
                  
                  <div className="md:col-span-2 space-y-2">
                    <label className="block text-xs font-bold text-brand-dark uppercase tracking-wider">Profile Photo (Passport size, Max 2MB)</label>
                    <div className="relative border border-brand-green/20 rounded-xl p-4 bg-white hover:border-brand-gold transition-colors cursor-pointer">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoUpload}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        required={!photo}
                      />
                      <div className="flex items-center space-x-3 text-brand-text">
                        <Upload className="h-5 w-5 text-brand-gold" />
                        <span className="text-sm font-semibold truncate">
                          {photo ? photo.name : 'Select or drop image file...'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Aadhaar scans */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2 bg-brand-cream/30 border border-brand-green/5 p-6 rounded-3xl">
                    <label className="block text-xs font-bold text-brand-dark uppercase tracking-wider">Aadhaar Card Front (Max 5MB)</label>
                    <div className="relative border border-brand-green/20 rounded-xl p-4 bg-white hover:border-brand-gold transition-colors cursor-pointer">
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        onChange={(e) => handleFileUpload(e, setAadhaarFront, 5)}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        required={!aadhaarFront}
                      />
                      <div className="flex items-center space-x-3 text-brand-text">
                        <Upload className="h-5 w-5 text-brand-gold" />
                        <span className="text-sm font-semibold truncate">
                          {aadhaarFront ? aadhaarFront.name : 'Aadhaar Front scan...'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 bg-brand-cream/30 border border-brand-green/5 p-6 rounded-3xl">
                    <label className="block text-xs font-bold text-brand-dark uppercase tracking-wider">Aadhaar Card Back (Max 5MB)</label>
                    <div className="relative border border-brand-green/20 rounded-xl p-4 bg-white hover:border-brand-gold transition-colors cursor-pointer">
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        onChange={(e) => handleFileUpload(e, setAadhaarBack, 5)}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        required={!aadhaarBack}
                      />
                      <div className="flex items-center space-x-3 text-brand-text">
                        <Upload className="h-5 w-5 text-brand-gold" />
                        <span className="text-sm font-semibold truncate">
                          {aadhaarBack ? aadhaarBack.name : 'Aadhaar Back scan...'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Optional Resume */}
                <div className="space-y-2 bg-brand-cream/30 border border-brand-green/5 p-6 rounded-3xl">
                  <label className="block text-xs font-bold text-brand-dark uppercase tracking-wider">Resume PDF (Optional, Max 5MB)</label>
                  <div className="relative border border-brand-green/20 rounded-xl p-4 bg-white hover:border-brand-gold transition-colors cursor-pointer">
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={(e) => handleFileUpload(e, setResume, 5)}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <div className="flex items-center space-x-3 text-brand-text">
                      <Upload className="h-5 w-5 text-brand-gold" />
                      <span className="text-sm font-semibold truncate">
                        {resume ? resume.name : 'Upload PDF resume (Optional)...'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Stepper Footer Controls */}
            <div className="flex justify-between items-center pt-6 border-t border-brand-green/10">
              {step > 1 ? (
                <button
                  type="button"
                  onClick={handleBack}
                  disabled={submitting}
                  className="flex items-center space-x-2 bg-brand-lightGreen text-brand-green border border-brand-green/10 hover:bg-brand-green hover:text-white font-extrabold px-6 py-3 rounded-xl text-sm transition-all"
                >
                  <ChevronLeft className="h-5 w-5" />
                  <span>Previous</span>
                </button>
              ) : (
                <div />
              )}

              {step < 3 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="flex items-center space-x-2 bg-brand-green hover:bg-brand-green/90 text-white font-extrabold px-8 py-3 rounded-xl text-sm transition-all"
                >
                  <span>Next Step</span>
                  <ChevronRight className="h-5 w-5 text-brand-gold" />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-brand-gold hover:bg-brand-gold/90 text-brand-dark font-extrabold px-8 py-3 rounded-xl text-sm transition-all shadow-md disabled:opacity-50 flex items-center space-x-2"
                >
                  {submitting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-brand-dark border-t-transparent rounded-full animate-spin mr-1" />
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <>
                      <span>Submit Application</span>
                      <CheckCircle2 className="h-5 w-5 text-brand-dark" />
                    </>
                  )}
                </button>
              )}
            </div>

          </form>
        </div>
      )}

      {/* STEP 4: Success Screen */}
      {step === 4 && (
        <div className="bg-white rounded-3xl p-8 sm:p-12 border border-brand-green/10 shadow-xl text-center space-y-8 max-w-2xl mx-auto relative overflow-hidden">
          <div className="absolute top-[-50px] right-[-50px] w-64 h-64 bg-brand-lightGreen/40 rounded-full blur-3xl animate-float"></div>
          
          <div className="bg-brand-lightGreen/50 p-4 rounded-full w-20 h-20 flex items-center justify-center mx-auto text-brand-green border border-brand-green/20">
            <CheckCircle2 className="h-10 w-10 text-brand-green" />
          </div>

          <div className="space-y-2">
            <span className="text-brand-gold font-bold text-xs uppercase tracking-widest bg-brand-green/10 px-4 py-1 rounded-full">
              Success
            </span>
            <h2 className="text-3xl font-extrabold text-brand-dark">Registration Complete!</h2>
            <p className="text-brand-text max-w-md mx-auto text-sm sm:text-base leading-relaxed">
              Your application details have been submitted and securely saved. An SMS confirmation will be sent to your mobile number.
            </p>
          </div>

          <div className="bg-brand-green text-white p-6 rounded-2xl border border-brand-gold/20 shadow-md">
            <p className="text-xs uppercase tracking-widest text-brand-gold font-bold">Your Application ID</p>
            <h3 className="text-2xl sm:text-3xl font-extrabold tracking-widest mt-1.5 select-all font-mono text-brand-gold">
              {successAppId}
            </h3>
            <p className="text-[10px] text-gray-300 mt-2 font-medium">Write this ID down or copy it to track progress.</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => navigate(`/status?id=${successAppId}`)}
              className="bg-brand-green hover:bg-brand-green/90 text-white font-extrabold px-6 py-3 rounded-xl text-sm transition-all shadow-md"
            >
              Track Status Now
            </button>
            <button
              onClick={() => {
                setStep(1);
                setFormData(initialFormState);
                setPhoto(null);
                setAadhaarFront(null);
                setAadhaarBack(null);
                setResume(null);
                setPhotoPreview('');
                setErrorMsg('');
              }}
              className="bg-brand-lightGreen text-brand-green border border-brand-green/10 hover:bg-brand-green hover:text-white font-extrabold px-6 py-3 rounded-xl text-sm transition-all"
            >
              Submit New Application
            </button>
          </div>
        </div>
      )}
      
    </div>
  );
}
