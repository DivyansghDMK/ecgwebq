// import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
// import { doctorLogin } from '../api/ecgApi';

// interface LoginResponse {
//   success: boolean;
//   data: {
//     user: {
//       userId: string;
//       role: string;
//       name: string;
//     };
//     token: string;
//     expiresIn: string;
//   };
// }

// interface User {
//   userId: string;
//   role: string;
//   name: string;
// }

// interface AuthContextType {
//   user: User | null;
//   token: string | null;
//   login: (username: string, password: string, role?: string) => Promise<boolean>;
//   logout: () => void;
//   isAuthenticated: boolean;
//   isLoading: boolean;
// }

// const AuthContext = createContext<AuthContextType | undefined>(undefined);

// export function useAuth() {
//   const context = useContext(AuthContext);
//   if (context === undefined) {
//     throw new Error('useAuth must be used within an AuthProvider');
//   }
//   return context;
// }

// export function AuthProvider({ children }: { children: ReactNode }) {
//   const [user, setUser] = useState<User | null>(null);
//   const [token, setToken] = useState<string | null>(null);
//   const [isLoading, setIsLoading] = useState(false);

//   // Check for existing token on mount
//   useEffect(() => {
//     const storedToken = localStorage.getItem('token');
//     const storedUser = localStorage.getItem('user');
    
//     if (storedToken && storedUser) {
//       try {
//         const parsedUser = JSON.parse(storedUser);
//         setToken(storedToken);
//         setUser(parsedUser);
//       } catch (error) {
//         console.error('Error parsing stored user:', error);
//         // Clear invalid data
//         localStorage.removeItem('token');
//         localStorage.removeItem('user');
//       }
//     }
//   }, []);

//   const login = async (username: string, password: string, role: string = 'doctor'): Promise<boolean> => {
//     setIsLoading(true);
    
//     try {
//       const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/login`, {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//         },
//         body: JSON.stringify({ username, password, role }),
//         credentials: 'include' // Important for cookies
//       });
      
//       const responseData = await response.json();
      
//       if (response.ok && responseData.success && responseData.data) {
//         const newToken = responseData.data.token;
//         const newUser: User = {
//           userId: responseData.data.user.userId,
//           role: responseData.data.user.role,
//           name: responseData.data.user.name
//         };
        
//         setToken(newToken);
//         setUser(newUser);
        
//         // Store securely
//         localStorage.setItem('token', newToken);
//         localStorage.setItem('user', JSON.stringify(newUser));
        
//         return true;
//       } else {
//         return false;
//       }
//     } catch (error) {
//       console.error('Login error:', error);
//       return false;
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const logout = () => {
//     setToken(null);
//     setUser(null);
    
//     // Clear all auth data
//     localStorage.removeItem('token');
//     localStorage.removeItem('user');
//     localStorage.removeItem('role');
//   };

//   const isAuthenticated = !!token && !!user;

//   const value: AuthContextType = {
//     user,
//     token,
//     login,
//     logout,
//     isAuthenticated,
//     isLoading
//   };

//   return (
//     <AuthContext.Provider value={value}>
//       {children}
//     </AuthContext.Provider>
//   );
// }

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  AuthRole,
  StoredUser,
  clearAllAuthSessions,
  getStoredToken,
  getStoredUser,
  isRoleAuthenticated,
  setAuthSession,
} from '@/lib/auth';
import { getAdminApiBase, getDoctorApiBase, joinApiUrl } from '@/lib/apiBase';
import { ADMIN_ROUTES, DOCTOR_ROUTES } from '@/lib/apiRoutes';

interface User {
  userId: string;
  role: string;
  name: string;
}

type AuthSuccessPayload = {
  token?: string;
  user?: Record<string, unknown>;
  doctor?: Record<string, unknown>;
};

interface AuthContextType {
  user: User | null;
  token: string | null;
  role: AuthRole | null;
  login: (username: string, password: string, role: AuthRole) => Promise<boolean>;
  logout: (role?: AuthRole) => void;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [role, setRole] = useState<AuthRole | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const loginEndpoint = (targetRole: AuthRole): string =>
    targetRole === "admin"
      ? joinApiUrl(getAdminApiBase(), ADMIN_ROUTES.login)
      : joinApiUrl(getDoctorApiBase(), DOCTOR_ROUTES.login);

  const loginPayload = (targetRole: AuthRole, username: string, password: string) =>
    targetRole === "admin"
      ? { username, password }
      : { doctor_name: username, password };

  const extractAuthPayload = (responseData: any): AuthSuccessPayload | null => {
    if (!responseData?.success) {
      return null;
    }

    if (responseData?.data?.token) {
      return {
        token: responseData.data.token,
        user: responseData.data.user,
      };
    }

    if (responseData?.token) {
      return {
        token: responseData.token,
        user: responseData.user,
        doctor: responseData.doctor,
      };
    }

    return null;
  };

  const normalizeUser = (role: AuthRole, payload: AuthSuccessPayload, username: string): StoredUser => {
    const rawUser = (payload.user || payload.doctor || {}) as Record<string, unknown>;

    return {
      userId: String(rawUser.userId || rawUser.doctorId || rawUser.id || username),
      role: String(rawUser.role || role),
      name: String(rawUser.name || rawUser.doctor_name || username),
    };
  };

  useEffect(() => {
    if (isRoleAuthenticated("admin")) {
      setToken(getStoredToken("admin"));
      setUser(getStoredUser("admin"));
      setRole("admin");
      return;
    }

    if (isRoleAuthenticated("doctor")) {
      setToken(getStoredToken("doctor"));
      setUser(getStoredUser("doctor"));
      setRole("doctor");
    }
  }, []);

  const login = async (username: string, password: string, role: AuthRole): Promise<boolean> => {
    setIsLoading(true);

    try {
      const url = loginEndpoint(role);
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(loginPayload(role, username, password)),
      });

      const responseText = await response.text();
      const responseData = responseText ? JSON.parse(responseText) : null;
      const authPayload = extractAuthPayload(responseData);

      if (response.ok && authPayload?.token) {
        const newToken = authPayload.token;
        const newUser = normalizeUser(role, authPayload, username);

        setToken(newToken);
        setUser(newUser);
        setRole(role);

        setAuthSession(role, newToken, newUser);

        return true;
      }

      console.error(`${role} login failed`, { url, status: response.status, responseData });
      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = (targetRole?: AuthRole) => {
    const sessionRole = targetRole || role;
    setToken(null);
    setUser(null);
    setRole(null);

    if (sessionRole) {
      clearAllAuthSessions();
      return;
    }

    clearAllAuthSessions();
  };

  const isAuthenticated = !!token && !!user;

  const value: AuthContextType = {
    user,
    token,
    role,
    login,
    logout,
    isAuthenticated,
    isLoading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
