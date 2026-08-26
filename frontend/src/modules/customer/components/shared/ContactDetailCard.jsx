import React from 'react';
import { User, Mail, Phone } from 'lucide-react';

const ContactDetailCard = ({ className = '', title = 'Official Contact Details' }) => {
    const contactPerson = 'Aahar jain';
    const contactEmail = 'aaharjain@gmail.com';
    const contactPhone = '+91 9806380757';
    const rawPhone = '+919806380757';

    return (
        <div 
            className={`bg-[#ff6a00] text-white rounded-3xl p-5 sm:p-6 shadow-xl border border-[#ff7700] relative overflow-hidden font-['Outfit',_sans-serif] ${className}`}
        >
            {title && (
                <div className="mb-4 pb-2 border-b border-white/20 flex items-center justify-between relative z-10">
                    <span className="text-xs font-black uppercase tracking-widest text-white">
                        {title}
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-white/20 text-white border border-white/30 backdrop-blur-xs">
                        <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                        Verified Business
                    </span>
                </div>
            )}

            <div className="space-y-3 relative z-10">
                {/* Contact Person Box */}
                <div className="bg-black/15 backdrop-blur-xs rounded-2xl p-3.5 border border-white/15 transition-all hover:bg-black/20">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-white/80 block mb-1">
                        CONTACT PERSON
                    </span>
                    <div className="flex items-center gap-2.5 text-white font-bold text-base">
                        <div className="w-7 h-7 rounded-lg bg-white/20 text-white flex items-center justify-center shrink-0">
                            <User size={16} />
                        </div>
                        <span className="font-extrabold">{contactPerson}</span>
                    </div>
                </div>

                {/* Email Us Box */}
                <a
                    href={`mailto:${contactEmail}`}
                    className="block bg-black/15 backdrop-blur-xs rounded-2xl p-3.5 border border-white/15 transition-all hover:bg-black/20 group"
                >
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-white/80 block mb-1">
                        EMAIL US
                    </span>
                    <div className="flex items-center gap-2.5 text-white font-bold text-base group-hover:text-orange-100 transition-colors">
                        <div className="w-7 h-7 rounded-lg bg-white/20 text-white flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                            <Mail size={16} />
                        </div>
                        <span className="break-all font-extrabold">{contactEmail}</span>
                    </div>
                </a>

                {/* Direct Call Button in solid white contrast with orange text */}
                <a
                    href={`tel:${rawPhone}`}
                    className="mt-2 block w-full bg-white hover:bg-orange-50 active:scale-[0.98] text-[#ff6a00] rounded-2xl p-4 shadow-lg border border-white/40 text-center transition-all group"
                >
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#ff6a00]/80 block mb-0.5">
                        DIRECT CALL
                    </span>
                    <div className="flex items-center justify-center gap-2 text-[#ff6a00] font-black text-lg">
                        <Phone size={18} className="group-hover:rotate-12 transition-transform shrink-0 fill-[#ff6a00]" />
                        <span>{contactPhone}</span>
                    </div>
                </a>
            </div>
        </div>
    );
};

export default ContactDetailCard;
