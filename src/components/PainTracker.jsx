import React, { useRef, useEffect, useState } from 'react';
import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-backend-webgl';
import '@tensorflow/tfjs-backend-cpu';
import * as faceLandmarksDetection from '@tensorflow-models/face-landmarks-detection';
import { Camera, Activity, AlertTriangle, CheckCircle, ShieldAlert, ScanFace, ActivitySquare, Mic, Volume2 } from 'lucide-react';

const PainTracker = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const audioCtxRef = useRef(null);
  const analyserRef = useRef(null);

  const [model, setModel] = useState(null);
  const [isTracking, setIsTracking] = useState(false);
  const [painIndex, setPainIndex] = useState(0);
  const [emotionState, setEmotionState] = useState('NEUTRAL');
  const [metrics, setMetrics] = useState({ furrow: 0, squint: 0, grimace: 0, vocal: 0 });
  const [status, setStatus] = useState('Initializing Edge AI...');

  useEffect(() => {
    const loadModel = async () => {
      try {
        await tf.ready();
        await tf.setBackend('webgl');
        const modelType = faceLandmarksDetection.SupportedModels.MediaPipeFaceMesh;
        const detectorConfig = {
          runtime: 'tfjs',
          maxFaces: 1
        };
        const loadedModel = await faceLandmarksDetection.createDetector(modelType, detectorConfig);
        setModel(loadedModel);
        setStatus('Neural Net Loaded. Ready to Track.');
      } catch (err) {
        console.error("Failed to load FaceMesh:", err);
        setStatus(`Load Error: ${err.message}`);
      }
    };
    loadModel();
  }, []);

  const startTracking = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: 640, height: 480 },
        audio: true 
      });

      const AudioContext = window.AudioContext || window.webkitAudioContext;
      audioCtxRef.current = new AudioContext();
      analyserRef.current = audioCtxRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      const source = audioCtxRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current.width = videoRef.current.videoWidth;
          videoRef.current.height = videoRef.current.videoHeight;
          videoRef.current.play();
          setIsTracking(true);
          setStatus('Active Multimodal Biometric Scanning');
          trackBiometrics();
        };
      }
    } catch (err) {
      console.error("Camera/Mic error:", err);
      setStatus('Camera or Microphone access denied.');
    }
  };

  const stopTracking = () => {
    if (isTracking) {
      setStatus('Tracking Stopped');
    }
    setIsTracking(false);
    
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    
    if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
      audioCtxRef.current.close();
    }

    setPainIndex(0);
    setEmotionState('NEUTRAL');
    setMetrics({ furrow: 0, squint: 0, grimace: 0, vocal: 0 });
  };

  const trackBiometrics = async () => {
    if (!videoRef.current || !canvasRef.current || !model || !isTracking) return;
    
    if (videoRef.current.videoWidth === 0) {
      requestAnimationFrame(trackBiometrics);
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    try {
      let vocalScore = 0;
      if (analyserRef.current) {
        const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.getByteFrequencyData(dataArray);
        
        let sum = 0;
        let highFreqSum = 0;
        for(let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
          if (i > dataArray.length * 0.6) highFreqSum += dataArray[i];
        }
        
        const avgVolume = sum / dataArray.length;
        const highFreqRatio = highFreqSum / (sum || 1); 
        
        if (avgVolume > 15) {
           vocalScore = Math.min(100, (avgVolume / 100) * (highFreqRatio + 0.5) * 100);
        }
      }

      const faces = await model.estimateFaces(video, { flipHorizontal: false });
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      let facialPainScore = 0;
      let furrowScore = 0;
      let eyeSquintScore = 0;
      let grimaceScore = 0;
      let currentEmotion = 'NEUTRAL';

      if (faces && faces.length > 0) {
        const face = faces[0];
        const keypoints = face.keypoints;

        ctx.fillStyle = '#00f0ff';
        for (let i = 0; i < keypoints.length; i += 3) {
          ctx.beginPath();
          ctx.arc(keypoints[i].x, keypoints[i].y, 1, 0, 2 * Math.PI);
          ctx.fill();
        }

        const box = face.box;
        ctx.strokeStyle = 'rgba(0, 240, 255, 0.5)';
        ctx.lineWidth = 2;
        ctx.strokeRect(box.xMin, box.yMin, box.width, box.height);

        const dist = (p1, p2) => Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
        const faceWidth = dist(keypoints[234], keypoints[454]);

        // A. MOUTH DYNAMICS
        const mouthWidth = dist(keypoints[61], keypoints[291]) / faceWidth;
        const mouthOpen = dist(keypoints[13], keypoints[14]) / faceWidth;
        
        const isMouthOpen = mouthOpen > 0.05;
        const isMouthOpenWide = mouthOpen > 0.15; // Screaming / wide yawn
        
        const leftEyeCornerDist = dist(keypoints[61], keypoints[159]) / faceWidth;
        const rightEyeCornerDist = dist(keypoints[291], keypoints[386]) / faceWidth;
        const avgEyeCornerDist = (leftEyeCornerDist + rightEyeCornerDist) / 2;

        // B. Corrugator Muscle (Eyebrow Furrowing & Lowering)
        const browDist = dist(keypoints[107], keypoints[336]) / faceWidth;
        const furrowPinch = Math.min(100, Math.max(0, (0.18 - browDist) / 0.05 * 100));
        
        const leftBrowLift = dist(keypoints[107], keypoints[159]) / faceWidth;
        const rightBrowLift = dist(keypoints[336], keypoints[386]) / faceWidth;
        const avgBrowLift = (leftBrowLift + rightBrowLift) / 2;
        const furrowDrop = Math.min(100, Math.max(0, (0.13 - avgBrowLift) / 0.04 * 100));
        
        furrowScore = Math.max(furrowPinch, furrowDrop);

        // SMILE DETECTION (Duchenne & Closed-mouth stretch)
        const duchenneSmile = avgEyeCornerDist < 0.37 && mouthWidth > 0.36;
        const faceStretchSmile = mouthWidth > 0.39 && furrowScore < 20; // Face stretched wide without frowning
        const isSmiling = (duchenneSmile || faceStretchSmile) && !isMouthOpenWide;

        // C. Orbicularis Oculi (Eye Squinting)
        const leftEyeOpen = dist(keypoints[159], keypoints[145]) / faceWidth;
        const rightEyeOpen = dist(keypoints[386], keypoints[374]) / faceWidth;
        eyeSquintScore = Math.min(100, Math.max(0, (0.07 - ((leftEyeOpen + rightEyeOpen) / 2)) / 0.03 * 100));

        if (isSmiling) {
          grimaceScore = 0;
          facialPainScore = 0; 
          // If mouth is visibly open during a smile, or audio picks up vocalization, it's Laughing
          currentEmotion = (mouthOpen > 0.08 || vocalScore > 20) ? 'LAUGHING' : 'HAPPY SMILE';
        } else {
          // Grimace is either horizontal stretch OR extreme vertical stretch (screaming)
          const horizontalGrimace = Math.min(100, Math.max(0, (mouthWidth - 0.38) / 0.10 * 100));
          const verticalGrimace = isMouthOpenWide ? Math.min(100, Math.max(0, (mouthOpen - 0.10) / 0.15 * 100)) : 0;
          grimaceScore = Math.max(horizontalGrimace, verticalGrimace);
          
          facialPainScore = (furrowScore * 0.45) + (eyeSquintScore * 0.3) + (grimaceScore * 0.25);

          if (facialPainScore > 70 || vocalScore > 70 || (isMouthOpenWide && facialPainScore > 40)) {
            currentEmotion = (vocalScore > 40 || isMouthOpenWide) ? 'SCREAMING / CRYING' : 'CRITICAL PAIN / AGONY';
          } else if (facialPainScore > 35 || vocalScore > 30) {
            currentEmotion = 'IN PAIN / DISTRESSED';
          } else if (facialPainScore > 10) {
            currentEmotion = 'SAD / UNCOMFORTABLE';
          } else {
            currentEmotion = 'NEUTRAL';
          }
        }

        ctx.fillStyle = '#fff';
        ctx.font = '14px monospace';
        ctx.fillText(`BIOMETRICS LOCKED`, box.xMin, box.yMin - 20);
        ctx.fillStyle = isSmiling ? '#22c55e' : (facialPainScore > 70 ? '#ff4d4d' : '#eab308');
        ctx.fillText(`EMOTION: ${currentEmotion}`, box.xMin, box.yMin - 5);
        
        // DEBUG HUD: Render exact algorithmic variables to canvas so they are visible in screenshots
        ctx.fillStyle = 'rgba(0, 240, 255, 0.7)';
        ctx.font = '10px monospace';
        ctx.fillText(`M.W:${mouthWidth.toFixed(3)} M.O:${mouthOpen.toFixed(3)} EyeCorner:${avgEyeCornerDist.toFixed(3)}`, 10, canvas.height - 25);
        ctx.fillText(`BrowDist:${browDist.toFixed(3)} BrowLift:${avgBrowLift.toFixed(3)}`, 10, canvas.height - 10);

      } else {
        ctx.fillStyle = '#eab308';
        ctx.font = '16px monospace';
        ctx.fillText(`SCANNING FOR FACIAL TARGET...`, 30, 40);
      }

      let combinedScore = 0;
      if (currentEmotion === 'HAPPY' || currentEmotion === 'LAUGHING' || currentEmotion === 'NEUTRAL') {
        combinedScore = 0;
      } else {
        // Use Math.max so either massive facial pain OR massive screaming can trigger 100% Critical Pain independently.
        combinedScore = Math.max(facialPainScore, vocalScore);
        
        // If both are high, give a synergy boost
        if (facialPainScore > 40 && vocalScore > 40) {
          combinedScore = Math.min(100, combinedScore + 15);
        }
      }

      setMetrics({
        furrow: Math.round(furrowScore) || 0,
        squint: Math.round(eyeSquintScore) || 0,
        grimace: Math.round(grimaceScore) || 0,
        vocal: Math.round(vocalScore) || 0
      });
      setEmotionState(currentEmotion);

      setPainIndex(prev => {
        const newScore = Math.min(100, Math.max(0, Math.round(combinedScore) || 0));
        return Math.round(prev + (newScore - prev) * 0.2); 
      });

    } catch (err) {
      console.error(err);
      setStatus(`AI Error: ${err.message}`);
      setIsTracking(false); 
    }

    if (isTracking) {
      requestAnimationFrame(trackBiometrics);
    }
  };

  useEffect(() => {
    if (isTracking) {
      trackBiometrics();
    }
  }, [isTracking]);

  useEffect(() => {
    return () => {
      stopTracking();
    };
  }, []);

  const getAlertLevel = () => {
    if (emotionState === 'HAPPY' || emotionState === 'LAUGHING') return { color: '#22c55e', icon: <CheckCircle size={24} />, text: 'PATIENT HAPPY / RELAXED' };
    if (painIndex > 70) return { color: '#ff4d4d', icon: <ShieldAlert size={24} />, text: 'CRITICAL PAIN / DISTRESS DETECTED' };
    if (painIndex > 30) return { color: '#eab308', icon: <AlertTriangle size={24} />, text: 'MODERATE DISCOMFORT / SADNESS' };
    return { color: '#22c55e', icon: <CheckCircle size={24} />, text: 'PATIENT STABLE / NEUTRAL' };
  };

  const alertStatus = getAlertLevel();

  return (
    <div className="module-container" style={{ display: 'flex', gap: '2rem', height: '85vh' }}>
      
      <div className="glass-panel" style={{ flex: '0 0 60%', display: 'flex', flexDirection: 'column', padding: '1rem' }}>
        <div className="section-header" style={{ margin: '0 0 1rem 0', display: 'flex', justifyContent: 'space-between' }}>
          <h2 style={{ fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Camera size={20} /> Multimodal Edge AI Stream</h2>
          <div style={{ display: 'flex', gap: '1rem', color: 'var(--primary)' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.9rem' }}><Camera size={16} /> Vision Active</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.9rem' }}><Mic size={16} /> Audio Active</span>
          </div>
        </div>

        <div style={{ flex: 1, position: 'relative', background: '#050505', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--glass-border)', boxShadow: 'inset 0 0 50px rgba(0,0,0,0.8)' }}>
          <video 
            ref={videoRef} 
            width="640"
            height="480"
            style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)', filter: 'contrast(1.1) brightness(1.1)' }} 
            playsInline 
            muted 
          />
          <canvas 
            ref={canvasRef} 
            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)', pointerEvents: 'none' }} 
          />
          
          {!isTracking && (
            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center', color: 'var(--text-muted)', background: 'rgba(0,0,0,0.6)', padding: '2rem', borderRadius: '16px', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <ScanFace size={56} style={{ opacity: 0.8, marginBottom: '1rem', color: 'var(--primary)' }} />
              <p style={{ letterSpacing: '1px', marginBottom: '1.5rem' }}>{status}</p>
              <button 
                onClick={startTracking} 
                disabled={!model}
                style={{ padding: '1rem 2rem', background: 'var(--primary)', border: 'none', borderRadius: '8px', color: '#000', fontWeight: 'bold', fontSize: '1.1rem', cursor: model ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '0 auto', boxShadow: '0 0 20px rgba(0, 240, 255, 0.4)' }}
              >
                <Camera size={20} /> ACTIVATE MULTIMODAL AI
              </button>
            </div>
          )}

          {isTracking && (
            <>
              <div style={{ position: 'absolute', top: '15px', left: '15px', color: '#ff4d4d', fontFamily: 'monospace', animation: 'pulse 1.5s infinite', display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(0,0,0,0.5)', padding: '0.5rem 1rem', borderRadius: '20px' }}>
                <div style={{ width: '8px', height: '8px', background: '#ff4d4d', borderRadius: '50%' }}></div> LIVE ANALYSIS
              </div>
              <div style={{ position: 'absolute', bottom: '15px', right: '15px', color: '#00f0ff', fontFamily: 'monospace', background: 'rgba(0,0,0,0.5)', padding: '0.5rem 1rem', borderRadius: '20px', border: '1px solid rgba(0,240,255,0.3)' }}>
                TENSORFLOW + WEB AUDIO API
              </div>
            </>
          )}
        </div>
      </div>

      <div className="glass-panel custom-scrollbar" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
        <div className="section-header" style={{ position: 'sticky', top: 0, background: 'rgba(0,0,0,0.8)', paddingBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.05)', zIndex: 10 }}>
          <h2>Clinical Emotion & Pain Tracker</h2>
          <p>Audio-Visual Multimodal Analysis</p>
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1.5rem', marginTop: '1rem' }}>
          
          <div style={{ background: 'rgba(0,0,0,0.3)', padding: '1.5rem', borderRadius: '12px', border: `1px solid ${alertStatus.color}`, transition: 'all 0.3s ease', boxShadow: `0 0 20px ${alertStatus.color}20` }}>
            <h3 style={{ color: alertStatus.color, margin: '0 0 1.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.3rem' }}>
              {alertStatus.icon} {alertStatus.text}
            </h3>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', color: '#fff', fontFamily: 'monospace', fontSize: '1.1rem' }}>
              <span>AGGREGATE PAIN INDEX</span>
              <span style={{ color: alertStatus.color, fontWeight: 'bold' }}>{painIndex}%</span>
            </div>
            
            <div style={{ width: '100%', height: '12px', background: 'rgba(255,255,255,0.1)', borderRadius: '6px', overflow: 'hidden' }}>
              <div style={{ width: `${painIndex}%`, height: '100%', background: alertStatus.color, transition: 'width 0.2s ease-out' }} />
            </div>
            
            <div style={{ marginTop: '1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem', letterSpacing: '1px' }}>
              CURRENT STATE: <span style={{ color: '#fff', fontWeight: 'bold' }}>{emotionState}</span>
            </div>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1.5rem', borderRadius: '12px', flex: 1, display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <h4 style={{ color: 'var(--primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}><ActivitySquare size={18} /> Biometric Telemetry</h4>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  <span>Corrugator Muscle (Eyebrow Furrow)</span>
                  <span>{metrics.furrow}%</span>
                </div>
                <div style={{ width: '100%', height: '6px', background: 'rgba(0,0,0,0.5)', borderRadius: '3px' }}>
                  <div style={{ width: `${metrics.furrow}%`, height: '100%', background: '#a855f7', borderRadius: '3px', transition: 'width 0.2s' }} />
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  <span>Orbicularis Oculi (Eye Squint)</span>
                  <span>{metrics.squint}%</span>
                </div>
                <div style={{ width: '100%', height: '6px', background: 'rgba(0,0,0,0.5)', borderRadius: '3px' }}>
                  <div style={{ width: `${metrics.squint}%`, height: '100%', background: '#3b82f6', borderRadius: '3px', transition: 'width 0.2s' }} />
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  <span>Zygomaticus (Mouth Grimace)</span>
                  <span>{metrics.grimace}%</span>
                </div>
                <div style={{ width: '100%', height: '6px', background: 'rgba(0,0,0,0.5)', borderRadius: '3px' }}>
                  <div style={{ width: `${metrics.grimace}%`, height: '100%', background: '#f97316', borderRadius: '3px', transition: 'width 0.2s' }} />
                </div>
              </div>

              <div style={{ marginTop: '0.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem', fontSize: '0.85rem', color: '#00f0ff' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}><Volume2 size={14}/> Vocal Distress (Audio)</span>
                  <span>{metrics.vocal}%</span>
                </div>
                <div style={{ width: '100%', height: '6px', background: 'rgba(0,0,0,0.5)', borderRadius: '3px' }}>
                  <div style={{ width: `${metrics.vocal}%`, height: '100%', background: '#00f0ff', borderRadius: '3px', transition: 'width 0.1s' }} />
                </div>
              </div>

            </div>

            <ul style={{ listStyle: 'none', padding: '1rem', margin: 'auto 0 0 0', display: 'flex', flexDirection: 'column', gap: '0.8rem', color: 'var(--text-muted)', fontFamily: 'monospace', fontSize: '0.9rem', background: '#000', borderRadius: '8px', borderLeft: '3px solid var(--primary)' }}>
              <li style={{ display: 'flex', justifyContent: 'space-between' }}><span>VISION AI</span> <span style={{ color: '#00f0ff' }}>FaceMesh (468 pts)</span></li>
              <li style={{ display: 'flex', justifyContent: 'space-between' }}><span>AUDIO AI</span> <span style={{ color: '#00f0ff' }}>Web Audio FFT</span></li>
              <li style={{ display: 'flex', justifyContent: 'space-between' }}><span>SENSOR FUSION</span> <span style={{ color: '#00f0ff' }}>Multimodal</span></li>
            </ul>
          </div>

          {isTracking && (
            <button 
              onClick={stopTracking} 
              style={{ padding: '1.2rem', background: 'rgba(255, 77, 77, 0.1)', border: '1px solid #ff4d4d', borderRadius: '8px', color: '#ff4d4d', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', letterSpacing: '1px' }}
            >
              <ShieldAlert size={20} /> DEACTIVATE TRACKING
            </button>
          )}

        </div>
      </div>
      
    </div>
  );
};

export default PainTracker;
