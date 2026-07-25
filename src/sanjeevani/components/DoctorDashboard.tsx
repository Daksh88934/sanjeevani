import TriageCard from "./TriageCard";
import GuardianAlerts from "./GuardianAlerts";
import { Stethoscope } from "lucide-react";

interface TriageData {
  id: string;
  [key: string]: any;
}

interface Props {
  triageQueue: TriageData[];
}

const DoctorDashboard = ({ triageQueue }: Props) => {
  return (
    <div className="dashboard-section">
      <div className="section-header">
        <h2>Doctor Dashboard</h2>
        <p>Live Triage Queue</p>
      </div>

      <GuardianAlerts />

      <div className="dashboard-content">
        {triageQueue.length === 0 ? (
          <div className="empty-state">
            <Stethoscope size={64} />
            <h3>No patients in queue</h3>
            <p>Waiting for triage input from the kiosk...</p>
          </div>
        ) : (
          triageQueue.map((data) => <TriageCard key={data.id} data={data} />)
        )}
      </div>
    </div>
  );
};

export default DoctorDashboard;
