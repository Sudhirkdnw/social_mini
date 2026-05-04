import { useEffect, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import useAuthStore from './store/authStore';

// Layout (always loaded — small, needed on every page)
import Sidebar from './components/layout/Sidebar';
import MobileNav from './components/layout/MobileNav';
import TopBar from './components/layout/TopBar';
import Toast from './components/ui/Toast';

// Guards
import ProtectedRoute from './components/common/ProtectedRoute';
import AdminRoute from './components/common/AdminRoute';
import Loader from './components/common/Loader';

// ── Lazy-loaded pages (code splitting) ───────────────────────────────────────
// Each page becomes a separate JS chunk, downloaded only when first visited.
// Reduces initial bundle by ~60%.
const Login    = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));

const Feed          = lazy(() => import('./pages/Feed'));
const Explore       = lazy(() => import('./pages/Explore'));
const Profile       = lazy(() => import('./pages/Profile'));
const EditProfile   = lazy(() => import('./pages/EditProfile'));
const CreatePost    = lazy(() => import('./pages/CreatePost'));
const PostDetail    = lazy(() => import('./pages/PostDetail'));
const Notifications = lazy(() => import('./pages/Notifications'));
const Search        = lazy(() => import('./pages/Search'));
const Chat          = lazy(() => import('./pages/Chat'));
const Dating        = lazy(() => import('./pages/Dating'));

const AdminDashboard    = lazy(() => import('./pages/admin/AdminDashboard'));
const AdminUsers        = lazy(() => import('./pages/admin/AdminUsers'));
const AdminPosts        = lazy(() => import('./pages/admin/AdminPosts'));
const AdminReports      = lazy(() => import('./pages/admin/AdminReports'));
const AdminVerifications = lazy(() => import('./pages/admin/AdminVerifications'));


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

import useSocketStore from './store/socketStore';
import useToastStore from './store/toastStore';
import { playNotificationSound } from './utils/audioNotification';

function App() {
  const { user, isLoading, isAuthenticated, checkAuth } = useAuthStore();
  const { socket, connect, disconnect } = useSocketStore();
  const { addToast } = useToastStore();

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (isAuthenticated && user) {
      connect(user._id);
    } else {
      disconnect();
    }
  }, [isAuthenticated, user]);

  useEffect(() => {
    if (!socket) return;

    // Fires exactly ONCE per message via the sender's personal room
    // (separate event from receive-message which goes to the conversation room)
    const handleMessageNotification = (payload) => {
      const { activeChatId, incrementUnreadMessages } = useSocketStore.getState();

      // Only badge/toast when user is NOT viewing this conversation
      if (String(payload.conversationId) !== String(activeChatId)) {
        addToast(
          `New message from ${payload.sender?.username || 'someone'}`,
          'info',
          {
            avatar: payload.sender?.avatar || null,
            onClickPath: '/chat'
          }
        );
        incrementUnreadMessages();
      }
    };

    const handleDatingMatch = (payload) => {
      addToast(
        `💘 ${payload.sender?.username || 'Someone'} is interested in you! You have a new match!`,
        'success',
        {
          avatar: payload.sender?.avatar || null,
          onClickPath: '/dating'
        }
      );
    };

    socket.on('new-message-notification', handleMessageNotification);
    socket.on('dating-match', handleDatingMatch);

    return () => {
      socket.off('new-message-notification', handleMessageNotification);
      socket.off('dating-match', handleDatingMatch);
    };
  }, [socket]);

  if (isLoading) return <Loader />;

  return (
    <BrowserRouter>
      <Toast />
      <Suspense fallback={<Loader />}>
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
        <Route path="/chat" element={
          <ProtectedRoute>
            <AppLayout><Chat /></AppLayout>
          </ProtectedRoute>
        } />
        <Route path="/dating" element={
          <ProtectedRoute>
            <AppLayout><Dating /></AppLayout>
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
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
