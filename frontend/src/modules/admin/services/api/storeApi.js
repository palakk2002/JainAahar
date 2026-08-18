import axiosInstance from '@core/api/axios';

/**
 * Admin Single-Store operations: Profile, Open/Closed status, Analytics, Stock.
 */
export const adminStoreApi = {
    getStoreProfile: () => axiosInstance.get('/seller/profile'),
    updateStoreProfile: (data) => axiosInstance.put('/seller/profile', data),
    getStoreStats: (range) => axiosInstance.get('/seller/stats', { params: { range } }),
    getStoreEarnings: () => axiosInstance.get('/seller/earnings'),
    getStoreWalletSummary: () => axiosInstance.get('/seller/wallet/summary'),
    adjustStock: (data) => axiosInstance.post('/products/adjust-stock', data),
    getStockHistory: () => axiosInstance.get('/products/stock-history'),
};

export default adminStoreApi;
