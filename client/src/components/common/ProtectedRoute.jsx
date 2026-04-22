import { Navigate } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import Loader from './Loader';

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) return <Loader />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  return children;
}
