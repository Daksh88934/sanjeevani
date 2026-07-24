import React, { useState, useEffect, useRef } from 'react';
import { Activity, AlertTriangle, CheckCircle, Clock, HeartPulse, Stethoscope, HelpCircle, ShieldAlert, ClipboardList, FileText, CheckSquare, Edit2, Check, DollarSign, AlertOctagon, Volume2, BookOpen, QrCode, X, Save, Download } from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import PharmacyPrescriptionWidget from './PharmacyPrescriptionWidget';
import AnatomicalHeatmap from './AnatomicalHeatmap';
import { saveReportToDB, downloadPDF } from '../services/ReportService';
import { showAlert } from '../services/AlertService';

const parseWaitTimeToSeconds = (str) => {
  const match = str.match(/(\d+)/);
  if (match) {
    return parseInt(match[1]) * 60;
  }
  return 0;
};

const formatTimeLeft = (seconds) => {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
};

const TriageCard = ({ data }) => {
  const [waitTime, setWaitTime] = useState(data.estimatedWaitTime || "Calculating...");
  const [isEditingWaitTime, setIsEditingWaitTime] = useState(false);
  const [timeLeft, setTimeLeft] = useState(() => parseWaitTimeToSeconds(data.estimatedWaitTime || "0 mins"));
  const [isTimeOver, setIsTimeOver] = useState(false);
  const [showQrExpanded, setShowQrExpanded] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveReport = async () => {
    setIsSaving(true);
    try {
      const payload = { ...data, estimatedWaitTime: waitTime };
      await saveReportToDB('Triage', data.patientId, payload);
      showAlert('Triage Record saved to database successfully!', 'success');
    } catch (err) {
      showAlert('Failed to save report: ' + err.message, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const reportRef = useRef(null);
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      const payload = { ...data, estimatedWaitTime: waitTime };
      await downloadPDF('Triage', data.patientId, payload);
      showAlert("PDF downloaded successfully!", "success");
    } catch (err) {
      console.error("PDF generation failed:", err);
      showAlert("Failed to generate PDF.", "error");
    } finally {
      setIsDownloading(false);
    }
  };

  // Using a louder continuous alarm clock sound
  const alarmAudio = useRef(new Audio('https://actions.google.com/sounds/v1/alarms/alarm_clock.ogg'));

  useEffect(() => {
    // Ensure alarm is loud and loops until stopped
    alarmAudio.current.volume = 1.0;
    alarmAudio.current.loop = true;
  }, []);

  useEffect(() => {
    if (isEditingWaitTime || timeLeft <= 0) return;

    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setIsTimeOver(true);
          alarmAudio.current.play().catch(e => console.log("Audio play blocked by browser", e));
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isEditingWaitTime, timeLeft]);

  const handleSaveWaitTime = () => {
    setIsEditingWaitTime(false);
    setIsTimeOver(false);
    setTimeLeft(parseWaitTimeToSeconds(waitTime));
    // Stop the alarm
    alarmAudio.current.pause();
    alarmAudio.current.currentTime = 0;
  };

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'red': return <AlertTriangle size={18} />;
      case 'yellow': return <Clock size={18} />;
      case 'green': return <CheckCircle size={18} />;
      default: return <Activity size={18} />;
    }
  };

  const ePrescriptionPayload = JSON.stringify({
    patientId: data.patientId,
    diagnosis: data.suspectedCondition,
    medicines: data.suggestedMedications,
    priority: data.priority,
    timestamp: data.timestamp
  });

  return (
    <>
      {showQrExpanded && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', zIndex: 9999, display: 'flex', justifyContent: 'center', alignItems: 'center', backdropFilter: 'blur(5px)' }} onClick={() => setShowQrExpanded(false)}>
          <div style={{ background: '#fff', padding: '2rem', borderRadius: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem', position: 'relative' }} onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setShowQrExpanded(false)} style={{ position: 'absolute', top: '10px', right: '10px', background: 'transparent', border: 'none', cursor: 'pointer', color: '#666' }}>
              <X size={24} />
            </button>
            <h3 style={{ color: '#111', margin: 0, textAlign: 'center' }}>Scan E-Prescription</h3>
            <QRCodeCanvas value={ePrescriptionPayload} size={256} level="H" includeMargin={true} />
            <p style={{ color: '#666', fontSize: '0.9rem', margin: 0, textAlign: 'center' }}>Patient: {data.patientId}<br/>{data.suspectedCondition}</p>
          </div>
        </div>
      )}
      
      <div className="glass-panel ehr-card" ref={reportRef}>
        <div className="ehr-header">
        <div className="patient-info" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div>
            <h3>Patient: {data.patientId}</h3>
            <p>{new Date(data.timestamp).toLocaleTimeString()}</p>
          </div>
          <div 
            style={{ background: '#fff', padding: '4px', borderRadius: '4px', cursor: 'pointer', border: '2px solid #8b5cf6' }}
            onClick={() => setShowQrExpanded(!showQrExpanded)}
            title="Scan for E-Prescription"
          >
            <QRCodeCanvas value={ePrescriptionPayload} size={48} level="H" />
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          {data.safetyReview?.isApproved && (
            <div className="department-badge" style={{ padding: '0.2rem 0.6rem', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid #10b981', borderRadius: '20px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.3rem', color: '#10b981' }}>
              <CheckSquare size={14} /> Multi-Agent Safety Verified
            </div>
          )}
          <div className="department-badge" style={{ padding: '0.2rem 0.6rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', borderRadius: '20px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.3rem', color: '#a1a1aa' }}>
            <Stethoscope size={14} /> {data.department}
          </div>
          <div className={`priority-badge ${data.priority}`}>
            <div className="priority-dot"></div>
            {data.priority.toUpperCase()} PRIORITY
            {getPriorityIcon(data.priority)}
          </div>
        </div>
      </div>

      {isTimeOver && (
        <div style={{ background: 'rgba(239, 68, 68, 0.2)', padding: '0.8rem', margin: '0 1.5rem', border: '1px solid #ef4444', borderRadius: '8px', color: '#fca5a5', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 'bold', animation: 'pulse 2s infinite' }}>
          <Volume2 className="animate-bounce" size={20} /> ALARM: Wait time is over for Patient {data.patientId}. Please assign a bed immediately!
        </div>
      )}

      <div className="ehr-body">
        {/* Dynamic Wait Time Predictor & Allocation */}
        <div style={{ background: isTimeOver ? 'rgba(239, 68, 68, 0.1)' : 'rgba(59, 130, 246, 0.1)', padding: '0.8rem 1.2rem', borderRadius: '8px', border: isTimeOver ? '1px solid #ef4444' : '1px solid rgba(59, 130, 246, 0.3)', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: isTimeOver ? '#ef4444' : '#93c5fd' }}>
            <Clock size={18} className={!isTimeOver && timeLeft > 0 ? "animate-pulse" : ""} /> <strong>Estimated Wait Time:</strong>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {isEditingWaitTime ? (
              <>
                <input 
                  type="text" 
                  value={waitTime} 
                  onChange={(e) => setWaitTime(e.target.value)} 
                  style={{ background: 'rgba(0,0,0,0.5)', color: '#fff', border: '1px solid #60a5fa', borderRadius: '4px', padding: '0.3rem 0.6rem', width: '120px', outline: 'none' }}
                />
                <button onClick={handleSaveWaitTime} style={{ background: '#10b981', border: 'none', color: '#fff', borderRadius: '4px', cursor: 'pointer', padding: '0.3rem' }}><Check size={16} /></button>
              </>
            ) : (
              <>
                <span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: isTimeOver ? '#ef4444' : '#fff', fontFamily: 'monospace' }}>
                  {formatTimeLeft(timeLeft)}
                </span>
                <button onClick={() => setIsEditingWaitTime(true)} style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', display: 'flex', padding: '0.2rem' }} title="Edit Wait Time"><Edit2 size={14} /></button>
              </>
            )}
          </div>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
          <div>
            <div className="data-group">
              <h4>Symptoms Extracted</h4>
              <div className="tag-list">
                {data.symptoms.map((sym, i) => (
                  <span key={i} className="tag" style={{borderColor: `var(--status-${data.priority})`}}>
                    {sym}
                  </span>
                ))}
              </div>
            </div>

            {/* XAI: Explainable AI Section */}
            <div style={{ background: 'rgba(0,0,0,0.3)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', marginTop: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <h4 style={{ margin: 0, color: '#e4e4e7', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <ShieldAlert size={16} color="#8b5cf6" /> AI Risk Confidence Meter
                </h4>
                <span style={{ fontWeight: 'bold', fontSize: '1.2rem', color: `var(--status-${data.priority})` }}>
                  {data.urgencyScore}%
                </span>
              </div>
              
              <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden', marginBottom: '1rem' }}>
                <div style={{ height: '100%', width: `${data.urgencyScore}%`, background: `var(--status-${data.priority})`, transition: 'width 1s ease-in-out' }}></div>
              </div>
              
              <div style={{ fontSize: '0.85rem', color: '#a1a1aa', background: 'rgba(255,255,255,0.05)', padding: '0.8rem', borderRadius: '8px', borderLeft: `3px solid var(--status-${data.priority})` }}>
                <strong style={{ color: '#d4d4d8' }}>AI Reasoning:</strong> {data.aiReasoning}
              </div>
            </div>
          </div>
          
          <AnatomicalHeatmap affectedPart={data.affectedBodyPart} />
        </div>

        {/* Bed Allocation Section */}
        <div style={{ background: 'linear-gradient(90deg, rgba(59, 130, 246, 0.1), rgba(139, 92, 246, 0.1))', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(139, 92, 246, 0.3)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ background: 'rgba(139, 92, 246, 0.2)', padding: '0.8rem', borderRadius: '50%', color: '#c4b5fd' }}>
            <Activity size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.2rem' }}>Suggested Bed Allocation</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#fff' }}>{data.suggestedBedAllocation}</div>
          </div>
        </div>

        <div className="data-group recommendations">
          <h4>AI Diagnosis & Clinical Pathway</h4>
          <div className="recommendation-item" style={{borderColor: `var(--status-${data.priority})`, color: '#fff', background: `var(--status-${data.priority}-bg)`}}>
            <strong>Suspected:</strong> {data.suspectedCondition}
          </div>

          {/* Differential Diagnosis (DDx) Matrix */}
          {data.ddxMatrix && data.ddxMatrix.length > 0 && (
            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--glass-border)', margin: '1rem 0' }}>
              <div style={{ fontSize: '0.85rem', color: '#a1a1aa', textTransform: 'uppercase', marginBottom: '0.8rem', fontWeight: 'bold' }}>Differential Diagnosis (DDx) Matrix</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                {data.ddxMatrix.map((dx, idx) => (
                  <div key={idx}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', marginBottom: '0.2rem' }}>
                      <span style={{ color: '#e4e4e7' }}>{dx.condition}</span>
                      <span style={{ color: idx === 0 ? '#10b981' : '#9ca3af', fontWeight: idx === 0 ? 'bold' : 'normal' }}>{dx.probability}%</span>
                    </div>
                    <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${dx.probability}%`, background: idx === 0 ? '#10b981' : '#6366f1', transition: 'width 1s ease-in-out' }}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <div className="clinical-notes" style={{ padding: '0.8rem', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', borderLeft: '3px solid #8b5cf6', margin: '0.5rem 0', fontSize: '0.9rem', color: '#d4d4d8' }}>
            <strong>Clinical Notes:</strong> {data.clinicalNotes}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
            {/* Causes Box */}
            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--glass-border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#fbbf24', marginBottom: '0.5rem', fontWeight: '500' }}>
                <HelpCircle size={16} /> Possible Causes
              </div>
              <ul style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.85rem', color: '#a1a1aa', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                {data.possibleCauses?.map((cause, i) => <li key={i}>{cause}</li>)}
              </ul>
            </div>

            {/* Precautions Box */}
            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--glass-border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#38bdf8', marginBottom: '0.5rem', fontWeight: '500' }}>
                <ShieldAlert size={16} /> Precautions & Safety
              </div>
              <ul style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.85rem', color: '#a1a1aa', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                {data.precautionsAndSafety?.map((prec, i) => <li key={i}>{prec}</li>)}
              </ul>
            </div>
          </div>

          <div className="data-group" style={{ marginTop: '1rem' }}>
            <h4>Expected Treatment Plan</h4>
            <p>{data.expectedTreatmentPlan}</p>
            
            {/* Clinical Evidence Citation (RAG) */}
            {data.clinicalCitation && (
              <div style={{ marginTop: '0.8rem', padding: '0.6rem', background: 'rgba(56, 189, 248, 0.05)', borderLeft: '3px solid #38bdf8', borderRadius: '0 8px 8px 0', fontSize: '0.85rem', color: '#bae6fd', display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                <BookOpen size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <strong style={{ display: 'block', color: '#7dd3fc', marginBottom: '2px', fontSize: '0.75rem', textTransform: 'uppercase' }}>Clinical Evidence Source</strong>
                  {data.clinicalCitation}
                </div>
              </div>
            )}
          </div>
          
          {/* Medical Billing Agent Section */}
          {data.billingInfo && (
            <div style={{ background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.2)', padding: '1rem', borderRadius: '8px', marginTop: '1rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <div style={{ background: 'rgba(16, 185, 129, 0.2)', padding: '0.6rem', borderRadius: '50%', color: '#10b981' }}>
                <DollarSign size={20} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.8rem', color: '#a1a1aa', textTransform: 'uppercase', marginBottom: '0.2rem' }}>Agent 3: Auto Medical Billing</div>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  <div style={{ background: 'rgba(255,255,255,0.1)', padding: '0.2rem 0.6rem', borderRadius: '4px', fontSize: '0.9rem', color: '#fff', fontWeight: 'bold' }}>
                    ICD-10: {data.billingInfo.icd10Code}
                  </div>
                  <div style={{ fontSize: '1rem', fontWeight: 'bold', color: '#10b981' }}>
                    Est. Cost: {data.billingInfo.estimatedCostINR}
                  </div>
                </div>
                <div style={{ fontSize: '0.8rem', color: '#9ca3af', marginTop: '0.3rem' }}>{data.billingInfo.billingNotes}</div>
              </div>
            </div>
          )}


          {data.pastMedicalHistory && (
            <div className="data-group" style={{ background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
              <h4 style={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <FileText size={16} /> Past Medical History (from OCR Scan)
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '0.5rem' }}>
                {data.pastMedicalHistory.pastDiagnoses?.length > 0 && (
                  <div>
                    <strong style={{ color: '#9ca3af', fontSize: '0.8rem', textTransform: 'uppercase' }}>Previous Diagnoses</strong>
                    <ul style={{ margin: '0.2rem 0 0 1rem', color: '#e5e7eb', fontSize: '0.9rem' }}>
                      {data.pastMedicalHistory.pastDiagnoses.map((d, i) => <li key={i}>{d}</li>)}
                    </ul>
                  </div>
                )}
                {data.pastMedicalHistory.currentMedications?.length > 0 && (
                  <div>
                    <strong style={{ color: '#9ca3af', fontSize: '0.8rem', textTransform: 'uppercase' }}>Current Medications</strong>
                    <ul style={{ margin: '0.2rem 0 0 1rem', color: '#e5e7eb', fontSize: '0.9rem' }}>
                      {data.pastMedicalHistory.currentMedications.map((m, i) => <li key={i}>{m}</li>)}
                    </ul>
                  </div>
                )}
                {data.pastMedicalHistory.allergies?.length > 0 && (
                  <div>
                    <strong style={{ color: '#ef4444', fontSize: '0.8rem', textTransform: 'uppercase' }}>Known Allergies</strong>
                    <ul style={{ margin: '0.2rem 0 0 1rem', color: '#fca5a5', fontSize: '0.9rem' }}>
                      {data.pastMedicalHistory.allergies.map((a, i) => <li key={i}>{a}</li>)}
                    </ul>
                  </div>
                )}
                {data.pastMedicalHistory.labResults && data.pastMedicalHistory.labResults !== 'null' && (
                  <div style={{ gridColumn: '1 / -1' }}>
                    <strong style={{ color: '#9ca3af', fontSize: '0.8rem', textTransform: 'uppercase' }}>Lab Results Summary</strong>
                    <p style={{ margin: '0.2rem 0 0 0', color: '#e5e7eb', fontSize: '0.9rem' }}>{data.pastMedicalHistory.labResults}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="data-group">
            <h4 style={{ textTransform: 'uppercase', fontSize: '0.8rem', color: '#9ca3af', letterSpacing: '1px' }}>Immediate Actions Required</h4>
              {data.recommendations.map((rec, i) => (
                <div key={i} className="recommendation-item" style={{ padding: '0.4rem 0.8rem', background: 'rgba(255,255,255,0.03)', marginTop: '0.3rem' }}>
                  <CheckCircle size={16} style={{ color: '#10b981' }} /> {rec}
                </div>
              ))}
          </div>

          {/* Pharmacovigilance Agent Alert */}
          {data.allergyAlert && (
            <div style={{ background: data.allergyAlert.hasRisk ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)', border: `1px solid ${data.allergyAlert.hasRisk ? '#ef4444' : '#10b981'}`, padding: '1rem', borderRadius: '8px', marginBottom: '1rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <div style={{ color: data.allergyAlert.hasRisk ? '#ef4444' : '#10b981' }}>
                {data.allergyAlert.hasRisk ? <AlertOctagon size={24} /> : <CheckCircle size={24} />}
              </div>
              <div>
                <div style={{ fontSize: '0.8rem', color: '#a1a1aa', textTransform: 'uppercase', marginBottom: '0.2rem' }}>Agent 4: Pharmacovigilance Review</div>
                <div style={{ color: data.allergyAlert.hasRisk ? '#fca5a5' : '#a7f3d0', fontWeight: data.allergyAlert.hasRisk ? 'bold' : 'normal', fontSize: '0.95rem' }}>
                  {data.allergyAlert.alertMessage}
                </div>
              </div>
            </div>
          )}

          <PharmacyPrescriptionWidget suggestedMeds={data.suggestedMedications} patientId={data.patientId} location={data.location} coords={data.coords} />
        </div>



        <div className="data-group original-transcript">
          <h4>Clinical Interaction Log ({data.language})</h4>
          {data.chatHistory && data.chatHistory.length > 0 ? (
             <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '8px' }}>
                {data.chatHistory.map((msg, idx) => (
                  <div key={idx} style={{ color: msg.role === 'user' ? '#93c5fd' : '#c4b5fd', fontSize: '0.9rem' }}>
                    <strong>{msg.role === 'user' ? 'Patient' : 'AI Doctor'}:</strong> {msg.content}
                  </div>
                ))}
             </div>
          ) : (
             <p>"{data.originalTranscript}"</p>
          )}
        </div>

        {/* Save & Download Actions */}
        <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <button 
            onClick={handleSaveReport}
            disabled={isSaving}
            style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.8rem', borderRadius: '8px', border: 'none', background: 'var(--primary)', color: '#000', fontWeight: 'bold', cursor: isSaving ? 'not-allowed' : 'pointer' }}
          >
            {isSaving ? <Activity size={18} className="spin" /> : <Save size={18} />}
            {isSaving ? 'Saving...' : 'Save Triage Record'}
          </button>
          <button 
            onClick={handleDownload}
            disabled={isDownloading}
            style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.8rem', borderRadius: '8px', border: '1px solid var(--primary)', background: 'transparent', color: 'var(--primary)', fontWeight: 'bold', cursor: isDownloading ? 'not-allowed' : 'pointer' }}
          >
            {isDownloading ? <Activity size={18} className="spin" /> : <Download size={18} />}
            {isDownloading ? 'Downloading...' : 'Download PDF'}
          </button>
        </div>
      </div>
    </div>
    </>
  );
};

export default TriageCard;
