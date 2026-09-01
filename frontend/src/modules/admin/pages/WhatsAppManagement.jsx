import React, { useState, useEffect } from 'react';
import Card from '@shared/components/ui/Card';
import {
  MessageSquare,
  CheckCircle2,
  AlertCircle,
  Clock,
  Send,
  RefreshCw,
  Search,
  Filter,
  Check,
  Copy,
  ExternalLink,
  ShieldCheck,
  Radio,
  Sliders,
  FileText,
  Activity,
  PhoneCall,
  Loader2,
  Eye,
  X,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@shared/components/ui/Toast';
import { adminWhatsappApi } from '../services/api/whatsappApi';

const EVENT_METADATA = [
  {
    key: 'orderPlaced',
    label: 'Order Placed',
    template: 'order_placed',
    category: 'Ordering',
    description: 'Sent immediately when customer places an order (COD or Prepaid).',
  },
  {
    key: 'orderConfirmed',
    label: 'Order Confirmed',
    template: 'order_confirmed',
    category: 'Ordering',
    description: 'Sent when seller, admin, or warehouse accepts the order.',
  },
  {
    key: 'paymentSuccess',
    label: 'Payment Successful',
    template: 'payment_successful',
    category: 'Payment',
    description: 'Sent upon successful online payment verification via gateway.',
  },
  {
    key: 'paymentFailed',
    label: 'Payment Failed',
    template: 'payment_failed',
    category: 'Payment',
    description: 'Sent when an online payment attempt fails with retry instructions.',
  },
  {
    key: 'orderPacked',
    label: 'Order Packed',
    template: 'order_packed',
    category: 'Fulfillment',
    description: 'Sent when warehouse completes picking and packing.',
  },
  {
    key: 'shipmentCreated',
    label: 'Shipment Created',
    template: 'shipment_created',
    category: 'Shipping',
    description: 'Sent when Shiprocket creates AWB tracking identifier.',
  },
  {
    key: 'orderShipped',
    label: 'Order Shipped',
    template: 'order_shipped',
    category: 'Shipping',
    description: 'Sent when package is handed over to courier partner.',
  },
  {
    key: 'outForDelivery',
    label: 'Out for Delivery',
    template: 'Delivery',
    category: 'Delivery',
    description: 'Sent when courier partner marks the shipment out for delivery.',
  },
  {
    key: 'orderDelivered',
    label: 'Order Delivered',
    template: 'order_delivered',
    category: 'Delivery',
    description: 'Sent when package is marked as delivered / drop OTP verified.',
  },
  {
    key: 'orderCancelled',
    label: 'Order Cancelled',
    template: 'order_cancelled',
    category: 'Ordering',
    description: 'Sent when order is cancelled by user, seller, or admin.',
  },
  {
    key: 'deliveryFailed',
    label: 'Delivery Failed / RTO',
    template: 'delivery_failed',
    category: 'Delivery',
    description: 'Sent if delivery attempt fails or RTO return is initiated.',
  },
  {
    key: 'refundInitiated',
    label: 'Refund Initiated',
    template: 'refund_initiated',
    category: 'Payment',
    description: 'Sent when a refund request is accepted and initiated.',
  },
  {
    key: 'refundCompleted',
    label: 'Refund Completed',
    template: 'refund_completed',
    category: 'Payment',
    description: 'Sent when refund is credited back to original source/wallet.',
  },
];

const WhatsAppManagement = () => {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState('controls');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [statusData, setStatusData] = useState(null);

  // Event Toggles State
  const [eventToggles, setEventToggles] = useState({});
  const [isGloballyEnabled, setIsGloballyEnabled] = useState(true);

  // Test Message State
  const [testPhone, setTestPhone] = useState('');
  const [testTemplate, setTestTemplate] = useState('order_placed');
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [testResult, setTestResult] = useState(null);

  // Logs State
  const [logs, setLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [logsPage, setLogsPage] = useState(1);
  const [logsTotalPages, setLogsTotalPages] = useState(1);
  const [logsTotal, setLogsTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLogModal, setSelectedLogModal] = useState(null);

  // Copy URL state
  const [copiedKey, setCopiedKey] = useState(null);

  const fetchSettings = async () => {
    try {
      setIsLoading(true);
      const res = await adminWhatsappApi.getSettings();
      const data = res.data?.result || res.data;
      if (data) {
        setStatusData(data);
        setIsGloballyEnabled(data.enabled !== false);
        setEventToggles(data.eventToggles || {});
      }
    } catch (err) {
      console.error('Failed to load WhatsApp settings:', err);
      showToast('Failed to load WhatsApp settings', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchLogs = async (page = 1) => {
    try {
      setLogsLoading(true);
      const params = {
        page,
        limit: 15,
        status: statusFilter,
        search: searchQuery,
      };
      const res = await adminWhatsappApi.getLogs(params);
      const data = res.data?.result || res.data;
      if (data) {
        setLogs(data.logs || []);
        setLogsPage(data.page || 1);
        setLogsTotalPages(data.totalPages || 1);
        setLogsTotal(data.total || 0);
      }
    } catch (err) {
      console.error('Failed to fetch WhatsApp logs:', err);
    } finally {
      setLogsLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  useEffect(() => {
    if (activeTab === 'logs') {
      fetchLogs(logsPage);
    }
  }, [activeTab, logsPage, statusFilter]);

  const handleToggleEvent = (key) => {
    setEventToggles((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleSaveSettings = async () => {
    try {
      setIsSaving(true);
      await adminWhatsappApi.updateSettings({
        enabled: isGloballyEnabled,
        eventToggles,
      });
      showToast('WhatsApp settings updated successfully', 'success');
      fetchSettings();
    } catch (err) {
      console.error('Save WhatsApp settings failed:', err);
      showToast(err.response?.data?.message || 'Failed to save settings', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSendTestMessage = async (e) => {
    e.preventDefault();
    if (!testPhone || testPhone.replace(/\D/g, '').length < 10) {
      showToast('Please enter a valid 10+ digit mobile number', 'error');
      return;
    }

    try {
      setIsSendingTest(true);
      setTestResult(null);
      const res = await adminWhatsappApi.sendTestMessage({
        phone: testPhone,
        templateName: testTemplate,
      });
      const data = res.data?.result || res.data;
      setTestResult({
        success: true,
        data,
      });
      showToast('Test WhatsApp message sent successfully!', 'success');
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Failed to dispatch test message';
      setTestResult({
        success: false,
        error: errMsg,
      });
      showToast(errMsg, 'error');
    } finally {
      setIsSendingTest(false);
    }
  };

  const copyToClipboard = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    showToast('Copied to clipboard', 'info');
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'delivered':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 size={12} /> Delivered
          </span>
        );
      case 'read':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
            <CheckCircle2 size={12} /> Read
          </span>
        );
      case 'sent':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-teal-50 text-teal-700 border border-teal-200">
            <Check size={12} /> Sent
          </span>
        );
      case 'failed':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
            <AlertCircle size={12} /> Failed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-50 text-slate-700 border border-slate-200">
            <Clock size={12} /> Pending
          </span>
        );
    }
  };

  const webhookCallbackUrl = `${window.location.origin.replace(':5173', ':7000')}/api/webhooks/whatsapp`;
  const webhookVerifyToken = 'jainahar_wa_verify_token_2026';

  return (
    <div className="ds-section-spacing animate-in fade-in slide-in-from-bottom-4 duration-500 pb-16">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 px-1 mb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl lg:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
              WhatsApp Business Integration
              <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100">
                <MessageSquare className="h-6 w-6" />
              </div>
            </h1>
          </div>
          <p className="text-slate-500 text-sm font-medium mt-1">
            Configure automated customer order, shipment, and delivery notifications via WhatsApp Cloud API.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              fetchSettings();
              if (activeTab === 'logs') fetchLogs(logsPage);
            }}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition shadow-xs"
          >
            <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
            Refresh
          </button>
          <button
            onClick={handleSaveSettings}
            disabled={isSaving || isLoading}
            className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition shadow-md shadow-emerald-200"
          >
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            {isSaving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>

      {/* Integration Status Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Status Card */}
        <Card className="p-5 border-none shadow-sm ring-1 ring-slate-100 bg-white rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Engine Mode</span>
            <div className="flex items-center gap-2 mt-1">
              <span className={cn(
                "h-2.5 w-2.5 rounded-full animate-pulse",
                statusData?.isMockMode ? "bg-amber-500" : statusData?.enabled ? "bg-emerald-500" : "bg-rose-500"
              )} />
              <h3 className="text-lg font-black text-slate-900">
                {statusData?.isMockMode ? "Mock / Dev Mode" : statusData?.enabled ? "Live Cloud API" : "Disabled"}
              </h3>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {statusData?.isMockMode ? "Simulating dispatch locally" : "Connected to Meta Graph API"}
            </p>
          </div>
          <div className="h-11 w-11 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-600">
            <Activity className="h-5 w-5" />
          </div>
        </Card>

        {/* Phone Number ID */}
        <Card className="p-5 border-none shadow-sm ring-1 ring-slate-100 bg-white rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Sender ID</span>
            <h3 className="text-base font-black text-slate-900 mt-1 font-mono">
              {statusData?.phoneNumberId || "Not Configured"}
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">Meta WABA Phone ID</p>
          </div>
          <div className="h-11 w-11 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
            <PhoneCall className="h-5 w-5" />
          </div>
        </Card>

        {/* Messages Dispatched */}
        <Card className="p-5 border-none shadow-sm ring-1 ring-slate-100 bg-white rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Dispatched</span>
            <h3 className="text-2xl font-black text-slate-900 mt-1">
              {statusData?.stats?.total ?? 0}
            </h3>
            <p className="text-[11px] text-emerald-600 font-semibold mt-0.5">
              {statusData?.stats?.sent ?? 0} Sent · {statusData?.stats?.delivered ?? 0} Delivered
            </p>
          </div>
          <div className="h-11 w-11 rounded-2xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-600">
            <Send className="h-5 w-5" />
          </div>
        </Card>

        {/* Webhook Status */}
        <Card className="p-5 border-none shadow-sm ring-1 ring-slate-100 bg-white rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Webhook Health</span>
            <div className="flex items-center gap-1.5 mt-1">
              <ShieldCheck className={cn("h-4 w-4", statusData?.webhookVerified ? "text-emerald-600" : "text-amber-500")} />
              <h3 className="text-base font-black text-slate-900">
                {statusData?.webhookVerified ? "Verified" : "Ready for Setup"}
              </h3>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">Inbound receipt endpoint</p>
          </div>
          <div className="h-11 w-11 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
            <Radio className="h-5 w-5" />
          </div>
        </Card>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3 mb-6 overflow-x-auto">
        <button
          onClick={() => setActiveTab('controls')}
          className={cn(
            "flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all",
            activeTab === 'controls'
              ? "bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-xs"
              : "text-slate-600 hover:bg-slate-100"
          )}
        >
          <Sliders size={16} /> Notification Controls ({EVENT_METADATA.length})
        </button>

        <button
          onClick={() => setActiveTab('test')}
          className={cn(
            "flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all",
            activeTab === 'test'
              ? "bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-xs"
              : "text-slate-600 hover:bg-slate-100"
          )}
        >
          <Send size={16} /> Send Test Message
        </button>

        <button
          onClick={() => setActiveTab('logs')}
          className={cn(
            "flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all",
            activeTab === 'logs'
              ? "bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-xs"
              : "text-slate-600 hover:bg-slate-100"
          )}
        >
          <FileText size={16} /> Message Logs & Audit
        </button>

        <button
          onClick={() => setActiveTab('webhook')}
          className={cn(
            "flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all",
            activeTab === 'webhook'
              ? "bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-xs"
              : "text-slate-600 hover:bg-slate-100"
          )}
        >
          <Radio size={16} /> Meta Webhook Config
        </button>
      </div>

      {/* TAB 1: NOTIFICATION CONTROLS */}
      {activeTab === 'controls' && (
        <div className="space-y-6">
          {/* Master Switch Card */}
          <Card className="p-6 border-none shadow-sm ring-1 ring-slate-100 bg-gradient-to-r from-emerald-50/50 via-white to-teal-50/40 rounded-2xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="h-12 w-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-200 shrink-0">
                  <MessageSquare size={24} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Master WhatsApp Notification Switch</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Toggle all customer WhatsApp notifications on or off globally across the entire platform.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className={cn(
                  "text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full",
                  isGloballyEnabled ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-600"
                )}>
                  {isGloballyEnabled ? "Enabled" : "Disabled"}
                </span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isGloballyEnabled}
                    onChange={(e) => setIsGloballyEnabled(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-13 h-7 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[4px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
              </div>
            </div>
          </Card>

          {/* Event Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {EVENT_METADATA.map((event) => {
              const isEnabled = eventToggles[event.key] !== false;
              return (
                <Card
                  key={event.key}
                  className={cn(
                    "p-5 border transition-all rounded-2xl flex flex-col justify-between",
                    isEnabled
                      ? "bg-white border-slate-200 shadow-xs hover:border-emerald-300"
                      : "bg-slate-50/60 border-slate-200/60 opacity-70"
                  )}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className="px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider rounded-md bg-slate-100 text-slate-600">
                        {event.category}
                      </span>
                      <span className="text-[11px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                        {event.template}
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-slate-900">{event.label}</h4>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">{event.description}</p>
                  </div>

                  <div className="flex items-center justify-between pt-4 mt-4 border-t border-slate-100">
                    <span className="text-xs font-semibold text-slate-600">
                      {isEnabled ? "Notification Active" : "Notification Muted"}
                    </span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isEnabled}
                        onChange={() => handleToggleEvent(event.key)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                    </label>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: SEND TEST MESSAGE */}
      {activeTab === 'test' && (
        <div className="max-w-2xl mx-auto space-y-6">
          <Card className="p-6 border-none shadow-sm ring-1 ring-slate-100 bg-white rounded-2xl">
            <div className="flex items-center gap-3 mb-4 pb-4 border-b border-slate-100">
              <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Send size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Dispatch Diagnostic Test Message</h3>
                <p className="text-xs text-slate-500">
                  Verify your Meta WhatsApp Cloud API credentials or simulate message delivery in Mock Mode.
                </p>
              </div>
            </div>

            <form onSubmit={handleSendTestMessage} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Mobile Number (with Country Code)
                </label>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-2.5 bg-slate-100 text-slate-700 font-bold rounded-xl text-sm border border-slate-200">
                    +91
                  </span>
                  <input
                    type="tel"
                    value={testPhone}
                    onChange={(e) => setTestPhone(e.target.value)}
                    placeholder="Enter 10-digit mobile number (e.g. 9876543210)"
                    className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 outline-none focus:border-emerald-500 focus:bg-white transition"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Select Template
                </label>
                <select
                  value={testTemplate}
                  onChange={(e) => setTestTemplate(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 outline-none focus:border-emerald-500 focus:bg-white transition"
                >
                  {EVENT_METADATA.map((ev) => (
                    <option key={ev.template} value={ev.template}>
                      {ev.label} ({ev.template})
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSendingTest}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white rounded-xl text-sm font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-md shadow-emerald-200 transition"
                >
                  {isSendingTest ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  {isSendingTest ? 'Dispatching Message...' : 'Send WhatsApp Test Message'}
                </button>
              </div>
            </form>

            {testResult && (
              <div className={cn(
                "mt-6 p-4 rounded-2xl border text-sm animate-in fade-in duration-300",
                testResult.success
                  ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                  : "bg-rose-50 border-rose-200 text-rose-800"
              )}>
                <div className="flex items-center gap-2 font-bold mb-1">
                  {testResult.success ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                  {testResult.success ? "Message Dispatched Successfully!" : "Dispatch Failed"}
                </div>
                <p className="text-xs opacity-90">
                  {testResult.success
                    ? `Message ID: ${testResult.data?.messageId || 'Generated'} (Mode: ${testResult.data?.isMock ? 'Mock' : 'Live Cloud API'})`
                    : testResult.error}
                </p>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* TAB 3: MESSAGE LOGS */}
      {activeTab === 'logs' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <Card className="p-4 border-none shadow-sm ring-1 ring-slate-100 bg-white rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3 flex-1">
              <div className="relative flex-1 max-w-sm">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by Order ID, Phone, Message ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && fetchLogs(1)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 outline-none focus:bg-white focus:border-emerald-500 transition"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none focus:border-emerald-500 transition"
              >
                <option value="all">All Delivery Statuses</option>
                <option value="sent">Sent</option>
                <option value="delivered">Delivered</option>
                <option value="read">Read</option>
                <option value="failed">Failed</option>
                <option value="pending">Pending</option>
              </select>
            </div>

            <span className="text-xs font-bold text-slate-500">
              Total Logs: <span className="text-slate-900">{logsTotal}</span>
            </span>
          </Card>

          {/* Logs Table */}
          <Card className="border-none shadow-sm ring-1 ring-slate-100 bg-white rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 border-b border-slate-100 text-slate-500 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="px-5 py-3.5">Recipient</th>
                    <th className="px-5 py-3.5">Order ID</th>
                    <th className="px-5 py-3.5">Event / Template</th>
                    <th className="px-5 py-3.5">Status</th>
                    <th className="px-5 py-3.5">Sent Time</th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {logsLoading ? (
                    <tr>
                      <td colSpan={6} className="text-center py-12 text-slate-400">
                        <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-emerald-600" />
                        Loading message logs...
                      </td>
                    </tr>
                  ) : logs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-12 text-slate-400">
                        No WhatsApp message logs found.
                      </td>
                    </tr>
                  ) : (
                    logs.map((log) => (
                      <tr key={log._id} className="hover:bg-slate-50/60 transition">
                        <td className="px-5 py-3.5">
                          <div className="font-bold text-slate-900">{log.userId?.name || 'Customer'}</div>
                          <div className="text-[11px] font-mono text-slate-500">{log.maskedPhone || log.phoneNumber}</div>
                        </td>
                        <td className="px-5 py-3.5 font-bold text-slate-800">
                          {log.orderId ? (
                            <span className="font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-700">
                              #{log.orderId}
                            </span>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="font-semibold text-slate-900">{log.eventType}</div>
                          <div className="text-[11px] font-mono text-emerald-600">{log.templateName}</div>
                        </td>
                        <td className="px-5 py-3.5">
                          {getStatusBadge(log.status)}
                        </td>
                        <td className="px-5 py-3.5 text-slate-500">
                          {log.createdAt ? new Date(log.createdAt).toLocaleString() : '—'}
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <button
                            onClick={() => setSelectedLogModal(log)}
                            className="p-1.5 hover:bg-slate-100 text-slate-600 rounded-lg transition"
                            title="Inspect Log"
                          >
                            <Eye size={16} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {logsTotalPages > 1 && (
              <div className="px-5 py-3 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-500 font-semibold">
                  Page {logsPage} of {logsTotalPages}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setLogsPage((p) => Math.max(1, p - 1))}
                    disabled={logsPage === 1 || logsLoading}
                    className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700 disabled:opacity-40"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setLogsPage((p) => Math.min(logsTotalPages, p + 1))}
                    disabled={logsPage === logsTotalPages || logsLoading}
                    className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700 disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* TAB 4: META WEBHOOK CONFIG */}
      {activeTab === 'webhook' && (
        <div className="max-w-2xl mx-auto space-y-6">
          <Card className="p-6 border-none shadow-sm ring-1 ring-slate-100 bg-white rounded-2xl space-y-5">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
              <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Radio size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Meta Webhook Configuration</h3>
                <p className="text-xs text-slate-500">
                  Register this callback URL in your Meta WhatsApp Cloud API developer portal to receive real-time delivery receipts (Sent, Delivered, Read, Failed).
                </p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Callback URL (Endpoint)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={webhookCallbackUrl}
                  className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-800 outline-none"
                />
                <button
                  onClick={() => copyToClipboard(webhookCallbackUrl, 'url')}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs flex items-center gap-1.5 transition"
                >
                  {copiedKey === 'url' ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                  {copiedKey === 'url' ? 'Copied' : 'Copy'}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Verify Token (hub.verify_token)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={webhookVerifyToken}
                  className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-800 outline-none"
                />
                <button
                  onClick={() => copyToClipboard(webhookVerifyToken, 'token')}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs flex items-center gap-1.5 transition"
                >
                  {copiedKey === 'token' ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                  {copiedKey === 'token' ? 'Copied' : 'Copy'}
                </button>
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-600 space-y-2">
              <div className="font-bold text-slate-900 flex items-center gap-1.5">
                <Sparkles size={14} className="text-emerald-600" />
                Setup Steps in Meta Developer App:
              </div>
              <ol className="list-decimal list-inside space-y-1 text-slate-600">
                <li>Go to <strong>Meta App Dashboard → WhatsApp → Configuration</strong>.</li>
                <li>Click <strong>Edit</strong> next to Webhook and paste the Callback URL and Verify Token.</li>
                <li>Click <strong>Verify and Save</strong>.</li>
                <li>Under Webhook Fields, subscribe to <code>messages</code>.</li>
              </ol>
            </div>
          </Card>
        </div>
      )}

      {/* Log Inspection Modal */}
      {selectedLogModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Message Log Details</h3>
              <button
                onClick={() => setSelectedLogModal(null)}
                className="p-1.5 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="font-semibold text-slate-400">Message ID:</span>
                <span className="font-mono text-slate-800">{selectedLogModal.messageId || 'N/A'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="font-semibold text-slate-400">Recipient Phone:</span>
                <span className="font-mono text-slate-800">{selectedLogModal.maskedPhone || selectedLogModal.phoneNumber}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="font-semibold text-slate-400">Event Type:</span>
                <span className="font-bold text-slate-800">{selectedLogModal.eventType}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="font-semibold text-slate-400">Template Name:</span>
                <span className="font-mono text-emerald-700">{selectedLogModal.templateName}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="font-semibold text-slate-400">Delivery Status:</span>
                <div>{getStatusBadge(selectedLogModal.status)}</div>
              </div>
              {selectedLogModal.errorMessage && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800">
                  <span className="font-bold">Error Reason: </span>
                  {selectedLogModal.errorMessage}
                </div>
              )}
              {selectedLogModal.templateParams && (
                <div>
                  <span className="font-semibold text-slate-400 block mb-1">Template Parameters:</span>
                  <pre className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-[11px] font-mono text-slate-700 overflow-x-auto">
                    {JSON.stringify(selectedLogModal.templateParams, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            <button
              onClick={() => setSelectedLogModal(null)}
              className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default WhatsAppManagement;
