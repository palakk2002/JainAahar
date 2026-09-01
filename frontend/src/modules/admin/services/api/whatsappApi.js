import axiosInstance from '@core/api/axios';

/**
 * Admin WhatsApp Business Integration Endpoints
 */
export const adminWhatsappApi = {
  getSettings: () => axiosInstance.get('/admin/whatsapp/settings'),
  updateSettings: (data) => axiosInstance.put('/admin/whatsapp/settings', data),
  getLogs: (params) => axiosInstance.get('/admin/whatsapp/logs', { params }),
  sendTestMessage: (data) => axiosInstance.post('/admin/whatsapp/test', data),
};

export default adminWhatsappApi;
