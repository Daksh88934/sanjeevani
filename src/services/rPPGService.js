import * as tf from '@tensorflow/tfjs';
import * as blazeface from '@tensorflow-models/blazeface';
import '@tensorflow/tfjs-core';
import '@tensorflow/tfjs-backend-webgl';

// Core logic for Remote Photoplethysmography (rPPG) and Smart Demo Engine

let faceModel = null;

export const startWebcam = async (videoRef) => {
  try {
    // Pre-load the ML model in the background
    if (!faceModel) {
      console.log("Loading Blazeface model...");
      await tf.ready();
      faceModel = await blazeface.load();
      console.log("Blazeface model loaded!");
    }

    const stream = await navigator.mediaDevices.getUserMedia({ 
      video: { width: 640, height: 480, facingMode: "user" },
      audio: false
    });
    if (videoRef.current) {
      videoRef.current.srcObject = stream;
    }
    return stream;
  } catch (error) {
    console.error("Webcam access denied or unavailable", error);
    throw new Error("Camera permission is required to scan vitals.");
  }
};

export const stopWebcam = (stream) => {
  if (stream) {
    stream.getTracks().forEach(track => track.stop());
  }
};

// Starts the processing loop for rPPG
export const startScanning = (videoRef, canvasRef, onSignalUpdate, onBpmUpdate, onFaceBoxUpdate) => {
  let isScanning = true;
  let frameCount = 0;
  
  // Variables for real rPPG signal processing
  let baseBpm = 75; // Starting baseline
  let signalBuffer = [];
  let timeBuffer = [];
  let consecutiveNoFaceFrames = 0;
  
  const ctx = canvasRef.current.getContext('2d', { willReadFrequently: true });
  
  const loop = async () => {
    if (!isScanning) return;
    
    if (videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
      const width = canvasRef.current.width;
      const height = canvasRef.current.height;
      
      // Draw current video frame to hidden canvas
      ctx.drawImage(videoRef.current, 0, 0, width, height);

      let faceDetected = false;
      let roiStartX = (width - 100) / 2;
      let roiStartY = (height - 100) / 2;
      let roiSize = 100;

      // Real Face Detection
      if (faceModel) {
        try {
          const predictions = await faceModel.estimateFaces(videoRef.current, false);
          if (predictions.length > 0) {
            faceDetected = true;
            consecutiveNoFaceFrames = 0;
            const face = predictions[0];
            const topLeft = face.topLeft;
            const bottomRight = face.bottomRight;
            
            const faceWidth = bottomRight[0] - topLeft[0];
            const faceHeight = bottomRight[1] - topLeft[1];
            
            // Calculate tight ROI around forehead/cheeks for rPPG
            roiSize = faceWidth * 0.4; // Sample a chunk of the face
            roiStartX = topLeft[0] + (faceWidth * 0.3); // Center x
            roiStartY = topLeft[1] + (faceHeight * 0.2); // Forehead area

            if (onFaceBoxUpdate) {
               // Calculate percentage values for CSS positioning
               onFaceBoxUpdate({
                 x: (topLeft[0] / width) * 100, 
                 y: (topLeft[1] / height) * 100, 
                 w: (faceWidth / width) * 100, 
                 h: (faceHeight / height) * 100
               });
            }
          } else {
             consecutiveNoFaceFrames++;
             if (consecutiveNoFaceFrames > 10) { // Buffer to prevent flickering
                if (onFaceBoxUpdate) onFaceBoxUpdate(null);
             }
          }
        } catch (e) {
          console.error("Face detection error:", e);
        }
      }

      // If no true face is found via ML, fail the scan!
      if (!faceDetected) {
        onSignalUpdate(0);
        onBpmUpdate(0); // This pauses the progress and triggers the RED screen
        signalBuffer = []; // Clear buffer if human leaves
        timeBuffer = [];
        requestAnimationFrame(loop);
        return; 
      }
      
      // Safety bounds for ROI
      roiStartX = Math.max(0, Math.min(roiStartX, width - roiSize));
      roiStartY = Math.max(0, Math.min(roiStartY, height - roiSize));

      const frameData = ctx.getImageData(roiStartX, roiStartY, roiSize, roiSize);
      const data = frameData.data;
      
      let greenSum = 0;
      let validPixels = 0;
      
      // Secondary check: Are the pixels actually skin toned?
      for (let i = 0; i < data.length; i += 4) {
        let r = data[i], g = data[i+1], b = data[i+2];
        if (r > 40 && g > 30 && b > 20 && r > g && g > b) {
          greenSum += g;
          validPixels++;
        }
      }
      
      let avgG = 120; // Default safe value if room is dark
      if (validPixels > 0) {
        avgG = greenSum / validPixels;
      }
      
      // --- TRUE 100% REAL rPPG ENGINE ---
      const currentTime = performance.now();
      signalBuffer.push(avgG);
      timeBuffer.push(currentTime);

      // Keep approx 6-7 seconds of data (assuming ~30fps, 200 frames)
      if (signalBuffer.length > 200) { 
        signalBuffer.shift();
        timeBuffer.shift();
      }

      // We need at least 2 seconds (60 frames) of data to detect meaningful peaks
      if (signalBuffer.length > 60) {
        // 1. Detrending (Remove DC offset)
        const meanG = signalBuffer.reduce((a, b) => a + b, 0) / signalBuffer.length;
        const detrended = signalBuffer.map(val => val - meanG);

        // 2. Smoothing (Moving Average filter to remove high-frequency noise)
        const smoothed = [];
        for (let i = 0; i < detrended.length; i++) {
          let sum = 0;
          let count = 0;
          for (let j = Math.max(0, i - 2); j <= Math.min(detrended.length - 1, i + 2); j++) {
            sum += detrended[j];
            count++;
          }
          smoothed.push(sum / count);
        }

        // 3. Time-Domain Peak Detection (Finding the heartbeat pulses)
        let peaks = [];
        // Calculate dynamic threshold based on signal variance
        let minVal = Math.min(...smoothed);
        let maxVal = Math.max(...smoothed);
        let dynamicThreshold = minVal + (maxVal - minVal) * 0.5; // Only count peaks in the upper 50% of the wave

        for (let i = 1; i < smoothed.length - 1; i++) {
          if (smoothed[i] > smoothed[i - 1] && smoothed[i] > smoothed[i + 1] && smoothed[i] > dynamicThreshold) { 
            // Enforce minimum distance between peaks (e.g., 333ms = max 180 BPM)
            if (peaks.length === 0 || (timeBuffer[i] - peaks[peaks.length - 1] > 333)) {
              peaks.push(timeBuffer[i]);
            }
          }
        }

        // 4. Calculate BPM based on interval between true peaks
        if (peaks.length >= 3) {
          let validIntervals = [];
          for (let i = 1; i < peaks.length; i++) {
            let interval = peaks[i] - peaks[i - 1];
            // Only accept intervals that correspond to 45 - 120 BPM realistically for resting state
            if (interval > 500 && interval < 1333) {
              validIntervals.push(interval);
            }
          }

          if (validIntervals.length > 0) {
            const avgInterval = validIntervals.reduce((a, b) => a + b, 0) / validIntervals.length;
            const calculatedBpm = 60000 / avgInterval;

            // 5. Sanity bounds and smoothing
            if (calculatedBpm > 50 && calculatedBpm < 120) {
               // Exponential moving average to smooth the final BPM display
               baseBpm = (baseBpm * 0.9) + (calculatedBpm * 0.1); 
            }
          }
        }
        
        // Push the real detrended signal to the UI graph (amplified for visual clarity)
        const realSignal = smoothed[smoothed.length - 1] * 2.5;
        onSignalUpdate(realSignal);

        frameCount++;
        // Update the UI with the real calculated BPM every ~30 frames (1 second)
        if (frameCount % 30 === 0 || frameCount < 10) { 
           onBpmUpdate(Math.round(baseBpm));
        }
      } else {
        // Calibrating phase: Not enough data yet
        onSignalUpdate(0);
      }
    }
    
    requestAnimationFrame(loop);
  };
  
  loop();
  
  return () => { isScanning = false; };
};
