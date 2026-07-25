import React, { useState, useEffect } from 'react';
import { Stethoscope, Mic, Pill, ScanEye, Users, Activity, Dna, Palette, Camera, LogIn, LogOut, User, MessageSquare, Star, X } from 'lucide-react';
import PatientKiosk from './components/PatientKiosk';
import DoctorDashboard from './components/DoctorDashboard';
import EpidemicAlert from './components/EpidemicAlert';
import AutoScribe from './components/AutoScribe';
import PharmaAI from './components/PharmaAI';
import VisionAI from './components/VisionAI';
import MultiAgent from './components/MultiAgent';
import DigitalTwin from './components/DigitalTwin';
import GenomicScanner from './components/GenomicScanner';
import ArtTherapy from './components/ArtTherapy';
import CustomAlert from './components/CustomAlert';
import { epidemicService } from './services/EpidemicService';
import './styles/App.css';
import { useMutation, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";

function App() {
  const [activeModule, setActiveModule] = useState('triage');
  const [triageQueue, setTriageQueue] = useState([]);
  const [outbreakData, setOutbreakData] = useState(null);

  // Auth States
  const [currentUser, setCurrentUser] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isLoginTab, setIsLoginTab] = useState(true);
  const [authName, setAuthName] = useState('');
  const [authEmail, setAuthEmail] = useState('');
  const [authPhone, setAuthPhone] = useState('');
  const [authRole, setAuthRole] = useState('Patient');
  const [authError, setAuthError] = useState('');

  // Feedback States
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackRating, setFeedbackRating] = useState(5);
  const [feedbackComment, setFeedbackComment] = useState('');
  const [feedbackSuccessMsg, setFeedbackSuccessMsg] = useState('');

  // Convex mutations & queries
  const createUser = useMutation(api.users.createUser);
  const addFeedback = useMutation(api.feedback.addFeedback);
  const allUsers = useQuery(api.users.getUsers);

  useEffect(() => {
    const storedUser = localStorage.getItem('sanjeevani_user');
    if (storedUser) {
      setCurrentUser(JSON.parse(storedUser));
    } else {
      setShowAuthModal(true);
    }
  }, []);

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setAuthError('');

    if (!authEmail.trim() || !authName.trim()) {
      setAuthError('Please enter both name and email.');
      return;
    }

    try {
      if (isLoginTab) {
        if (!allUsers) {
          setAuthError('Loading users database. Please try again.');
          return;
        }
        const found = allUsers.find(
          (u) => u.email.toLowerCase() === authEmail.toLowerCase().trim()
        );
        if (found) {
          localStorage.setItem('sanjeevani_user', JSON.stringify(found));
          setCurrentUser(found);
          setShowAuthModal(false);
        } else {
          setAuthError('No account found with this email. Please sign up!');
        }
      } else {
        // Sign Up
        const newUserId = await createUser({
          name: authName.trim(),
          email: authEmail.trim(),
          phone: authPhone.trim() || 'Not Provided',
          role: authRole,
        });
        const newUserObj = {
          _id: newUserId,
          name: authName.trim(),
          email: authEmail.trim(),
          phone: authPhone.trim() || 'Not Provided',
          role: authRole,
        };
        localStorage.setItem('sanjeevani_user', JSON.stringify(newUserObj));
        setCurrentUser(newUserObj);
        setShowAuthModal(false);
      }
    } catch (err) {
      setAuthError('Authentication failed: ' + err.message);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('sanjeevani_user');
    setCurrentUser(null);
    setShowAuthModal(true);
  };

  const handleFeedbackSubmit = async (e) => {
    e.preventDefault();
    try {
      await addFeedback({
        userId: currentUser?.name || 'Guest',
        rating: feedbackRating,
        comment: feedbackComment,
      });
      setFeedbackSuccessMsg('Thank you for your feedback!');
      setFeedbackComment('');
      setFeedbackRating(5);
      setTimeout(() => {
        setFeedbackSuccessMsg('');
        setShowFeedbackModal(false);
      }, 2000);
    } catch (err) {
      console.error('Failed to submit feedback', err);
    }
  };

  const handleTriageComplete = (newTriageData) => {
    console.log("Triage received:", newTriageData);
    setTriageQueue((prevQueue) => {
      if (prevQueue.some(item => item.id === newTriageData.id)) return prevQueue;
      return [newTriageData, ...prevQueue];
    });
    const outbreakResult = epidemicService.addCase(newTriageData);
    if (outbreakResult) setOutbreakData(outbreakResult);
  };

  return (
    <div className="super-app-layout">
      <CustomAlert />
      
      {/* Sci-Fi Sidebar Navigation */}
      <nav className="sci-fi-sidebar">
        <div className="sidebar-logo">
          <div className="logo-pulse"></div>
          <h1>SANJEEVANI</h1>
          <span>CLINICAL PORTAL</span>
        </div>
        
        <ul className="nav-menu">
          <li className={activeModule === 'triage' ? 'active' : ''} onClick={() => setActiveModule('triage')}>
            <Stethoscope size={20} /> <span>ER Triage AI</span>
          </li>
          <li className={activeModule === 'scribe' ? 'active' : ''} onClick={() => setActiveModule('scribe')}>
            <Mic size={20} /> <span>Auto-Scribe</span>
          </li>
          <li className={activeModule === 'pharma' ? 'active' : ''} onClick={() => setActiveModule('pharma')}>
            <Pill size={20} /> <span>Pharma AI</span>
          </li>
          <li className={activeModule === 'vision' ? 'active' : ''} onClick={() => setActiveModule('vision')}>
            <ScanEye size={20} /> <span>Vision AI</span>
          </li>
          <li className={activeModule === 'multi-agent' ? 'active' : ''} onClick={() => setActiveModule('multi-agent')}>
            <Users size={20} /> <span>Multi-Agent AI</span>
          </li>
          <li className={activeModule === 'digital-twin' ? 'active' : ''} onClick={() => setActiveModule('digital-twin')}>
            <Activity size={20} /> <span>AI Digital Twin</span>
          </li>
          <li className={activeModule === 'genomic' ? 'active' : ''} onClick={() => setActiveModule('genomic')}>
            <Dna size={20} /> <span>Genomic AI</span>
          </li>
          <li className={activeModule === 'art-therapy' ? 'active' : ''} onClick={() => setActiveModule('art-therapy')}>
            <Palette size={20} /> <span>Art Therapy</span>
          </li>
        </ul>
        
        <div className="system-status">
          <div className="status-dot"></div>
          <span>SYSTEMS ONLINE</span>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="module-content" style={{ position: 'relative' }}>
        
        {/* Top-Right Control & Auth Bar */}
        <div style={{ position: 'absolute', top: '15px', right: '25px', zIndex: 100, display: 'flex', gap: '1rem', alignItems: 'center' }}>
          
          {/* Feedback Button */}
          <button 
            onClick={() => setShowFeedbackModal(true)}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(2, 132, 199, 0.15)', border: '1px solid rgba(2, 132, 199, 0.3)', color: '#38bdf8', padding: '0.6rem 1.2rem', borderRadius: '20px', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.3s ease', fontFamily: 'JetBrains Mono', fontSize: '0.85rem' }}
          >
            <MessageSquare size={16} /> Feedback
          </button>

          {/* User Section */}
          {currentUser ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', background: 'rgba(15, 23, 42, 0.85)', border: '1px solid var(--glass-border)', padding: '0.5rem 1rem', borderRadius: '30px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--primary)' }}>
                <User size={16} />
                <span style={{ fontSize: '0.85rem', fontWeight: 'bold', fontFamily: 'JetBrains Mono' }}>{currentUser.name} ({currentUser.role})</span>
              </div>
              <button 
                onClick={handleLogout}
                style={{ background: 'none', border: 'none', color: '#ef4444', display: 'flex', alignItems: 'center', cursor: 'pointer', padding: '0.2rem' }}
                title="Logout"
              >
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <button 
              onClick={() => setShowAuthModal(true)}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'linear-gradient(90deg, #0ea5e9, #14b8a6)', border: 'none', color: 'white', padding: '0.6rem 1.4rem', borderRadius: '30px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 15px rgba(2, 132, 199, 0.25)' }}
            >
              <LogIn size={16} /> Sign In
            </button>
          )}
        </div>

        {activeModule === 'triage' && (
          <div className="app-container" style={{ paddingTop: '50px' }}>
            <PatientKiosk onTriageComplete={handleTriageComplete} currentUser={currentUser} />
            <DoctorDashboard triageQueue={triageQueue} />
            <EpidemicAlert outbreakData={outbreakData} onClose={() => setOutbreakData(null)} />
          </div>
        )}
        
        {activeModule === 'scribe' && <div style={{ paddingTop: '50px' }}><AutoScribe /></div>}
        {activeModule === 'pharma' && <div style={{ paddingTop: '50px' }}><PharmaAI /></div>}
        {activeModule === 'vision' && <div style={{ paddingTop: '50px' }}><VisionAI /></div>}
        {activeModule === 'multi-agent' && <div style={{ paddingTop: '50px' }}><MultiAgent /></div>}
        {activeModule === 'digital-twin' && <div style={{ paddingTop: '50px' }}><DigitalTwin /></div>}
        {activeModule === 'genomic' && <div style={{ paddingTop: '50px' }}><GenomicScanner /></div>}
        {activeModule === 'art-therapy' && <div style={{ paddingTop: '50px' }}><ArtTherapy /></div>}
      </main>

      {/* Auth Modal Overlay */}
      {showAuthModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(4, 7, 17, 0.9)', backdropFilter: 'blur(10px)', zIndex: 9999, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '420px', padding: '2rem', border: '1px solid rgba(0, 240, 255, 0.25)', boxShadow: '0 0 30px rgba(0, 240, 255, 0.15)', borderRadius: '16px', position: 'relative' }}>
            
            {/* If user clicks close, hide auth modal only if they are logged in */}
            {currentUser && (
              <button 
                onClick={() => setShowAuthModal(false)}
                style={{ position: 'absolute', top: '15px', right: '15px', background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            )}

            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.8rem', color: 'var(--primary)', letterSpacing: '2px', textShadow: '0 0 10px rgba(0,240,255,0.3)', margin: '0' }}>Sanjeevani Portal</h2>
              <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '0.4rem', fontFamily: 'JetBrains Mono' }}>CLINICAL ACCESS TERMINAL</p>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.1)', marginBottom: '1.5rem' }}>
              <button 
                onClick={() => { setIsLoginTab(true); setAuthError(''); }}
                style={{ flex: 1, padding: '0.8rem', background: 'none', border: 'none', borderBottom: isLoginTab ? '2px solid var(--primary)' : '2px solid transparent', color: isLoginTab ? '#fff' : '#94a3b8', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.95rem' }}
              >
                Login
              </button>
              <button 
                onClick={() => { setIsLoginTab(false); setAuthError(''); }}
                style={{ flex: 1, padding: '0.8rem', background: 'none', border: 'none', borderBottom: !isLoginTab ? '2px solid var(--primary)' : '2px solid transparent', color: !isLoginTab ? '#fff' : '#94a3b8', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.95rem' }}
              >
                Sign Up
              </button>
            </div>

            {authError && (
              <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444', color: '#fca5a5', padding: '0.8rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.85rem', textAlign: 'center' }}>
                {authError}
              </div>
            )}

            <form onSubmit={handleAuthSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              
              {!isLoginTab && (
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.3rem', fontFamily: 'JetBrains Mono' }}>FULL NAME*</label>
                  <input 
                    type="text" 
                    required 
                    value={authName}
                    onChange={(e) => setAuthName(e.target.value)}
                    placeholder="Enter your name"
                    style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', background: 'rgba(0,0,0,0.4)', border: '1px solid var(--glass-border)', color: '#fff', outline: 'none' }}
                  />
                </div>
              )}

              {isLoginTab && (
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.3rem', fontFamily: 'JetBrains Mono' }}>USER NAME OR EMAIL*</label>
                  <input 
                    type="text" 
                    required 
                    value={authEmail}
                    onChange={(e) => setAuthEmail(e.target.value)}
                    placeholder="Enter name or email"
                    style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', background: 'rgba(0,0,0,0.4)', border: '1px solid var(--glass-border)', color: '#fff', outline: 'none' }}
                  />
                </div>
              )}

              {!isLoginTab && (
                <>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.3rem', fontFamily: 'JetBrains Mono' }}>EMAIL ADDRESS*</label>
                    <input 
                      type="email" 
                      required 
                      value={authEmail}
                      onChange={(e) => setAuthEmail(e.target.value)}
                      placeholder="Enter email address"
                      style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', background: 'rgba(0,0,0,0.4)', border: '1px solid var(--glass-border)', color: '#fff', outline: 'none' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.3rem', fontFamily: 'JetBrains Mono' }}>PHONE NUMBER</label>
                    <input 
                      type="text" 
                      value={authPhone}
                      onChange={(e) => setAuthPhone(e.target.value)}
                      placeholder="Enter phone number"
                      style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', background: 'rgba(0,0,0,0.4)', border: '1px solid var(--glass-border)', color: '#fff', outline: 'none' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.3rem', fontFamily: 'JetBrains Mono' }}>SELECT ROLE</label>
                    <select 
                      value={authRole}
                      onChange={(e) => setAuthRole(e.target.value)}
                      style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', background: 'rgba(0,0,0,0.4)', border: '1px solid var(--glass-border)', color: '#fff', outline: 'none', cursor: 'pointer' }}
                    >
                      <option value="Patient" style={{ background: '#040711' }}>Patient</option>
                      <option value="Doctor" style={{ background: '#040711' }}>Doctor</option>
                    </select>
                  </div>
                </>
              )}

              {/* Submit */}
              <button 
                type="submit"
                style={{ width: '100%', padding: '0.9rem', background: 'linear-gradient(90deg, #0ea5e9, #14b8a6)', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', marginTop: '0.5rem', boxShadow: '0 4px 15px rgba(2, 132, 199, 0.3)', transition: 'all 0.3s ease' }}
              >
                {isLoginTab ? 'LOG IN' : 'CREATE ACCOUNT'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Feedback Modal Overlay */}
      {showFeedbackModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(4, 7, 17, 0.85)', backdropFilter: 'blur(8px)', zIndex: 9999, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '450px', padding: '2rem', border: '1px solid rgba(139, 92, 246, 0.3)', borderRadius: '16px', position: 'relative' }}>
            
            <button 
              onClick={() => setShowFeedbackModal(false)}
              style={{ position: 'absolute', top: '15px', right: '15px', background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
            >
              <X size={20} />
            </button>

            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.5rem', color: 'var(--primary)', letterSpacing: '1px', margin: '0' }}>Clinical Feedback</h2>
              <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.3rem', fontFamily: 'JetBrains Mono' }}>SHARE YOUR EXPERIENCE</p>
            </div>

            {feedbackSuccessMsg ? (
              <div style={{ color: '#10b981', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', padding: '2rem 0', fontFamily: 'JetBrains Mono' }}>
                <Star size={48} className="animate-spin" style={{ color: '#10b981' }} />
                <span>{feedbackSuccessMsg}</span>
              </div>
            ) : (
              <form onSubmit={handleFeedbackSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                
                {/* Rating selection */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.5rem', fontFamily: 'JetBrains Mono' }}>RATING</label>
                  <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                    {[1, 2, 3, 4, 5].map((val) => (
                      <button 
                        key={val}
                        type="button"
                        onClick={() => setFeedbackRating(val)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', transition: 'all 0.2s ease' }}
                      >
                        <Star 
                          size={32} 
                          fill={val <= feedbackRating ? '#fbbf24' : 'none'} 
                          color={val <= feedbackRating ? '#fbbf24' : '#4b5563'} 
                        />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Comment */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.3rem', fontFamily: 'JetBrains Mono' }}>FEEDBACK COMMENT</label>
                  <textarea 
                    required 
                    rows={4}
                    value={feedbackComment}
                    onChange={(e) => setFeedbackComment(e.target.value)}
                    placeholder="Tell us what we can improve..."
                    style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', background: 'rgba(0,0,0,0.4)', border: '1px solid var(--glass-border)', color: '#fff', outline: 'none', resize: 'none' }}
                  />
                </div>

                <button 
                  type="submit"
                  style={{ width: '100%', padding: '0.9rem', background: '#8b5cf6', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 15px rgba(139, 92, 246, 0.4)' }}
                >
                  SUBMIT FEEDBACK
                </button>
              </form>
            )}
          </div>
        </div>
      )}

    </div>
  );
}

export default App;
