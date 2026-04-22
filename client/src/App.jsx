import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import useAuthStore from './store/authStore';

// Layout
import Sidebar from './components/layout/Sidebar';
import MobileNav from './components/layout/MobileNav';
import TopBar from './components/layout/TopBar';
import Toast from './components/ui/Toast';

// Guards
import ProtectedRoute from './components/common/ProtectedRoute';
import AdminRoute from './components/common/AdminRoute';
import Loader from './components/common/Loader';

// Public Pages
import Login from './pages/Login';
import Register from './pages/Register';

// Protected Pages
import Feed from './pages/Feed';
import Explore from './pages/Explore';
import Profile from './pages/Profile';
import EditProfile from './pages/EditProfile';
import CreatePost from './pages/CreatePost';
import PostDetail from './pages/PostDetail';
import Notifications from './pages/Notifications';
import Search from './pages/Search';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsers from './pages/admin/AdminUsers';
import AdminPosts from './pages/admin/AdminPosts';
import AdminReports from './pages/admin/AdminReports';
import AdminVerifications from './pages/admin/AdminVerifications';

function AppLayout({ children }) {
  return (
    <div className="app-layout">
      <Sidebar />
      <TopBar />
      <main className="main-content">
        {children}
      </main>
      <MobileNav />
    </div>
  );
}

function App() {
  const { isLoading, isAuthenticated, checkAuth } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, []);

  if (isLoading) return <Loader />;

  return (
    <BrowserRouter>
      <Toast />
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={isAuthenticated ? <Navigate to="/" /> : <Login />} />
        <Route path="/register" element={isAuthenticated ? <Navigate to="/" /> : <Register />} />

        {/* Protected routes */}
        <Route path="/" element={
          <ProtectedRoute>
            <AppLayout><Feed /></AppLayout>
          </ProtectedRoute>
        } />
        <Route path="/explore" element={
          <ProtectedRoute>
            <AppLayout><Explore /></AppLayout>
          </ProtectedRoute>
        } />
        <Route path="/profile/:id" element={
          <ProtectedRoute>
            <AppLayout><Profile /></AppLayout>
          </ProtectedRoute>
        } />
        <Route path="/profile/edit" element={
          <ProtectedRoute>
            <AppLayout><EditProfile /></AppLayout>
          </ProtectedRoute>
        } />
        <Route path="/create" element={
          <ProtectedRoute>
            <AppLayout><CreatePost /></AppLayout>
          </ProtectedRoute>
        } />
        <Route path="/post/:id" element={
          <ProtectedRoute>
            <AppLayout><PostDetail /></AppLayout>
          </ProtectedRoute>
        } />
        <Route path="/notifications" element={
          <ProtectedRoute>
            <AppLayout><Notifications /></AppLayout>
          </ProtectedRoute>
        } />
        <Route path="/search" element={
          <ProtectedRoute>
            <AppLayout><Search /></AppLayout>
          </ProtectedRoute>
        } />

        {/* Admin routes */}
        <Route path="/admin" element={
          <AdminRoute>
            <AppLayout><AdminDashboard /></AppLayout>
          </AdminRoute>
        } />
        <Route path="/admin/users" element={
          <AdminRoute>
            <AppLayout><AdminUsers /></AppLayout>
          </AdminRoute>
        } />
        <Route path="/admin/posts" element={
          <AdminRoute>
            <AppLayout><AdminPosts /></AppLayout>
          </AdminRoute>
        } />
        <Route path="/admin/reports" element={
          <AdminRoute>
            <AppLayout><AdminReports /></AppLayout>
          </AdminRoute>
        } />
        <Route path="/admin/verifications" element={
          <AdminRoute>
            <AppLayout><AdminVerifications /></AppLayout>
          </AdminRoute>
        } />

        {/* Catch all */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
