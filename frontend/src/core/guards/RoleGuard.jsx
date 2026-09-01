import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@core/context/AuthContext';
import { UserRole } from '../constants/roles';

const RoleGuard = ({ children, allowedRoles }) => {
    const { role, user, isAuthenticated, isLoading, authData } = useAuth();

    if (isLoading) {
        return null; // Let ProtectedRoute handle the loading spinner
    }

    const isAdmin = role === 'admin' || user?.role === 'admin' || Boolean(authData?.admin);
    const isAllowed =
        (isAuthenticated && allowedRoles.includes(role)) ||
        (isAdmin && (allowedRoles.includes(UserRole.ADMIN) || allowedRoles.includes('admin'))) ||
        ((allowedRoles.includes('warehouse') || allowedRoles.includes(UserRole.WAREHOUSE_MGMT)) && (role === 'warehouse' || role === 'warehouse_mgmt' || isAdmin));

    if (!isAuthenticated || !isAllowed) {
        // Redirect to their respective dashboard if they are logged in but trying to access the wrong area
        if (isAuthenticated && role) {
            return <Navigate to={isAdmin ? '/admin' : `/${role}`} replace />;
        }
        return <Navigate to="/unauthorized" replace />;
    }

    return <>{children}</>;
};

export default RoleGuard;
