import React, { useState } from 'react';
import { Stethoscope, Mic, Pill, ScanEye, Users, Activity, Dna, Palette, Camera } from 'lucide-react';
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

function App() {
  const [activeModule, setActiveModule] = useState('triage');
  const [triageQueue, setTriageQueue] = useState([]);
  const [outbreakData, setOutbreakData] = useState(null);

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
          <span>AI COMMAND CENTER</span>
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
      <main className="module-content">
        {activeModule === 'triage' && (
          <div className="app-container">
            <PatientKiosk onTriageComplete={handleTriageComplete} />
            <DoctorDashboard triageQueue={triageQueue} />
            <EpidemicAlert outbreakData={outbreakData} onClose={() => setOutbreakData(null)} />
          </div>
        )}
        
        {activeModule === 'scribe' && <AutoScribe />}
        {activeModule === 'pharma' && <PharmaAI />}
        {activeModule === 'vision' && <VisionAI />}
        {activeModule === 'multi-agent' && <MultiAgent />}
        {activeModule === 'digital-twin' && <DigitalTwin />}
        {activeModule === 'genomic' && <GenomicScanner />}
        {activeModule === 'art-therapy' && <ArtTherapy />}
      </main>
    </div>
  );
}

export default App;
