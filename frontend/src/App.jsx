import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import PatientApp from './pages/PatientApp';
import DoctorDashboard from './pages/DoctorDashboard';
import AdminDashboard from './pages/AdminDashboard';

// A simple PrivateRoute component to check role
const PrivateRoute = ({ children, allowedRole }) => {
  const currentRole = localStorage.getItem('userRole');
  if (!currentRole) {
    return <Navigate to="/login" replace />;
  }
  if (allowedRole && currentRole !== allowedRole) {
    // Redirect to login if role doesn't match
    return <Navigate to="/login" replace />;
  }
  return children;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        
        <Route 
          path="/app/nurse" 
          element={
            <PrivateRoute allowedRole="nurse">
              <Dashboard />
            </PrivateRoute>
          } 
        />
        
        <Route 
          path="/app/patient" 
          element={
            <PrivateRoute allowedRole="patient">
              <PatientApp />
            </PrivateRoute>
          } 
        />
        
        <Route 
          path="/app/doctor" 
          element={
            <PrivateRoute allowedRole="doctor">
              <DoctorDashboard />
            </PrivateRoute>
          } 
        />

        <Route 
          path="/app/admin" 
          element={
            <PrivateRoute allowedRole="admin">
              <AdminDashboard />
            </PrivateRoute>
          } 
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
