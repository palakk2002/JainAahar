import axiosInstance from '@core/api/axios';

/**
 * Admin order and return endpoints.
 * Per-domain split (P4.5).
 */
export const adminOrdersApi = {
    getOrders: (params) =>
        axiosInstance.get('/orders/seller-orders', { params }),
    getOrderDetails: (orderId) =>
        axiosInstance.get(`/orders/details/${orderId}`),
    updateOrderStatus: (orderId, data) =>
        axiosInstance.put(`/orders/status/${orderId}`, data),

    getReturns: (params) =>
        axiosInstance.get('/orders/seller-returns', { params }),
    getReturnDetails: (orderId) =>
        axiosInstance.get(`/orders/${orderId}/returns`),
    approveReturn: (orderId, data) =>
        axiosInstance.put(`/orders/returns/${orderId}/approve`, data),
    rejectReturn: (orderId, data) =>
        axiosInstance.put(`/orders/returns/${orderId}/reject`, data),
    assignReturnDelivery: (orderId, data) =>
        axiosInstance.put(`/orders/returns/${orderId}/assign-delivery`, data),
    // Warehouse Order Assignment (Single-Vendor Multi-Hub)
    getUnassignedOrders: (params) =>
        axiosInstance.get('/admin/orders/unassigned', { params }),
    getWarehouseEligibility: (orderId) =>
        axiosInstance.get(`/admin/orders/${orderId}/warehouse-eligibility`),
    assignWarehouse: (orderId, data) =>
        axiosInstance.post(`/admin/orders/${orderId}/assign-warehouse`, data),
};

export default adminOrdersApi;
