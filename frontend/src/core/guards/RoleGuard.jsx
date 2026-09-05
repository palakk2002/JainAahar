import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@core/context/AuthContext';
import { UserRole } from '../constants/roles';

const RoleGuard = ({ children, allowedRoles }) => {
    const { role, user, isAuthenticated, isLoading, authData } = useAuth();
    const location = useLocation();

    if (isLoading) {
        return null; // Let ProtectedRoute handle the loading spinner
    }

    const isAdmin = role === 'admin' || user?.role === 'admin' || Boolean(authData?.admin);
    const isAllowed =
        (isAuthenticated && allowedRoles.includes(role)) ||
        (isAdmin && (allowedRoles.includes(UserRole.ADMIN) || allowedRoles.includes('admin'))) ||
        ((allowedRoles.includes('warehouse') || allowedRoles.includes(UserRole.WAREHOUSE_MGMT)) && (role === 'warehouse' || role === 'warehouse_mgmt' || isAdmin));

    if (!isAuthenticated) {
        if (location.pathname.startsWith('/admin')) {
            return <Navigate to="/admin/auth" state={{ from: location }} replace />;
        }
        if (location.pathname.startsWith('/seller')) {
            return <Navigate to="/seller/auth" state={{ from: location }} replace />;
        }
        if (location.pathname.startsWith('/delivery')) {
            return <Navigate to="/delivery/auth" state={{ from: location }} replace />;
        }
        if (location.pathname.startsWith('/warehouse') || location.pathname.startsWith('/warehouse-mgmt')) {
            return <Navigate to="/warehouse/auth" state={{ from: location }} replace />;
        }
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    if (!isAllowed) {
        // Redirect to their respective dashboard if they are logged in but lack this specific role
        if (role) {
            return <Navigate to={isAdmin ? '/admin' : `/${role}`} replace />;
        }
        return <Navigate to="/unauthorized" replace />;
    }

    return <>{children}</>;
};

export default RoleGuard;
