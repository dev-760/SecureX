// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { BlockchainProvider } from './contexts/BlockchainContext'; // Added for Fabric integration

// Layouts
import DashboardLayout from './layouts/DashboardLayout';
import AuthLayout from './layouts/AuthLayout';

// Pages
import Dashboard from './pages/Dashboard';
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import ForgotPassword from './pages/Auth/ForgotPassword';
import ResetPassword from './pages/Auth/ResetPassword';
import DeviceManagement from './pages/DeviceManagement';
import DeviceDetails from './pages/DeviceDetails';
import DataRecords from './pages/DataRecords';
import RecordDetails from './pages/RecordDetails';
import AlertManagement from './pages/AlertManagement';
import AlertDetails from './pages/AlertDetails';
import UserManagement from './pages/UserManagement';
import UserProfile from './pages/UserProfile';
import Settings from './pages/Settings';
import NotFound from './pages/NotFound';

// Added pages based on your backend implementation
import AdminPanel from './pages/AdminPanel';
import SystemHealth from './pages/SystemHealth';
import AccessLogs from './pages/AccessLogs';

// Protected Route Component
const ProtectedRoute = ({ children, requiredRole }) => {
    const { currentUser, isLoading, userRole } = useAuth();

    if (isLoading) {
        return <div className="loading-spinner">Loading...</div>;
    }

    if (!currentUser) {
        return <Navigate to="/login" replace />;
    }

    // Check for role-based access if requiredRole is specified
    if (requiredRole && (!userRole || !requiredRole.includes(userRole))) {
        return <Navigate to="/dashboard" replace />;
    }

    return children;
};

function App() {
    return (
        <Router>
        <ThemeProvider>
        <LanguageProvider>
        <NotificationProvider>
        <AuthProvider>
        <BlockchainProvider>
        <Routes>
        {/* Auth Routes */}
        <Route element={<AuthLayout />}>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
        </Route>

        {/* Dashboard Routes */}
        <Route element={<DashboardLayout />}>
        {/* General Routes */}
        <Route path="/dashboard" element={
            <ProtectedRoute>
            <Dashboard />
            </ProtectedRoute>
        } />

        <Route path="/profile" element={
            <ProtectedRoute>
            <UserProfile />
            </ProtectedRoute>
        } />

        <Route path="/settings" element={
            <ProtectedRoute>
            <Settings />
            </ProtectedRoute>
        } />

        {/* Device Routes */}
        <Route path="/devices" element={
            <ProtectedRoute requiredRole={['admin', 'manager', 'supervisor', 'worker']}>
            <DeviceManagement />
            </ProtectedRoute>
        } />

        <Route path="/devices/:deviceId" element={
            <ProtectedRoute requiredRole={['admin', 'manager', 'supervisor', 'worker']}>
            <DeviceDetails />
            </ProtectedRoute>
        } />

        {/* Data Routes */}
        <Route path="/data" element={
            <ProtectedRoute requiredRole={['admin', 'manager', 'supervisor', 'worker']}>
            <DataRecords />
            </ProtectedRoute>
        } />

        <Route path="/data/:recordId" element={
            <ProtectedRoute requiredRole={['admin', 'manager', 'supervisor', 'worker']}>
            <RecordDetails />
            </ProtectedRoute>
        } />

        {/* Alert Routes */}
        <Route path="/alerts" element={
            <ProtectedRoute requiredRole={['admin', 'manager', 'supervisor']}>
            <AlertManagement />
            </ProtectedRoute>
        } />

        <Route path="/alerts/:alertId" element={
            <ProtectedRoute requiredRole={['admin', 'manager', 'supervisor']}>
            <AlertDetails />
            </ProtectedRoute>
        } />

        {/* Admin Routes */}
        <Route path="/users" element={
            <ProtectedRoute requiredRole={['admin', 'manager']}>
            <UserManagement />
            </ProtectedRoute>
        } />

        <Route path="/admin" element={
            <ProtectedRoute requiredRole={['admin']}>
            <AdminPanel />
            </ProtectedRoute>
        } />

        <Route path="/system-health" element={
            <ProtectedRoute requiredRole={['admin']}>
            <SystemHealth />
            </ProtectedRoute>
        } />

        <Route path="/access-logs" element={
            <ProtectedRoute requiredRole={['admin', 'manager']}>
            <AccessLogs />
            </ProtectedRoute>
        } />
        </Route>

        {/* Redirect root to dashboard if logged in, otherwise to login */}
        <Route path="/" element={
            <AuthRedirect />
        } />

        {/* 404 Route */}
        <Route path="*" element={<NotFound />} />
        </Routes>
        </BlockchainProvider>
        </AuthProvider>
        </NotificationProvider>
        </LanguageProvider>
        </ThemeProvider>
        </Router>
    );
}

// Helper component to redirect based on auth state
const AuthRedirect = () => {
    const { currentUser, isLoading } = useAuth();

    if (isLoading) {
        return <div className="loading-spinner">Loading...</div>;
    }

    return currentUser ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />;
};

export default App;
