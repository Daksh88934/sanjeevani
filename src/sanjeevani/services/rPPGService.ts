/**
 * rPPGService — ports src/services/rPPGService.js (logic unchanged).
 * Remote Photoplethysmography + Blazeface face detection via TensorFlow.js.
 */

import type { RefObject } from "react";
import * as tf from "@tensorflow/tfjs";
import * as blazeface from "@tensorflow-models/blazeface";
// `@tensorflow/tfjs` is the umbrella package — it already imports and registers
// the webgl/cpu backends for side effects, so separate @tensorflow/tfjs-backend-*
// imports are not needed (and aren't directly resolvable under pnpm).

let faceModel: any = null;

export const startWebcam = async (videoRef: RefObject<HTMLVideoElement | null>) => {
  try {
    if (!faceModel) {
      console.log("Loading Blazeface model...");
      await tf.ready();
      faceModel = await blazeface.load();
      console.log("Blazeface model loaded!");
    }

    const stream = await navigator.mediaDevices.getUserMedia({
      video: { width: 640, height: 480, facingMode: "user" },
      audio: false,
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

export const stopWebcam = (stream: MediaStream | null) => {
  if (stream) {
    stream.getTracks().forEach((track) => track.stop());
  }
};

export const startScanning = (
  videoRef: RefObject<HTMLVideoElement | null>,
  canvasRef: RefObject<HTMLCanvasElement | null>,
  onSignalUpdate: (signal: number) => void,
  onBpmUpdate: (bpm: number) => void,
  onFaceBoxUpdate?: (box: any) => void,
) => {
  let isScanning = true;
  let frameCount = 0;

  let baseBpm = 75;
  let signalBuffer: number[] = [];
  let timeBuffer: number[] = [];
  let consecutiveNoFaceFrames = 0;

  const canvas = canvasRef.current;
  const ctx = canvas?.getContext("2d", { willReadFrequently: true });
  if (!canvas || !ctx) {
    return () => {
      isScanning = false;
    };
  }

  const loop = async () => {
    if (!isScanning) return;

    const video = videoRef.current;
    if (video && video.readyState === video.HAVE_ENOUGH_DATA) {
      const width = canvas.width;
      const height = canvas.height;

      ctx.drawImage(video, 0, 0, width, height);

      let faceDetected = false;
      let roiStartX = (width - 100) / 2;
      let roiStartY = (height - 100) / 2;
      let roiSize = 100;

      if (faceModel) {
        try {
          const predictions = await faceModel.estimateFaces(video, false);
          if (predictions.length > 0) {
            faceDetected = true;
            consecutiveNoFaceFrames = 0;
            const face = predictions[0];
            const topLeft = face.topLeft;
            const bottomRight = face.bottomRight;

            const faceWidth = bottomRight[0] - topLeft[0];
            const faceHeight = bottomRight[1] - topLeft[1];

            roiSize = faceWidth * 0.4;
            roiStartX = topLeft[0] + faceWidth * 0.3;
            roiStartY = topLeft[1] + faceHeight * 0.2;

            if (onFaceBoxUpdate) {
              onFaceBoxUpdate({
                x: (topLeft[0] / width) * 100,
                y: (topLeft[1] / height) * 100,
                w: (faceWidth / width) * 100,
                h: (faceHeight / height) * 100,
              });
            }
          } else {
            consecutiveNoFaceFrames++;
            if (consecutiveNoFaceFrames > 10) {
              if (onFaceBoxUpdate) onFaceBoxUpdate(null);
            }
          }
        } catch (e) {
          console.error("Face detection error:", e);
        }
      }

      if (!faceDetected) {
        onSignalUpdate(0);
        onBpmUpdate(0);
        signalBuffer = [];
        timeBuffer = [];
        requestAnimationFrame(loop);
        return;
      }

      roiStartX = Math.max(0, Math.min(roiStartX, width - roiSize));
      roiStartY = Math.max(0, Math.min(roiStartY, height - roiSize));

      const frameData = ctx.getImageData(roiStartX, roiStartY, roiSize, roiSize);
      const data = frameData.data;

      let greenSum = 0;
      let validPixels = 0;

      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        if (r > 40 && g > 30 && b > 20 && r > g && g > b) {
          greenSum += g;
          validPixels++;
        }
      }

      let avgG = 120;
      if (validPixels > 0) {
        avgG = greenSum / validPixels;
      }

      const currentTime = performance.now();
      signalBuffer.push(avgG);
      timeBuffer.push(currentTime);

      if (signalBuffer.length > 200) {
        signalBuffer.shift();
        timeBuffer.shift();
      }

      if (signalBuffer.length > 60) {
        const meanG = signalBuffer.reduce((a, b) => a + b, 0) / signalBuffer.length;
        const detrended = signalBuffer.map((val) => val - meanG);

        const smoothed: number[] = [];
        for (let i = 0; i < detrended.length; i++) {
          let sum = 0;
          let count = 0;
          for (let j = Math.max(0, i - 2); j <= Math.min(detrended.length - 1, i + 2); j++) {
            sum += detrended[j];
            count++;
          }
          smoothed.push(sum / count);
        }

        const peaks: number[] = [];
        const minVal = Math.min(...smoothed);
        const maxVal = Math.max(...smoothed);
        const dynamicThreshold = minVal + (maxVal - minVal) * 0.5;

        for (let i = 1; i < smoothed.length - 1; i++) {
          if (
            smoothed[i] > smoothed[i - 1] &&
            smoothed[i] > smoothed[i + 1] &&
            smoothed[i] > dynamicThreshold
          ) {
            if (peaks.length === 0 || timeBuffer[i] - peaks[peaks.length - 1] > 333) {
              peaks.push(timeBuffer[i]);
            }
          }
        }

        if (peaks.length >= 3) {
          const validIntervals: number[] = [];
          for (let i = 1; i < peaks.length; i++) {
            const interval = peaks[i] - peaks[i - 1];
            if (interval > 500 && interval < 1333) {
              validIntervals.push(interval);
            }
          }

          if (validIntervals.length > 0) {
            const avgInterval =
              validIntervals.reduce((a, b) => a + b, 0) / validIntervals.length;
            const calculatedBpm = 60000 / avgInterval;

            if (calculatedBpm > 50 && calculatedBpm < 120) {
              baseBpm = baseBpm * 0.9 + calculatedBpm * 0.1;
            }
          }
        }

        const realSignal = smoothed[smoothed.length - 1] * 2.5;
        onSignalUpdate(realSignal);

        frameCount++;
        if (frameCount % 30 === 0 || frameCount < 10) {
          onBpmUpdate(Math.round(baseBpm));
        }
      } else {
        onSignalUpdate(0);
      }
    }

    requestAnimationFrame(loop);
  };

  loop();

  return () => {
    isScanning = false;
  };
};
