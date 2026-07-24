import React, { useState } from 'react';
import { generateDigitalTwinTrajectory } from '../services/AIEngine';
import { Activity, Heart, Info, Loader2, TrendingUp, AlertTriangle, UserPlus, Dna, Brain, Stethoscope, Droplet, Clock } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const DigitalTwin = () => {
  const [formData, setFormData] = useState({
    age: '',
    gender: 'Male',
    height: '',
    weight: '',
    conditions: '',
    familyHistory: '',
    lifestyle: ''
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [trajectoryData, setTrajectoryData] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  const handleGenerate = async () => {
    if (!formData.age || !formData.weight || !formData.height) return;
    setIsGenerating(true);
    setTrajectoryData(null);
    setErrorMsg('');

    try {
      const data = await generateDigitalTwinTrajectory(formData);
      
      // Artificial delay for UI effect
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Add display names for X axis
      const formattedData = {
        ...data,
        trajectory: data.trajectory.map(d => ({ ...d, yearLabel: `Year ${d.year}` }))
      };
      
      setTrajectoryData(formattedData);
    } catch (err) {
      setErrorMsg(err.message || "Failed to generate twin.");
    } finally {
      setIsGenerating(false);
    }
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const dataPoint = payload[0].payload;
      return (
        <div style={{ background: 'rgba(0,0,0,0.95)', padding: '1.2rem', border: '1px solid var(--glass-border)', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.5)' }}>
          <p style={{ color: '#fff', fontWeight: 'bold', margin: '0 0 1rem 0', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem' }}>{label}</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
            <p style={{ color: '#ff4d4d', margin: 0, display: 'flex', alignItems: 'center', gap: '0.3rem' }}><Heart size={14}/> Cardiac: {dataPoint.cardiacRisk}%</p>
            <p style={{ color: '#3b82f6', margin: 0, display: 'flex', alignItems: 'center', gap: '0.3rem' }}><Activity size={14}/> Metabolic: {dataPoint.metabolicRisk}%</p>
            <p style={{ color: '#a855f7', margin: 0, display: 'flex', alignItems: 'center', gap: '0.3rem' }}><Brain size={14}/> Neuro: {dataPoint.neuroRisk}%</p>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '1rem', fontStyle: 'italic' }}>"{dataPoint.event}"</p>
        </div>
      );
    }
    return null;
  };

  const renderOrganBar = (name, score, color, icon) => (
    <div style={{ marginBottom: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem', color: '#e2e8f0', fontSize: '0.9rem' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>{icon} {name}</span>
        <span style={{ color }}>{score}/100</span>
      </div>
      <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
        <div style={{ width: `${score}%`, height: '100%', background: color, borderRadius: '4px', boxShadow: `0 0 10px ${color}` }} />
      </div>
    </div>
  );

  return (
    <div className="module-container" style={{ display: 'flex', gap: '2rem', height: '85vh' }}>
      
      {/* Left Column: Data Input */}
      <div className="glass-panel" style={{ flex: '0 0 35%', display: 'flex', flexDirection: 'column' }}>
        <div className="section-header" style={{ marginBottom: '1.5rem' }}>
          <h2>Digital Twin AI</h2>
          <p>Advanced Predictive Physiological Modeling</p>
        </div>

        <div className="custom-scrollbar" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1.2rem', overflowY: 'auto', paddingRight: '1rem' }}>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', color: 'var(--text-muted)', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Age</label>
              <input type="number" placeholder="e.g. 45" value={formData.age} onChange={e => setFormData({...formData, age: e.target.value})} style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', background: 'rgba(0,0,0,0.4)', border: '1px solid var(--glass-border)', color: '#fff' }} />
            </div>
            <div>
              <label style={{ display: 'block', color: 'var(--text-muted)', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Gender</label>
              <select value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value})} style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', background: 'rgba(0,0,0,0.4)', border: '1px solid var(--glass-border)', color: '#fff', appearance: 'none' }}>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', color: 'var(--text-muted)', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Height (cm)</label>
              <input type="number" placeholder="e.g. 175" value={formData.height} onChange={e => setFormData({...formData, height: e.target.value})} style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', background: 'rgba(0,0,0,0.4)', border: '1px solid var(--glass-border)', color: '#fff' }} />
            </div>
            <div>
              <label style={{ display: 'block', color: 'var(--text-muted)', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Weight (kg)</label>
              <input type="number" placeholder="e.g. 80" value={formData.weight} onChange={e => setFormData({...formData, weight: e.target.value})} style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', background: 'rgba(0,0,0,0.4)', border: '1px solid var(--glass-border)', color: '#fff' }} />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', color: 'var(--text-muted)', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Chronic Conditions & Meds</label>
            <textarea placeholder="e.g. Hypertension, Metformin 500mg" value={formData.conditions} onChange={e => setFormData({...formData, conditions: e.target.value})} style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', background: 'rgba(0,0,0,0.4)', border: '1px solid var(--glass-border)', color: '#fff', resize: 'vertical', minHeight: '60px' }} />
          </div>

          <div>
            <label style={{ display: 'block', color: 'var(--text-muted)', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Family History</label>
            <textarea placeholder="e.g. Father had heart attack at 50" value={formData.familyHistory} onChange={e => setFormData({...formData, familyHistory: e.target.value})} style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', background: 'rgba(0,0,0,0.4)', border: '1px solid var(--glass-border)', color: '#fff', resize: 'vertical', minHeight: '60px' }} />
          </div>

          <div>
            <label style={{ display: 'block', color: 'var(--text-muted)', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Lifestyle Details</label>
            <textarea placeholder="e.g. Smokes 10/day, sedantry job, high stress" value={formData.lifestyle} onChange={e => setFormData({...formData, lifestyle: e.target.value})} style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', background: 'rgba(0,0,0,0.4)', border: '1px solid var(--glass-border)', color: '#fff', resize: 'vertical', minHeight: '60px' }} />
          </div>

          <button 
            onClick={handleGenerate} 
            disabled={isGenerating || !formData.age || !formData.weight || !formData.height}
            style={{ marginTop: 'auto', padding: '1.2rem', borderRadius: '8px', border: 'none', background: 'linear-gradient(90deg, #00f0ff, #3b82f6)', color: '#000', fontWeight: 'bold', fontSize: '1.1rem', cursor: (isGenerating || !formData.age) ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', boxShadow: '0 0 20px rgba(0, 240, 255, 0.4)' }}
          >
            {isGenerating ? <><Loader2 className="spin" size={20} /> SYNTHESIZING TWIN...</> : <><UserPlus size={20} /> GENERATE DIGITAL TWIN</>}
          </button>

          {errorMsg && <p style={{ color: 'var(--status-red)', textAlign: 'center', margin: 0, marginTop: '1rem' }}>{errorMsg}</p>}
        </div>
      </div>

      {/* Right Column: Twin Output */}
      <div className="glass-panel" style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '1.5rem', background: 'rgba(0,0,0,0.2)', overflowY: 'auto' }}>
        
        {!trajectoryData && !isGenerating && (
          <div style={{ margin: 'auto', textAlign: 'center', color: 'var(--text-muted)' }}>
            <UserPlus size={64} style={{ opacity: 0.2, marginBottom: '1rem' }} />
            <p>Input patient data to synthesize a high-fidelity Digital Twin.</p>
          </div>
        )}

        {isGenerating && (
          <div style={{ margin: 'auto', textAlign: 'center', color: 'var(--text-muted)', animation: 'pulse 1.5s infinite' }}>
            <div className="hologram-scanner" style={{ width: '200px', height: '200px', margin: '0 auto 2rem auto', border: '2px solid #00f0ff', borderRadius: '50%', position: 'relative', overflow: 'hidden', boxShadow: '0 0 50px rgba(0, 240, 255, 0.2)' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '10px', background: '#00f0ff', boxShadow: '0 0 30px #00f0ff', animation: 'scan 2s linear infinite' }} />
              <Dna size={80} color="#00f0ff" style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', opacity: 0.8 }} />
            </div>
            <p style={{ color: '#00f0ff', letterSpacing: '2px' }}>SIMULATING 80,000 PHYSIOLOGICAL VARIABLES...</p>
          </div>
        )}

        {trajectoryData && (
          <div className="custom-scrollbar" style={{ display: 'flex', flexDirection: 'column', gap: '2rem', animation: 'fadeIn 1s ease-out' }}>
            
            {/* Top Metrics Row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
              <div style={{ background: 'rgba(0, 240, 255, 0.05)', border: '1px solid rgba(0, 240, 255, 0.2)', padding: '1.5rem', borderRadius: '12px', textAlign: 'center' }}>
                <Clock size={24} color="#00f0ff" style={{ margin: '0 auto 0.5rem auto' }} />
                <p style={{ color: 'var(--text-muted)', margin: '0 0 0.5rem 0', fontSize: '0.9rem' }}>Biological Age</p>
                <h2 style={{ margin: 0, color: '#fff', fontSize: '2.5rem' }}>{trajectoryData.biologicalAge}<span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}> yrs</span></h2>
                <p style={{ color: trajectoryData.biologicalAge > parseInt(formData.age) ? '#ff4d4d' : '#10b981', margin: '0.5rem 0 0 0', fontSize: '0.8rem' }}>
                  {trajectoryData.biologicalAge > parseInt(formData.age) ? `+${trajectoryData.biologicalAge - parseInt(formData.age)} years accelerated aging` : `-${parseInt(formData.age) - trajectoryData.biologicalAge} years decelerated aging`}
                </p>
              </div>
              <div style={{ background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.2)', padding: '1.5rem', borderRadius: '12px', textAlign: 'center' }}>
                <Activity size={24} color="#10b981" style={{ margin: '0 auto 0.5rem auto' }} />
                <p style={{ color: 'var(--text-muted)', margin: '0 0 0.5rem 0', fontSize: '0.9rem' }}>Life Expectancy</p>
                <h2 style={{ margin: 0, color: '#fff', fontSize: '2.5rem' }}>{trajectoryData.lifeExpectancy}<span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}> yrs</span></h2>
              </div>
              <div style={{ background: 'rgba(168, 85, 247, 0.05)', border: '1px solid rgba(168, 85, 247, 0.2)', padding: '1.5rem', borderRadius: '12px', textAlign: 'center' }}>
                <Activity size={24} color="#a855f7" style={{ margin: '0 auto 0.5rem auto' }} />
                <p style={{ color: 'var(--text-muted)', margin: '0 0 0.5rem 0', fontSize: '0.9rem' }}>BMI Baseline</p>
                <h2 style={{ margin: 0, color: '#fff', fontSize: '2.5rem' }}>{(parseFloat(formData.weight) / ((parseFloat(formData.height)/100) * (parseFloat(formData.height)/100))).toFixed(1)}</h2>
              </div>
            </div>

            {/* Organ Health & Trajectory Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem' }}>
              
              {/* Organ Health */}
              <div style={{ background: 'rgba(0,0,0,0.3)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#fff', marginTop: 0, marginBottom: '1.5rem', fontSize: '1.1rem' }}><Stethoscope size={20} color="#00f0ff" /> Organ Health Index</h3>
                {renderOrganBar('Heart', trajectoryData.organHealth.heart, '#ff4d4d', <Heart size={16} />)}
                {renderOrganBar('Brain', trajectoryData.organHealth.brain, '#a855f7', <Brain size={16} />)}
                {renderOrganBar('Lungs', trajectoryData.organHealth.lungs, '#38bdf8', <Activity size={16} />)}
                {renderOrganBar('Liver', trajectoryData.organHealth.liver, '#f59e0b', <Droplet size={16} />)}
                {renderOrganBar('Kidneys', trajectoryData.organHealth.kidneys, '#3b82f6', <Droplet size={16} />)}
              </div>

              {/* Trajectory Graph */}
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#fff', marginTop: 0, marginBottom: '1.5rem', fontSize: '1.1rem' }}><TrendingUp size={20} color="#00f0ff" /> 10-Year Health Trajectory</h3>
                <div style={{ flex: 1, minHeight: '250px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trajectoryData.trajectory} margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                      <XAxis dataKey="yearLabel" stroke="#888" fontSize={12} />
                      <YAxis stroke="#888" unit="%" fontSize={12} />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                      <Line type="monotone" dataKey="cardiacRisk" name="Cardiac Risk" stroke="#ff4d4d" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                      <Line type="monotone" dataKey="metabolicRisk" name="Metabolic Risk" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4 }} />
                      <Line type="monotone" dataKey="neuroRisk" name="Neurological Risk" stroke="#a855f7" strokeWidth={3} dot={{ r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

            </div>

            {/* Warnings Row */}
            <div style={{ display: 'flex', gap: '1rem' }}>
              <div style={{ flex: 1, background: 'rgba(255, 77, 77, 0.1)', border: '1px solid rgba(255, 77, 77, 0.3)', padding: '1.5rem', borderRadius: '12px' }}>
                <h4 style={{ color: '#ff4d4d', marginTop: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}><AlertTriangle size={18} /> Critical AI Warning</h4>
                <p style={{ color: '#e2e8f0', margin: 0, lineHeight: 1.5 }}>{trajectoryData.criticalWarning}</p>
              </div>
              <div style={{ flex: 1, background: 'rgba(0, 240, 255, 0.1)', border: '1px solid rgba(0, 240, 255, 0.3)', padding: '1.5rem', borderRadius: '12px' }}>
                <h4 style={{ color: '#00f0ff', marginTop: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Info size={18} /> Preventative Protocol</h4>
                <p style={{ color: '#e2e8f0', margin: 0, lineHeight: 1.5 }}>{trajectoryData.preventativeAction}</p>
              </div>
            </div>

          </div>
        )}

      </div>
      
    </div>
  );
};

export default DigitalTwin;
