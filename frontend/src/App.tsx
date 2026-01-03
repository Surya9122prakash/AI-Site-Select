import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import LoginPage from './components/modules/Auth/LoginPage';
import ProtectedRoute from './components/layout/ProtectedRoute';
import DashboardLayout from './components/layout/DashboardLayout';
import SiteSelectionPage from './pages/SiteSelectionPage';
import HistoryView from './components/modules/SiteSelection/HistoryView';
import HistoryDetailsView from './components/modules/SiteSelection/HistoryDetailsView';
import ProfileView from './components/modules/Auth/ProfileView';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          <Route path="/dashboard" element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }>
            <Route path="site-selection" element={<SiteSelectionPage />} />
            <Route path="history" element={<HistoryView />} />
            <Route path="history/:id" element={<HistoryDetailsView />} />
            <Route path="profile" element={<ProfileView />} />
          </Route>

          <Route path="/" element={<Navigate to="/dashboard/site-selection" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
