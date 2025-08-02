import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { getCurrentUser } from '../utils/auth';

const ProtectedRoute = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Check if user exists in cookies or localStorage
        const user = getCurrentUser();
        
        if (user) {
          // Verify token with backend
          const response = await fetch('http://localhost:8080/protected', {
            method: 'GET',
            credentials: 'include', // Important for cookies
            headers: {
              'Content-Type': 'application/json',
            },
          });

          if (response.ok) {
            setIsAuthenticated(true);
          } else {
            // Try to refresh token
            const refreshResponse = await fetch('http://localhost:8080/refreshAccessToken', {
              method: 'POST',
              credentials: 'include',
            });

            if (refreshResponse.ok) {
              setIsAuthenticated(true);
            } else {
              setIsAuthenticated(false);
            }
          }
        } else {
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error('Auth check error:', error);
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-lime-500"></div>
      </div>
    );
  }

  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

export default ProtectedRoute;