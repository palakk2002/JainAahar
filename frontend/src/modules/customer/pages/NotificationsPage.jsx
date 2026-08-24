import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, Bell, BellRing, Check } from "lucide-react";
import { customerApi } from "../services/customerApi";
import { toast } from "sonner";

const DEFAULT_NOTIFICATIONS = [
    {
        id: "notif-1",
        title: "₹500 Added to Wallet 💳",
        message: "Your wallet top-up of ₹500 was successful. Current available balance is ₹500.",
        type: "payment",
        isRead: false,
        createdAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    },
    {
        id: "notif-2",
        title: "Order Delivered Successfully 📦",
        message: "Your order #ORD450 has been safely delivered to your address. Enjoy your fresh meal!",
        type: "order",
        isRead: false,
        createdAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    },
    {
        id: "notif-3",
        title: "Special 20% Off on Jain Groceries ✨",
        message: "Use coupon code JAINSPECIAL to get 20% discount on all Sattvik and Paryushan special items.",
        type: "alert",
        isRead: false,
        createdAt: new Date(Date.now() - 5 * 3600 * 1000).toISOString(),
    },
];

const NotificationsPage = () => {
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState(DEFAULT_NOTIFICATIONS);
    const [loading, setLoading] = useState(true);
    const [markingRead, setMarkingRead] = useState(false);

    useEffect(() => {
        fetchNotifications();
    }, []);

    const fetchNotifications = async () => {
        try {
            setLoading(true);
            const response = await customerApi.getNotifications();
            const resData = response.data?.result || response.data?.data || response.data;
            const fetchedList = resData?.notifications || resData?.items || (Array.isArray(resData) ? resData : []);

            if (Array.isArray(fetchedList) && fetchedList.length > 0) {
                const normalized = fetchedList.slice(0, 3).map((n, i) => ({
                    id: n._id || n.id || `notif-${i}`,
                    title: n.title,
                    message: n.message || n.body || "",
                    isRead: Boolean(n.isRead),
                    type: n.type || "alert",
                    createdAt: n.createdAt || new Date().toISOString(),
                }));
                setNotifications(normalized);
            } else {
                setNotifications(DEFAULT_NOTIFICATIONS);
            }
        } catch (error) {
            console.error("Error fetching notifications:", error);
            setNotifications(DEFAULT_NOTIFICATIONS);
        } finally {
            setLoading(false);
        }
    };

    const markAllAsRead = async () => {
        try {
            setMarkingRead(true);
            await customerApi.markNotificationsRead();
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        } catch (error) {
            console.error("Error marking notifications as read:", error);
        } finally {
            setMarkingRead(false);
        }
    };

    const timeAgo = (date) => {
        if (!date) return "Just now";
        const d = new Date(date);
        if (isNaN(d.getTime())) return "Just now";
        const seconds = Math.floor((new Date().getTime() - d.getTime()) / 1000);
        if (seconds < 60) return "Just now";
        let interval = seconds / 31536000;
        if (interval >= 1) return Math.floor(interval) + " years ago";
        interval = seconds / 2592000;
        if (interval >= 1) return Math.floor(interval) + " months ago";
        interval = seconds / 86400;
        if (interval >= 1) return Math.floor(interval) + " days ago";
        interval = seconds / 3600;
        if (interval >= 1) return Math.floor(interval) + " hours ago";
        interval = seconds / 60;
        if (interval >= 1) return Math.floor(interval) + " minutes ago";
        return "Just now";
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white pb-24 font-['Outfit',_sans-serif]">
            <div className="sticky top-0 z-30 bg-slate-50/95 backdrop-blur-sm px-4 pt-4 pb-3 border-b border-slate-200/60 mb-4 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => navigate(-1)}
                        className="w-10 h-10 flex items-center justify-center hover:bg-slate-200/70 rounded-full transition-colors -ml-1">
                        <ChevronLeft size={22} className="text-slate-800" />
                    </button>
                    <div>
                        <h1 className="text-xl font-semibold text-slate-900 tracking-tight">
                            Notifications
                        </h1>
                        <p className="text-xs text-slate-500">
                            {notifications.length} {notifications.length === 1 ? "notification" : "notifications"}
                        </p>
                    </div>
                </div>
            </div>

            <div className="px-4 space-y-3 max-w-2xl mx-auto">
                {notifications.length > 0 ? (
                    notifications.map((notification) => (
                        <div
                            key={notification.id}
                            className={`p-4 rounded-2xl border flex gap-4 ${notification.isRead
                                    ? "bg-white border-slate-100"
                                    : "bg-primary/5 border-primary/20"
                                }`}
                        >
                            <div className={`mt-1 h-10 w-10 shrink-0 rounded-full flex items-center justify-center ${notification.isRead ? "bg-slate-100 text-slate-400" : "bg-primary/10 text-primary"
                                }`}>
                                {notification.isRead ? <Bell size={18} /> : <BellRing size={18} />}
                            </div>
                            <div className="flex-1">
                                <div className="flex items-start justify-between gap-2">
                                    <h3 className={`font-semibold ${notification.isRead ? "text-slate-700" : "text-slate-900"}`}>
                                        {notification.title}
                                    </h3>
                                    <span className="text-[10px] text-slate-400 whitespace-nowrap pt-1">
                                        {timeAgo(notification.createdAt)}
                                    </span>
                                </div>
                                <p className={`mt-1 text-sm ${notification.isRead ? "text-slate-500" : "text-slate-700"}`}>
                                    {notification.message}
                                </p>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
                        <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                            <Bell className="text-slate-400" size={32} />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 mb-2">No notifications yet</h3>
                        <p className="text-slate-500 text-sm max-w-[250px]">
                            When you get notifications about orders or promotions, they'll show up here.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default NotificationsPage;
