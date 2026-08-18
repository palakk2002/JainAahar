import { useAuth } from '@core/context/AuthContext';

export const useWarehouseContext = () => {
    const { user, role } = useAuth();

    const isWarehouseUser = role === 'warehouse';

    const getActiveWarehouse = (currentSelected = 'all') => {
        if (isWarehouseUser && user) {
            const city = (user.city || '').toLowerCase();
            if (city.includes('indore')) return 'wh-indore';
            if (city.includes('shivpuri')) return 'wh-shivpuri';
        }
        return currentSelected;
    };

    return {
        isWarehouseUser,
        getActiveWarehouse,
        warehouseId: isWarehouseUser ? getActiveWarehouse() : null,
        warehouseName: isWarehouseUser ? (user?.warehouseName || user?.shopName || 'My Warehouse') : null,
    };
};

export default useWarehouseContext;
