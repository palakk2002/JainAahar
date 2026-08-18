import { useAuth } from '@core/context/AuthContext';

export const useWarehouseContext = () => {
    const { user, role } = useAuth();

    const isWarehouseUser = role === 'warehouse' || role === 'warehouse_mgmt';
    const realWarehouseId = user?._id || user?.id || null;

    const getActiveWarehouse = (currentSelected = 'all') => {
        if (isWarehouseUser && realWarehouseId) {
            return realWarehouseId;
        }
        return currentSelected;
    };

    return {
        isWarehouseUser,
        getActiveWarehouse,
        warehouseId: isWarehouseUser ? realWarehouseId : null,
        warehouseName: isWarehouseUser ? (user?.warehouseName || user?.name || user?.shopName || 'My Warehouse') : null,
        user,
    };
};

export default useWarehouseContext;

