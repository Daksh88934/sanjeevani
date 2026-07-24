import mongoose from 'mongoose';
import Report from './models/Report.js';

// Reusable database connection logic for serverless environments
let cachedDb = null;

async function connectToDatabase() {
  if (cachedDb) {
    return cachedDb;
  }
  const MONGODB_URI = process.env.MONGODB_URI;
  if (!MONGODB_URI) {
    throw new Error('Please define the MONGODB_URI environment variable');
  }

  const db = await mongoose.connect(MONGODB_URI);
  cachedDb = db;
  return db;
}

export default async function handler(req, res) {
  // CORS Headers for Vercel
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // Handle preflight request
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    await connectToDatabase();

    if (req.method === 'POST') {
      const { patientId, type, data } = req.body;
      
      if (!patientId || !type || !data) {
        return res.status(400).json({ error: 'Patient ID, report type, and data are required' });
      }

      const newReport = new Report({ patientId, type, data });
      const savedReport = await newReport.save();
      
      return res.status(201).json(savedReport);
    } 
    
    if (req.method === 'GET') {
      const reports = await Report.find().sort({ createdAt: -1 });
      return res.status(200).json(reports);
    }

    // Method not allowed
    return res.status(405).json({ error: 'Method Not Allowed' });
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};
