import React, { useState } from 'react';
import { analyzeArtTherapyEmotion } from '../services/AIEngine';
import { saveReportToDB, downloadPDF } from '../services/ReportService';
import { uploadToCloudinary } from '../services/CloudinaryService';
import { showAlert } from '../services/AlertService';
import { Palette, HeartHandshake, Loader2, Download, Sparkles, Brain, Heart, Save } from 'lucide-react';
const ArtTherapy = () => {
  const [prompt, setPrompt] = useState('');
  const [imageUrl, setImageUrl] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiReport, setAiReport] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [patientId, setPatientId] = useState('');

  const handleSaveReport = async () => {
    if (!aiReport || !imageUrl) return;
    if (!patientId.trim()) {
      showAlert('Patient ID is mandatory to save reports in the EHR system.', 'error');
      return;
    }
    
    setIsSaving(true);
    try {
      const cloudinaryUrl = await uploadToCloudinary(imageUrl, patientId);
      await saveReportToDB('ArtTherapy', patientId, { ...aiReport, imageUrl: cloudinaryUrl });
      showAlert('Image uploaded to Cloudinary and report saved to EHR database successfully!', 'success');
    } catch (err) {
      showAlert('Failed to save report: ' + err.message, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDownload = () => {
    downloadPDF('ArtTherapy', patientId || 'Anonymous', aiReport);
  };

  const generateArt = async () => {
    if (!prompt.trim()) return;
    setIsGenerating(true);
    setImageUrl(null);
    setAiReport(null);
    setErrorMsg('');
    
    try {
      // 1. Get Psychological Analysis & Prompt from AI
      const analysis = await analyzeArtTherapyEmotion(prompt);
      setAiReport(analysis);
      
      // 2. Generate Image via free Pollinations API using the exact literal user prompt directly
      // This bypasses any AI censorship and forces a 100% literal hyper-realistic render
      const finalUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt + " hyper-realistic, 8k resolution, cinematic, photorealistic, highly detailed")}?width=1024&height=1024&nologo=true&model=flux&seed=${Math.floor(Math.random() * 1000)}`;
      
      // 3. Pre-load the image to show spinner until ready
      const img = new Image();
      img.src = finalUrl;
      img.onload = () => {
        setImageUrl(finalUrl);
        setIsGenerating(false);
      };
      img.onerror = () => {
        throw new Error("Failed to render artwork.");
      };
      
    } catch (err) {
      console.error(err);
      setErrorMsg("Failed to generate therapy session. Please try again.");
      setIsGenerating(false);
    }
  };

  return (
    <div className="module-container" style={{ display: 'flex', gap: '2rem', height: '85vh' }}>
      
      {/* Left Column: Input and Analysis */}
      <div className="glass-panel custom-scrollbar" style={{ flex: '0 0 40%', display: 'flex', flexDirection: 'column', overflowY: 'auto', paddingRight: '1rem' }}>
        <div className="section-header" style={{ marginBottom: '1.5rem', position: 'sticky', top: 0, background: 'rgba(0,0,0,0.8)', zIndex: 10, paddingBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <h2>Generative Art Therapy</h2>
          <p>AI-Assisted Psychological Expression</p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Input Section */}
          <div style={{ background: 'rgba(0,0,0,0.3)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
            <h3 style={{ color: 'var(--primary)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.1rem' }}>
              <HeartHandshake size={20} /> Express Your Feelings
            </h3>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe your current emotional state, thoughts, or a traumatic memory in your own words..."
              style={{ width: '100%', padding: '1rem', borderRadius: '8px', background: 'rgba(0,0,0,0.4)', border: '1px solid var(--glass-border)', color: '#fff', fontSize: '1.1rem', resize: 'vertical', minHeight: '120px', fontFamily: 'inherit', lineHeight: '1.5' }}
              disabled={isGenerating}
            />
            
            <button 
              onClick={generateArt} 
              disabled={isGenerating || !prompt.trim()}
              style={{ marginTop: '1rem', width: '100%', padding: '1.2rem', borderRadius: '8px', border: 'none', background: 'linear-gradient(90deg, #db2777, #9333ea)', color: '#fff', fontWeight: 'bold', fontSize: '1.1rem', cursor: (isGenerating || !prompt.trim()) ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', boxShadow: '0 0 20px rgba(219, 39, 119, 0.4)' }}
            >
              {isGenerating ? <><Loader2 className="spin" size={20} /> ANALYZING PSYCHE & PAINTING...</> : <><Sparkles size={20} /> INITIATE THERAPY SESSION</>}
            </button>
            {errorMsg && <p style={{ color: 'var(--status-red)', textAlign: 'center', marginTop: '1rem', marginBottom: 0 }}>{errorMsg}</p>}
          </div>

          {/* AI Psychological Analysis */}
          {aiReport && (
            <div id="art-therapy-report" style={{ animation: 'fadeIn 0.5s ease-out', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              
              <div style={{ background: 'rgba(147, 51, 234, 0.1)', border: '1px solid rgba(147, 51, 234, 0.3)', padding: '1.5rem', borderRadius: '12px' }}>
                <h4 style={{ color: '#c084fc', margin: '0 0 0.8rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Brain size={18} /> Psychological Insight</h4>
                <p style={{ color: '#e2e8f0', margin: 0, lineHeight: '1.6' }}>{aiReport.insight}</p>
              </div>

              <div style={{ background: 'rgba(219, 39, 119, 0.1)', border: '1px solid rgba(219, 39, 119, 0.3)', padding: '1.5rem', borderRadius: '12px' }}>
                <h4 style={{ color: '#f472b6', margin: '0 0 0.8rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Heart size={18} /> Therapeutic Recommendation</h4>
                <p style={{ color: '#e2e8f0', margin: 0, lineHeight: '1.6' }}>{aiReport.recommendation}</p>
              </div>

              {aiReport.colorPalette && (
                <div style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid var(--glass-border)', padding: '1.5rem', borderRadius: '12px' }}>
                  <h4 style={{ color: 'var(--text-muted)', margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', textTransform: 'uppercase' }}><Palette size={16} /> Healing Color Palette</h4>
                  <div style={{ display: 'flex', gap: '1rem' }}>
                    {aiReport.colorPalette.map((color, idx) => (
                      <div key={idx} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{ width: '100%', paddingTop: '100%', background: color, borderRadius: '50%', boxShadow: `0 0 15px ${color}80`, border: '2px solid rgba(255,255,255,0.1)' }} />
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{color}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Patient ID Input Before Save/Download */}
              <div style={{ marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Assign Patient ID (Mandatory)*</label>
                <input 
                  type="text" 
                  value={patientId}
                  onChange={(e) => setPatientId(e.target.value)}
                  placeholder="e.g. PAT-90812"
                  style={{ padding: '0.8rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'rgba(0,0,0,0.5)', color: '#fff', fontSize: '1rem' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                <button 
                  onClick={handleSaveReport}
                  disabled={isSaving}
                  style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.8rem', borderRadius: '8px', border: 'none', background: 'var(--primary)', color: '#000', fontWeight: 'bold', cursor: isSaving ? 'not-allowed' : 'pointer' }}
                >
                  {isSaving ? <Loader2 size={18} className="spin" /> : <Save size={18} />}
                  {isSaving ? 'Saving...' : 'Save Report'}
                </button>
                <button 
                  onClick={handleDownload}
                  style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.8rem', borderRadius: '8px', border: '1px solid var(--primary)', background: 'transparent', color: 'var(--primary)', fontWeight: 'bold', cursor: 'pointer' }}
                >
                  <Download size={18} />
                  Download PDF
                </button>
                <button 
                  onClick={() => { setPrompt(''); setImageUrl(''); setAiReport(null); setErrorMsg(''); setPatientId(''); }}
                  disabled={isSaving}
                  style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.8rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.2)', background: 'transparent', color: '#fff', fontWeight: 'bold', cursor: isSaving ? 'not-allowed' : 'pointer' }}
                >
                  Clear
                </button>
              </div>

            </div>
          )}

        </div>
      </div>

      {/* Right Column: Canvas */}
      <div className="glass-panel" style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '0', background: 'rgba(0,0,0,0.2)' }}>
        <div className="section-header" style={{ padding: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)', margin: 0 }}>
          <h2 style={{ fontSize: '1.2rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Palette size={20} color="#db2777" /> AI Emotional Canvas</h2>
        </div>

        <div style={{ flex: 1, padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
          
          {!imageUrl && !isGenerating && (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
              <Palette size={64} style={{ opacity: 0.2, marginBottom: '1rem' }} />
              <p>Your unique emotional masterpiece will be rendered here.</p>
            </div>
          )}

          {isGenerating && (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', animation: 'pulse 1.5s infinite' }}>
              <div style={{ position: 'relative', width: '100px', height: '100px', margin: '0 auto 2rem auto' }}>
                <div style={{ position: 'absolute', inset: 0, border: '4px solid rgba(219, 39, 119, 0.2)', borderRadius: '50%' }}></div>
                <div style={{ position: 'absolute', inset: 0, border: '4px solid #db2777', borderRadius: '50%', borderTopColor: 'transparent', animation: 'spin 1s linear infinite' }}></div>
                <Palette size={40} color="#db2777" style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', animation: 'pulse 2s infinite' }} />
              </div>
              <p style={{ color: '#db2777', letterSpacing: '1px' }}>SYNTHESIZING EMOTIONS INTO VISUAL ART...</p>
            </div>
          )}

          {imageUrl && !isGenerating && (
            <div style={{ position: 'relative', animation: 'fadeIn 1s ease-out', width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <img 
                src={imageUrl} 
                alt="AI Generated Art Therapy" 
                style={{ maxWidth: '100%', maxHeight: 'calc(100% - 80px)', objectFit: 'contain', borderRadius: '12px', boxShadow: '0 10px 40px rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.1)' }} 
              />
              <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem' }}>
                <button style={{ padding: '0.8rem 1.5rem', borderRadius: '20px', border: '1px solid #db2777', background: 'rgba(219, 39, 119, 0.1)', color: '#f472b6', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 'bold' }}>
                  <HeartHandshake size={18} /> Send to Psychiatrist
                </button>
                <a href={imageUrl} target="_blank" rel="noreferrer" style={{ padding: '0.8rem 1.5rem', borderRadius: '20px', border: 'none', background: 'linear-gradient(90deg, #db2777, #9333ea)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none', fontWeight: 'bold', boxShadow: '0 5px 15px rgba(219, 39, 119, 0.3)' }}>
                  <Download size={18} /> Save Masterpiece
                </a>
              </div>
            </div>
          )}

        </div>
      </div>
      
    </div>
  );
};

export default ArtTherapy;
