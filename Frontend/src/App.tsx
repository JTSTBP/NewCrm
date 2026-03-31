import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login/Login';
import AdminLayout from './components/layout/AdminLayout';
import AdminDashboard from './pages/Admin/AdminDashboard';
import Profile from './pages/Profile/Profile';
import Users from './pages/Admin/Users';
import Leads from './pages/Admin/Leads';
import Contacts from './pages/Admin/Contacts';
import ContactDetail from './pages/Admin/ContactDetail';
import AgentDashboard from './pages/AgentDashboard';
import TaskReminder from './components/TaskReminder';
import BDLayout from './components/layout/BDLayout';
import BDDashboard from './pages/BD/BDDashboard';
import BDReports from './pages/BD/BDReports';
import AddLeadTab from './pages/Admin/AddLeadTab';
import Attendance from './pages/Admin/Attendance';
import AdminReports from './pages/Admin/Reports';

import { Toaster } from 'react-hot-toast';

function App() {
  return (
    <>
      <Toaster position="top-right" />
      <Router>
        <TaskReminder />
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login type="agent" />} />
          <Route path="/admin-login" element={<Login type="admin" />} />

          {/* Agent Route */}
          <Route path="/dashboard" element={<AgentDashboard />} />

          {/* Admin Protected Routes */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="users" element={<Users />} />
            <Route path="leads" element={<Leads />} />
            <Route path="add-lead" element={<AddLeadTab />} />
            <Route path="contacts" element={<Contacts />} />
            <Route path="contacts/:id" element={<ContactDetail />} />
            <Route path="attendance" element={<Attendance />} />
            <Route path="reports" element={<AdminReports />} />
            <Route path="profile" element={<Profile />} />
            {/* Redirect /admin to /admin/dashboard */}
            <Route index element={<Navigate to="dashboard" replace />} />
          </Route>

          {/* BD Executive Protected Routes */}
          <Route path="/bd" element={<BDLayout />}>
            <Route path="dashboard" element={<BDDashboard />} />
            <Route path="leads" element={<Leads />} />
            <Route path="add-lead" element={<AddLeadTab />} />
            <Route path="contacts" element={<Contacts />} />
            <Route path="contacts/:id" element={<ContactDetail />} />
            <Route path="reports" element={<BDReports />} />
            <Route path="profile" element={<Profile />} />
            <Route index element={<Navigate to="dashboard" replace />} />
          </Route>
        </Routes>
      </Router>
    </>
  );
}

export default App;
