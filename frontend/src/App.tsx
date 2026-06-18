import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';

// Components
import Navbar from './components/Navbar';
import Footer from './components/Footer';

// Pages
import Home from './pages/Home';
import About from './pages/About';
import Careers from './pages/Careers';
import Register from './pages/Register';
import Status from './pages/Status';
import Contact from './pages/Contact';
import Admin from './pages/Admin';

// Scroll To Top on route change helper
function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

function App() {
  return (
    <Router>
      <ScrollToTop />
      <div className="flex flex-col min-h-screen bg-brand-cream text-brand-text">
        <Navbar />
        
        {/* Main Content Area */}
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/careers" element={<Careers />} />
            <Route path="/register" element={<Register />} />
            <Route path="/status" element={<Status />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="*" element={
              <div className="max-w-md mx-auto py-20 px-4 text-center space-y-4">
                <h2 className="text-3xl font-extrabold text-brand-dark">Page Not Found</h2>
                <p className="text-brand-text text-sm">We couldn't locate this onboarding page. Please check the URL link.</p>
                <a href="/" className="inline-block bg-brand-green text-white font-bold px-6 py-2.5 rounded-xl">Go Home</a>
              </div>
            } />
          </Routes>
        </main>
        
        <Footer />
      </div>
    </Router>
  );
}

export default App;
