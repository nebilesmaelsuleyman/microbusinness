import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Home from './pages/Home';
import ProviderProfile from './pages/ProviderProfile';
import MyJobs from './pages/MyJobs';
import ProviderDashboard from './pages/ProviderDashboard';
import Favorites from './pages/Favorites';
import Messages from './pages/Messages';
import Notifications from './pages/Notifications';
import EditProfile from './pages/EditProfile';
import Subscriptions from './pages/Subscriptions';
import Payments from './pages/Payments';
import Admin from './pages/Admin';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { token } = useAuth();
  if (!token) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function RoleRoute({ role, children }: { role: string; children: React.ReactNode }) {
  const { token, user } = useAuth();
  if (!token) return <Navigate to="/login" replace />;
  if (user?.role !== role) return <Navigate to="/" replace />;
  return <>{children}</>;
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="provider/:userId" element={<ProviderProfile />} />
        <Route
          path="my-jobs"
          element={
            <PrivateRoute>
              <MyJobs />
            </PrivateRoute>
          }
        />
        <Route
          path="dashboard"
          element={
            <PrivateRoute>
              <ProviderDashboard />
            </PrivateRoute>
          }
        />
        <Route
          path="favorites"
          element={
            <RoleRoute role="customer">
              <Favorites />
            </RoleRoute>
          }
        />
        <Route
          path="messages"
          element={
            <PrivateRoute>
              <Messages />
            </PrivateRoute>
          }
        />
        <Route
          path="notifications"
          element={
            <PrivateRoute>
              <Notifications />
            </PrivateRoute>
          }
        />
        <Route
          path="edit-profile"
          element={
            <RoleRoute role="provider">
              <EditProfile />
            </RoleRoute>
          }
        />
        <Route
          path="subscriptions"
          element={
            <RoleRoute role="provider">
              <Subscriptions />
            </RoleRoute>
          }
        />
        <Route
          path="payments"
          element={
            <PrivateRoute>
              <Payments />
            </PrivateRoute>
          }
        />
        <Route
          path="admin"
          element={
            <RoleRoute role="admin">
              <Admin />
            </RoleRoute>
          }
        />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
