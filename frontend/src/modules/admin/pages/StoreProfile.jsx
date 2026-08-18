import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  User,
  Mail,
  Phone,
  Store,
  Shield,
  Edit2,
  Save,
  X,
  Rocket,
  Globe,
  MapPin,
  CheckCircle,
} from "lucide-react";
import { adminApi } from "../services/adminApi";
import { toast } from "sonner";
import Card from "@shared/components/ui/Card";
import Button from "@shared/components/ui/Button";
import MapPicker from "../../../shared/components/MapPicker";

const StoreProfile = () => {
  const [profile, setProfile] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    shopName: "",
    phone: "",
    email: "",
    address: "",
    locality: "",
    pincode: "",
    city: "",
    state: "",
    lat: 23.0225,
    lng: 72.5714,
    radius: 5,
  });

  const fetchProfile = async () => {
    try {
      const res = await adminApi.getStoreProfile();
      if (res.data.success) {
        const data = res.data.result || {};
        setProfile(data);
        setFormData({
          name: data.name || "",
          shopName: data.shopName || "",
          phone: data.phone || "",
          email: data.email || "",
          address: data.address || "",
          locality: data.locality || "",
          pincode: data.pincode || "",
          city: data.city || "",
          state: data.state || "",
          lat: data.location?.coordinates?.[1] || 23.0225,
          lng: data.location?.coordinates?.[0] || 72.5714,
          radius: data.serviceRadius || 5,
        });
      }
    } catch (error) {
      toast.error("Failed to load store profile details");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "phone") {
      const digitsOnly = value.replace(/\D/g, "").slice(0, 10);
      setFormData({ ...formData, [name]: digitsOnly });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSave = async () => {
    if (!/^[0-9]{10}$/.test(formData.phone)) {
      toast.error("Please enter a valid 10-digit phone number.");
      return;
    }
    setIsSaving(true);
    try {
      const payload = {
        ...formData,
        lat: formData.lat,
        lng: formData.lng,
        radius: formData.radius,
      };
      await adminApi.updateStoreProfile(payload);
      toast.success("Store details updated successfully");
      setIsEditing(false);
      fetchProfile();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update store profile");
    } finally {
      setIsSaving(false);
    }
  };

  const toggleStatus = async () => {
    try {
      const newStatus = !profile.isActive;
      await adminApi.updateStoreProfile({ isActive: newStatus });
      setProfile((prev) => ({ ...prev, isActive: newStatus }));
      toast.success(`Store is now ${newStatus ? "Open & Accepting Orders" : "Closed"}`);
    } catch (error) {
      toast.error("Failed to update store status");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-8 font-['Outfit'] pb-16">
      {/* Banner */}
      <div className="relative mb-20">
        <div className="bg-slate-950 h-48 rounded-2xl shadow-xl relative overflow-hidden flex items-center justify-between px-8">
          <div>
            <span className="px-3 py-1 bg-white/10 text-white text-[9px] font-bold uppercase tracking-wider rounded-full border border-white/10">
              Store Profile
            </span>
            <h2 className="text-white text-2xl font-black mt-2">{profile?.shopName || "My Store"}</h2>
            <p className="text-slate-400 text-xs mt-1">Manage single-store settings, locations, and operational hours.</p>
          </div>
          <button
            onClick={toggleStatus}
            className={`flex items-center gap-2 px-5 py-2.5 text-xs font-black uppercase tracking-widest rounded-xl border transition-all hover:scale-105 active:scale-95 ${
              profile?.isActive
                ? "bg-emerald-500 text-white border-emerald-400 shadow-md shadow-emerald-500/20"
                : "bg-rose-500 text-white border-rose-400 shadow-md shadow-rose-500/20"
            }`}
          >
            {profile?.isActive ? "Store Open" : "Store Closed"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Side General info */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6 border-none ring-1 ring-slate-100 bg-white">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
              <h3 className="text-sm font-black uppercase tracking-wider text-slate-800 flex items-center gap-2">
                <Store className="h-5 w-5 text-slate-400" />
                Store Information
              </h3>
              {!isEditing ? (
                <Button onClick={() => setIsEditing(true)} size="sm" variant="outline" className="flex items-center gap-1 text-xs">
                  <Edit2 className="h-3 w-3" /> Edit Profile
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button onClick={() => setIsEditing(false)} size="sm" variant="ghost" className="text-xs">
                    Cancel
                  </Button>
                  <Button onClick={handleSave} size="sm" className="flex items-center gap-1 text-xs" disabled={isSaving}>
                    <Save className="h-3 w-3" /> Save Changes
                  </Button>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Store Title / Shop Name</label>
                <input
                  name="shopName"
                  value={formData.shopName}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className="w-full px-4 py-2.5 bg-slate-50 border-none rounded-xl text-sm font-semibold outline-none disabled:opacity-75 focus:ring-2 focus:ring-slate-900/5"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Owner / Manager Name</label>
                <input
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className="w-full px-4 py-2.5 bg-slate-50 border-none rounded-xl text-sm font-semibold outline-none disabled:opacity-75 focus:ring-2 focus:ring-slate-900/5"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-slate-400 flex items-center gap-1">
                  <Phone className="h-3.5 w-3.5" /> Contact Phone
                </label>
                <input
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className="w-full px-4 py-2.5 bg-slate-50 border-none rounded-xl text-sm font-mono font-bold outline-none disabled:opacity-75 focus:ring-2 focus:ring-slate-900/5"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-slate-400 flex items-center gap-1">
                  <Mail className="h-3.5 w-3.5" /> Support Email
                </label>
                <input
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className="w-full px-4 py-2.5 bg-slate-50 border-none rounded-xl text-sm font-semibold outline-none disabled:opacity-75 focus:ring-2 focus:ring-slate-900/5"
                />
              </div>
            </div>
          </Card>

          {/* Address Details */}
          <Card className="p-6 border-none ring-1 ring-slate-100 bg-white">
            <h3 className="text-sm font-black uppercase tracking-wider text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-4 mb-6">
              <MapPin className="h-5 w-5 text-slate-400" />
              Store Address & Pincode
            </h3>
            <div className="grid grid-cols-1 gap-6">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Full Address</label>
                <input
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className="w-full px-4 py-2.5 bg-slate-50 border-none rounded-xl text-sm font-semibold outline-none disabled:opacity-75 focus:ring-2 focus:ring-slate-900/5"
                />
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Locality</label>
                  <input
                    name="locality"
                    value={formData.locality}
                    onChange={handleChange}
                    disabled={!isEditing}
                    className="w-full px-4 py-2.5 bg-slate-50 border-none rounded-xl text-xs font-semibold outline-none disabled:opacity-75"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">City</label>
                  <input
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    disabled={!isEditing}
                    className="w-full px-4 py-2.5 bg-slate-50 border-none rounded-xl text-xs font-semibold outline-none disabled:opacity-75"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">State</label>
                  <input
                    name="state"
                    value={formData.state}
                    onChange={handleChange}
                    disabled={!isEditing}
                    className="w-full px-4 py-2.5 bg-slate-50 border-none rounded-xl text-xs font-semibold outline-none disabled:opacity-75"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Pincode</label>
                  <input
                    name="pincode"
                    value={formData.pincode}
                    onChange={handleChange}
                    disabled={!isEditing}
                    className="w-full px-4 py-2.5 bg-slate-50 border-none rounded-xl text-xs font-mono font-bold outline-none disabled:opacity-75"
                  />
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Side Map location */}
        <div className="space-y-6">
          <Card className="p-6 border-none ring-1 ring-slate-100 bg-white">
            <h3 className="text-sm font-black uppercase tracking-wider text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-4 mb-4">
              <Globe className="h-5 w-5 text-slate-400" />
              Geofence Area
            </h3>
            <div className="space-y-3">
              <div className="p-4 bg-slate-50 rounded-2xl flex justify-between items-center">
                <div>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Service Radius</p>
                  <p className="text-sm font-bold text-slate-900">{formData.radius} Kilometers</p>
                </div>
                {isEditing && (
                  <input
                    type="range"
                    min="1"
                    max="100"
                    name="radius"
                    value={formData.radius}
                    onChange={handleChange}
                    className="w-24 accent-slate-900"
                  />
                )}
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl">
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Coordinates</p>
                <p className="text-xs font-mono font-bold text-slate-700 mt-1">
                  LAT: {Number(formData.lat).toFixed(6)} | LNG: {Number(formData.lng).toFixed(6)}
                </p>
              </div>

              {isEditing && (
                <button
                  type="button"
                  onClick={() => setIsMapOpen(true)}
                  className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-800 transition-colors"
                >
                  Configure Pin on Map
                </button>
              )}
            </div>
          </Card>

          <Card className="p-6 border-none ring-1 ring-slate-100 bg-emerald-50/50">
            <div className="flex gap-3">
              <CheckCircle className="h-6 w-6 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-800">Verification Active</h4>
                <p className="text-[11px] font-semibold text-emerald-700/80 mt-1">
                  GSTIN: {profile?.documents?.gstCertificate ? "Document verified" : "Pending Document"}
                </p>
                <p className="text-[11px] font-semibold text-emerald-700/80 mt-0.5">
                  PAN: {profile?.documents?.idProof ? "Document verified" : "Pending ID Proof"}
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {isMapOpen && (
        <MapPicker
          isOpen={isMapOpen}
          onClose={() => setIsMapOpen(false)}
          onConfirm={(loc) => {
            setFormData((prev) => ({
              ...prev,
              lat: loc.lat,
              lng: loc.lng,
              radius: loc.radius || prev.radius,
              address: loc.address || prev.address,
              locality: loc.locality || prev.locality,
              city: loc.city || prev.city,
              state: loc.state || prev.state,
              pincode: loc.pincode || prev.pincode,
            }));
            setIsMapOpen(false);
          }}
          initialLocation={
            formData.lat ? { lat: formData.lat, lng: formData.lng } : null
          }
          initialRadius={formData.radius}
        />
      )}
    </div>
  );
};

export default StoreProfile;
