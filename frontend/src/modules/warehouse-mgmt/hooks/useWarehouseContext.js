import { useAuth } from '@core/context/AuthContext';
import { useLocation } from 'react-router-dom';

export const useWarehouseContext = () => {
    const { user, role, authData } = useAuth();
    const location = useLocation();

    const isAdmin = role === 'admin' || user?.role === 'admin' || Boolean(authData?.admin);
    const isWarehouseUser = !isAdmin && (role === 'warehouse' || role === 'warehouse_mgmt' || user?.role === 'warehouse');
    const realWarehouseId = user?._id || user?.id || null;

    const basePath = location.pathname.startsWith('/warehouse-mgmt')
        ? '/warehouse-mgmt'
        : (isWarehouseUser ? '/warehouse' : '/warehouse-mgmt');

    const getActiveWarehouse = (currentSelected = 'all') => {
        if (isWarehouseUser && realWarehouseId) {
            return realWarehouseId;
        }
        return currentSelected;
    };

    return {
        isAdmin,
        isWarehouseUser,
        getActiveWarehouse,
        warehouseId: isWarehouseUser ? realWarehouseId : null,
        warehouseName: isWarehouseUser ? (user?.warehouseName || user?.name || user?.shopName || 'My Warehouse') : null,
        basePath,
        user,
    };
};

export default useWarehouseContext;


