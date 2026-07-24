import React from 'react';
import TriageCard from './TriageCard';
import { Stethoscope } from 'lucide-react';

const DoctorDashboard = ({ triageQueue }) => {
  return (
    <div className="dashboard-section">
      <div className="section-header">
        <h2>Doctor Dashboard</h2>
        <p>Live Triage Queue</p>
      </div>

      <div className="dashboard-content">
        {triageQueue.length === 0 ? (
          <div className="empty-state">
            <Stethoscope size={64} />
            <h3>No patients in queue</h3>
            <p>Waiting for triage input from the kiosk...</p>
          </div>
        ) : (
          triageQueue.map((data) => (
            <TriageCard key={data.id} data={data} />
          ))
        )}
      </div>
    </div>
  );
};

export default DoctorDashboard;
