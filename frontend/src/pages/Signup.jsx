import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserRole } from '@core/constants/roles';
import { X } from 'lucide-react';

const Signup = () => {
    const navigate = useNavigate();
    const [role, setRole] = useState(UserRole.CUSTOMER);

    const handleClose = () => {
        if (window.history.length > 1) {
            navigate(-1);
        } else {
            navigate('/', { replace: true });
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        // In a real app, this would call an API
        navigate('/login');
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
            <div className="w-full max-w-md space-y-6 rounded-2xl bg-white p-8 shadow-lg border border-gray-100 relative">
                {/* Header Close Cross */}
                <div className="flex items-center justify-end">
                    <button
                        type="button"
                        onClick={handleClose}
                        className="p-2 text-gray-400 hover:text-gray-800 bg-gray-100 hover:bg-gray-200 rounded-full transition-all cursor-pointer"
                        title="Close"
                    >
                        <X size={18} />
                    </button>
                </div>

                <div>
                    <h2 className="text-center text-2xl font-extrabold text-gray-900 leading-9">
                        Create Account
                    </h2>
                    <p className="mt-1 text-center text-sm text-gray-600">
                        Join Quick Commerce today
                    </p>
                </div>
                <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1">Full Name</label>
                            <input
                                type="text"
                                required
                                placeholder="John Doe"
                                className="block w-full rounded-xl border border-gray-200 px-4 py-3.5 text-gray-900 placeholder-gray-400 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 sm:text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1">Email Address</label>
                            <input
                                type="email"
                                required
                                placeholder="user@example.com"
                                className="block w-full rounded-xl border border-gray-200 px-4 py-3.5 text-gray-900 placeholder-gray-400 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 sm:text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1">Password</label>
                            <input
                                type="password"
                                required
                                placeholder="••••••••"
                                className="block w-full rounded-xl border border-gray-200 px-4 py-3.5 text-gray-900 placeholder-gray-400 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 sm:text-sm"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1">Join as</label>
                            <select
                                className="block w-full rounded-xl border border-gray-200 px-4 py-3.5 text-gray-900 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 sm:text-sm bg-white"
                                value={role}
                                onChange={(e) => setRole(e.target.value)}
                            >
                                <option value={UserRole.CUSTOMER}>Customer</option>
                                <option value={UserRole.SELLER}>Seller</option>
                                <option value={UserRole.DELIVERY}>Delivery Partner</option>
                            </select>
                        </div>
                    </div>

                    <div className="pt-2">
                        <button
                            type="submit"
                            className="flex w-full justify-center rounded-xl bg-[#f97316] px-4 py-3.5 text-sm font-semibold text-white shadow-sm hover:bg-orange-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-600 cursor-pointer transition-all"
                        >
                            Sign Up
                        </button>
                    </div>

                    <div className="text-center">
                        <p className="text-sm text-gray-600">
                            Already have an account?{' '}
                            <span className="cursor-pointer font-medium text-orange-600 hover:text-orange-500" onClick={() => navigate('/login')}>
                                Sign in
                            </span>
                        </p>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Signup;

