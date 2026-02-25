import { useAuth } from '../../hooks/useAuth';
import DoctorDashboard from './DoctorDashboard';
import PatientDashboard from './PatientDashboard';
import AdminDashboard from './AdminDashboard';
import ResearcherDashboard from './ResearcherDashboard';

export default function DashboardPage() {
  const { user } = useAuth();

  switch (user?.role) {
    case 'patient':
      return <PatientDashboard />;
    case 'admin':
      return <AdminDashboard />;
    case 'researcher':
      return <ResearcherDashboard />;
    case 'doctor':
    default:
      return <DoctorDashboard />;
  }
}
