import React, { useState, useEffect, useCallback } from "react";
import PageHeader from "@shared/components/ui/PageHeader";
import Card from "@shared/components/ui/Card";
import Badge from "@shared/components/ui/Badge";
import Modal from "@shared/components/ui/Modal";
import Loader from "@shared/components/ui/Loader";
import { warehouseMgmtApi } from "../services/warehouseMgmtApi";
import {
  MapPin,
  Building2,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Truck,
  Upload,
  Phone,
  Mail,
  Hash,
  Globe,
  Navigation,
} from "lucide-react";
import { toast } from "sonner";

/** Generate a Shiprocket-compatible pickup nickname from warehouse name */
function generatePickupNickname(warehouseName) {
  return (warehouseName || "Warehouse")
    .replace(/[^a-zA-Z0-9\s_-]/g, "")
    .trim()
    .replace(/\s+/g, "_")
    .toUpperCase()
    .slice(0, 36);
}

const INITIAL_FORM = {
  pickup_location: "",
  name: "",
  email: "",
  phone: "",
  address: "",
  address_2: "",
  city: "",
  state: "",
  pin_code: "",
};

export const PickupAddresses = () => {
  const [warehouses, setWarehouses] = useState([]);
  const [shiprocketLocations, setShiprocketLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [selectedWarehouse, setSelectedWarehouse] = useState(null);
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [showForm, setShowForm] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [statusRes, listRes] = await Promise.all([
        warehouseMgmtApi.getPickupSyncStatus(),
        warehouseMgmtApi.listShiprocketPickups(),
      ]);
      setWarehouses(statusRes.data?.result?.items || []);
      setShiprocketLocations(listRes.data?.result?.locations || []);
    } catch (err) {
      toast.error("Failed to load pickup address data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const openSyncForm = (wh) => {
    setSelectedWarehouse(wh);
    setFormData({
      pickup_location: wh.shiprocketPickupLocation || generatePickupNickname(wh.warehouseName),
      name: wh.name || "",
      email: wh.email || "",
      phone: wh.phone || "",
      address: (wh.address || "").slice(0, 80),
      address_2: (wh.locality || "").slice(0, 80),
      city: wh.city || "",
      state: wh.state || "",
      pin_code: wh.pincode || "",
    });
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedWarehouse) return;

    // Basic validation
    if (!formData.pickup_location.trim()) {
      toast.error("Pickup Location Nickname is required");
      return;
    }
    if (!formData.address.trim()) {
      toast.error("Address Line 1 is required");
      return;
    }
    if (!formData.city.trim() || !formData.state.trim()) {
      toast.error("City and State are required");
      return;
    }
    if (!/^\d{6}$/.test(formData.pin_code.replace(/\D/g, ""))) {
      toast.error("PIN Code must be exactly 6 digits");
      return;
    }
    if (!/^\d{10}$/.test(formData.phone.replace(/\D/g, ""))) {
      toast.error("Phone number must be exactly 10 digits");
      return;
    }

    setSyncing(true);
    try {
      const res = await warehouseMgmtApi.syncPickupAddress(selectedWarehouse.id, formData);
      if (res.data?.success !== false && res.status !== 500) {
        toast.success(
          `✅ Pickup address "${formData.pickup_location}" synced to Shiprocket!`
        );
        setShowForm(false);
        setSelectedWarehouse(null);
        fetchData();
      } else {
        toast.error(res.data?.message || "Failed to sync pickup address");
      }
    } catch (err) {
      toast.error(
        err.response?.data?.message || "Failed to sync pickup address to Shiprocket"
      );
    } finally {
      setSyncing(false);
    }
  };

  const handleChange = (field) => (e) => {
    let value = e.target.value;
    if (field === "pickup_location") {
      value = value.replace(/[^a-zA-Z0-9_-]/g, "").toUpperCase().slice(0, 36);
    }
    if (field === "phone") {
      value = value.replace(/\D/g, "").slice(0, 10);
    }
    if (field === "pin_code") {
      value = value.replace(/\D/g, "").slice(0, 6);
    }
    if (field === "address") {
      value = value.slice(0, 80);
    }
    if (field === "address_2") {
      value = value.slice(0, 80);
    }
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return (
      <div className="h-64 flex items-center justify-center">
        <Loader />
      </div>
    );
  }

  const syncedCount = warehouses.filter((wh) => wh.shiprocketPickupSynced).length;
  const unsyncedCount = warehouses.length - syncedCount;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Shiprocket Pickup Addresses"
        description="Sync warehouse addresses to Shiprocket — courier pickup locations are auto-registered. No manual Shiprocket dashboard work needed."
      />

      {/* Stats Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 flex items-center gap-3 border-l-4 border-l-primary">
          <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
            <Building2 size={20} />
          </div>
          <div>
            <p className="text-2xl font-black text-slate-900">{warehouses.length}</p>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Total Warehouses
            </p>
          </div>
        </Card>
        <Card className="p-4 flex items-center gap-3 border-l-4 border-l-emerald-500">
          <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 size={20} />
          </div>
          <div>
            <p className="text-2xl font-black text-emerald-700">{syncedCount}</p>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Synced to Shiprocket
            </p>
          </div>
        </Card>
        <Card className="p-4 flex items-center gap-3 border-l-4 border-l-amber-500">
          <div className="h-10 w-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <AlertTriangle size={20} />
          </div>
          <div>
            <p className="text-2xl font-black text-amber-700">{unsyncedCount}</p>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Pending Sync
            </p>
          </div>
        </Card>
      </div>

      {/* Warehouse Sync Status Cards */}
      <div>
        <h2 className="text-sm font-black text-slate-700 mb-3 flex items-center gap-2">
          <MapPin size={16} className="text-primary" />
          Warehouse Pickup Sync Status
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {warehouses.map((wh) => (
            <Card
              key={wh.id}
              className={`p-5 relative overflow-hidden transition-all hover:shadow-lg ${
                wh.shiprocketPickupSynced
                  ? "border-l-4 border-l-emerald-500"
                  : "border-l-4 border-l-amber-400"
              }`}
            >
              {/* Background accent */}
              <div
                className={`absolute top-0 right-0 w-24 h-24 rounded-full blur-3xl opacity-20 ${
                  wh.shiprocketPickupSynced ? "bg-emerald-400" : "bg-amber-400"
                }`}
              />

              <div className="relative space-y-3">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`h-9 w-9 rounded-xl flex items-center justify-center font-bold text-sm ${
                        wh.shiprocketPickupSynced
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      <Building2 size={18} />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">
                        {wh.warehouseName}
                      </h3>
                      <p className="text-[10px] text-slate-400 font-semibold">
                        {wh.city}, {wh.state} — {wh.pincode}
                      </p>
                    </div>
                  </div>
                  <Badge
                    variant={wh.shiprocketPickupSynced ? "success" : "warning"}
                  >
                    {wh.shiprocketPickupSynced ? "✅ Synced" : "⚠️ Not Synced"}
                  </Badge>
                </div>

                {/* Address Preview */}
                <div className="bg-slate-50 rounded-xl p-3 text-xs space-y-1.5">
                  <div className="flex items-start gap-2">
                    <MapPin size={13} className="text-slate-400 mt-0.5 shrink-0" />
                    <span className="text-slate-600">{wh.address || "No address set"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone size={13} className="text-slate-400 shrink-0" />
                    <span className="text-slate-600">{wh.phone || "—"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail size={13} className="text-slate-400 shrink-0" />
                    <span className="text-slate-600">{wh.email || "—"}</span>
                  </div>
                </div>

                {/* Shiprocket Pickup Location Info (if synced) */}
                {wh.shiprocketPickupSynced && wh.shiprocketPickupLocation && (
                  <div className="flex items-center gap-2 bg-emerald-50 rounded-lg px-3 py-2">
                    <Truck size={14} className="text-emerald-600" />
                    <span className="text-xs font-semibold text-emerald-700">
                      Shiprocket Pickup:
                    </span>
                    <code className="text-xs font-mono font-bold text-emerald-900 bg-emerald-100 px-2 py-0.5 rounded">
                      {wh.shiprocketPickupLocation}
                    </code>
                  </div>
                )}

                {/* Action Button */}
                <button
                  onClick={() => openSyncForm(wh)}
                  className={`w-full py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                    wh.shiprocketPickupSynced
                      ? "bg-slate-100 hover:bg-slate-200 text-slate-700"
                      : "bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20"
                  }`}
                >
                  {wh.shiprocketPickupSynced ? (
                    <>
                      <RefreshCw size={14} /> Re-Sync Address
                    </>
                  ) : (
                    <>
                      <Upload size={14} /> Sync to Shiprocket
                    </>
                  )}
                </button>
              </div>
            </Card>
          ))}

          {warehouses.length === 0 && (
            <Card className="p-8 col-span-2 text-center">
              <Building2 size={32} className="text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 font-semibold text-sm">
                No active warehouses found. Add warehouses first.
              </p>
            </Card>
          )}
        </div>
      </div>

      {/* Shiprocket Registered Locations Table */}
      <div>
        <h2 className="text-sm font-black text-slate-700 mb-3 flex items-center gap-2">
          <Globe size={16} className="text-purple-600" />
          Shiprocket Registered Pickup Locations
          <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full ml-1">
            {shiprocketLocations.length} registered
          </span>
        </h2>

        <Card className="overflow-hidden">
          {shiprocketLocations.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="text-left px-4 py-3 font-bold text-slate-500 uppercase tracking-wider text-[10px]">
                      Pickup Nickname
                    </th>
                    <th className="text-left px-4 py-3 font-bold text-slate-500 uppercase tracking-wider text-[10px]">
                      Address
                    </th>
                    <th className="text-left px-4 py-3 font-bold text-slate-500 uppercase tracking-wider text-[10px]">
                      City
                    </th>
                    <th className="text-left px-4 py-3 font-bold text-slate-500 uppercase tracking-wider text-[10px]">
                      State
                    </th>
                    <th className="text-left px-4 py-3 font-bold text-slate-500 uppercase tracking-wider text-[10px]">
                      PIN Code
                    </th>
                    <th className="text-left px-4 py-3 font-bold text-slate-500 uppercase tracking-wider text-[10px]">
                      Phone
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {shiprocketLocations.map((loc, idx) => (
                    <tr
                      key={loc.id || loc.pickup_location || idx}
                      className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <code className="font-mono font-bold text-primary bg-primary/5 px-2 py-0.5 rounded text-[11px]">
                          {loc.pickup_location || loc.name || "—"}
                        </code>
                      </td>
                      <td className="px-4 py-3 text-slate-600 max-w-[200px] truncate">
                        {loc.address || "—"}
                        {loc.address_2 ? `, ${loc.address_2}` : ""}
                      </td>
                      <td className="px-4 py-3 text-slate-700 font-semibold">
                        {loc.city || "—"}
                      </td>
                      <td className="px-4 py-3 text-slate-600">{loc.state || "—"}</td>
                      <td className="px-4 py-3 font-mono font-semibold text-slate-700">
                        {loc.pin_code || "—"}
                      </td>
                      <td className="px-4 py-3 text-slate-600">{loc.phone || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8 text-center">
              <Navigation size={28} className="text-slate-300 mx-auto mb-2" />
              <p className="text-slate-500 font-semibold text-xs">
                No pickup locations registered on Shiprocket yet. Sync a warehouse above to get started.
              </p>
            </div>
          )}
        </Card>
      </div>

      {/* Sync / Edit Form Modal */}
      {showForm && selectedWarehouse && (
        <Modal
          isOpen={showForm}
          onClose={() => {
            setShowForm(false);
            setSelectedWarehouse(null);
          }}
          title={`${selectedWarehouse.shiprocketPickupSynced ? "Re-Sync" : "Sync"} — ${selectedWarehouse.warehouseName}`}
          size="lg"
        >
          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            {/* Info Banner */}
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-xs text-blue-700 font-medium flex items-start gap-2">
              <Truck size={16} className="text-blue-500 mt-0.5 shrink-0" />
              <div>
                <strong>Shiprocket Format:</strong> Fields below match exactly what Shiprocket requires.
                Values are pre-filled from warehouse details — review and submit.
              </div>
            </div>

            {/* Pickup Location Nickname */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1 flex items-center gap-1">
                <Hash size={12} className="text-slate-400" />
                Pickup Location Nickname
                <span className="text-red-500">*</span>
                <span className="text-[10px] text-slate-400 font-normal ml-1">(max 36 chars, no spaces)</span>
              </label>
              <input
                type="text"
                value={formData.pickup_location}
                onChange={handleChange("pickup_location")}
                className="ds-input w-full font-mono uppercase"
                placeholder="e.g. INDORE_HUB_PRIMARY"
                maxLength={36}
                required
              />
            </div>

            {/* Contact Row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Contact Person <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={handleChange("name")}
                  className="ds-input w-full"
                  placeholder="Manager Name"
                  required
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={handleChange("email")}
                  className="ds-input w-full"
                  placeholder="email@example.com"
                  required
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Phone (10 digits) <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={handleChange("phone")}
                  className="ds-input w-full"
                  placeholder="9876543210"
                  maxLength={10}
                  required
                />
              </div>
            </div>

            {/* Address Row */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Address Line 1 <span className="text-red-500">*</span>
                <span className="text-[10px] text-slate-400 font-normal ml-1">(max 80 chars)</span>
              </label>
              <input
                type="text"
                value={formData.address}
                onChange={handleChange("address")}
                className="ds-input w-full"
                placeholder="Plot No. 12, Industrial Area"
                maxLength={80}
                required
              />
              <p className="text-[10px] text-slate-400 mt-0.5 text-right">
                {formData.address.length}/80
              </p>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Address Line 2
                <span className="text-[10px] text-slate-400 font-normal ml-1">(optional, locality/landmark)</span>
              </label>
              <input
                type="text"
                value={formData.address_2}
                onChange={handleChange("address_2")}
                className="ds-input w-full"
                placeholder="Near Main Road, Sector 5"
                maxLength={80}
              />
            </div>

            {/* City / State / Pincode */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  City <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={handleChange("city")}
                  className="ds-input w-full"
                  placeholder="Indore"
                  required
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  State <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.state}
                  onChange={handleChange("state")}
                  className="ds-input w-full"
                  placeholder="Madhya Pradesh"
                  required
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  PIN Code (6 digits) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.pin_code}
                  onChange={handleChange("pin_code")}
                  className="ds-input w-full font-mono"
                  placeholder="452001"
                  maxLength={6}
                  required
                />
              </div>
            </div>

            {/* Country (read-only) */}
            <div className="bg-slate-50 rounded-xl p-3 flex items-center gap-2 text-xs text-slate-500">
              <Globe size={14} className="text-slate-400" />
              <span className="font-semibold">Country:</span>
              <span className="font-bold text-slate-700">India</span>
              <span className="text-[10px] text-slate-400">(Shiprocket India only)</span>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setSelectedWarehouse(null);
                }}
                className="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-600 font-bold text-xs hover:bg-slate-200 transition-colors"
                disabled={syncing}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={syncing}
                className="px-5 py-2.5 rounded-xl bg-primary text-white font-bold text-xs hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 flex items-center gap-2 disabled:opacity-50"
              >
                {syncing ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" />
                    Syncing...
                  </>
                ) : (
                  <>
                    <Upload size={14} />
                    {selectedWarehouse?.shiprocketPickupSynced
                      ? "Re-Sync to Shiprocket"
                      : "Sync to Shiprocket"}
                  </>
                )}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default PickupAddresses;
