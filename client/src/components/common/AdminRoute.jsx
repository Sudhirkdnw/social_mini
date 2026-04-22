import { Navigate } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import Loader from './Loader';

export default function AdminRoute({ children }) {
  const { user, isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) return <Loader />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user?.role !== 'admin') return <Navigate to="/" replace />;

  return children;
}
