"use client";

import React, { useEffect, useState, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { fetchUsers } from '@/redux/slices/userSlice';
import { 
    Users, 
    Mail, 
    Phone, 
    Calendar, 
    Search, 
    ShieldCheck, 
    MapPin, 
    ShoppingBag, 
    ChevronRight,
    Loader2,
    Filter,
    Activity,
    Lock,
    Unlock,
    MoreVertical
} from 'lucide-react';
import { RootState } from '@/redux/store';
import Link from 'next/link';
import toast from 'react-hot-toast';
import EmptyState from '@/components/admin/EmptyState';

const UserManagement = () => {
    const dispatch = useAppDispatch();
    const { users, loading } = useAppSelector((state: RootState) => state.users);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterRole, setFilterRole] = useState("all");

    useEffect(() => {
        dispatch(fetchUsers());
    }, [dispatch]);

    const filteredUsers = useMemo(() => {
        return users.filter(user => {
            const matchesSearch = 
                user.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                user.email.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesRole = filterRole === "all" || user.role === filterRole;
            return matchesSearch && matchesRole;
        });
    }, [users, searchTerm, filterRole]);

    return (
        <div className="p-6 max-w-[1600px] mx-auto space-y-6 bg-white min-h-screen">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-200 pb-6">
                <div>
                    <h1 className="text-xl font-bold text-zinc-900 tracking-tight">User Management</h1>
                    <p className="text-xs text-zinc-500 font-medium">View and manage registered users and their roles.</p>
                </div>
                <div className="flex items-center gap-4 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                    Total Users: {users.length}
                </div>
            </div>

            {/* Toolbar */}
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between border border-zinc-200 bg-zinc-50/50 p-2 rounded-xl">
                <div className="relative w-full md:w-80">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={14} />
                    <input 
                        type="text" 
                        placeholder="Search users..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-white border border-zinc-200 rounded-lg py-2 pl-9 pr-4 text-xs focus:border-zinc-900 outline-none transition-all placeholder:text-zinc-400"
                    />
                </div>
                <div className="flex bg-white p-1 rounded-lg border border-zinc-200 gap-1">
                    {['all', 'user', 'admin'].map((role) => (
                        <button 
                            key={role}
                            onClick={() => setFilterRole(role)}
                            className={`px-4 py-1.5 rounded-md text-[9px] font-bold uppercase transition-all ${filterRole === role ? 'bg-zinc-900 text-white' : 'text-zinc-400 hover:text-zinc-600'}`}
                        >
                            {role === 'all' ? 'All' : role === 'user' ? 'Users' : 'Admins'}
                        </button>
                    ))}
                </div>
            </div>

            {/* Registry Table */}
            <div className="bg-white border border-zinc-200 rounded-xl shadow-sm overflow-hidden">
                {loading ? (
                    <div className="py-20 flex flex-col items-center gap-3">
                        <Loader2 className="w-6 h-6 animate-spin text-zinc-200" />
                        <p className="text-[10px] uppercase font-bold text-zinc-300 tracking-widest">Loading Users</p>
                    </div>
                ) : filteredUsers.length === 0 ? (
                    <div className="p-10 text-center">
                        <EmptyState 
                            icon={Users}
                            title="No Results"
                            description="No user matched your query."
                        />
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-zinc-50 border-b border-zinc-200 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                                    <th className="px-6 py-4">User</th>
                                    <th className="px-6 py-4">Role</th>
                                    <th className="px-6 py-4">Phone</th>
                                    <th className="px-6 py-4">Joined Date</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-100">
                                {filteredUsers.map((user) => (
                                    <tr key={user._id} className="hover:bg-zinc-50/50 transition-all text-xs">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded bg-zinc-900 flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">
                                                    {user.name[0]}
                                                </div>
                                                <div>
                                                    <div className="font-bold text-zinc-900">{user.name}</div>
                                                    <div className="text-[10px] text-zinc-400 lowercase">{user.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-0.5 rounded border text-[9px] font-bold uppercase ${
                                                user.role === 'admin' ? 'bg-amber-50 text-amber-700 border-amber-100' : 'bg-zinc-100 text-zinc-400 border-zinc-200'
                                            }`}>
                                                {user.role}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-zinc-500 font-mono text-[11px] tabular-nums">
                                            {user.phone || "Not provided"}
                                        </td>
                                        <td className="px-6 py-4 text-zinc-400">
                                            {new Date(user.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <Link 
                                                    href={`/admin/orders?userId=${user._id}`}
                                                    className="p-1.5 rounded hover:bg-zinc-100 text-zinc-400 hover:text-zinc-900 transition-all"
                                                    title="View Orders"
                                                >
                                                    <ShoppingBag size={14} />
                                                </Link>
                                                <button 
                                                    className="p-1.5 rounded hover:bg-zinc-100 text-zinc-400"
                                                    onClick={() => toast.success("Opening profile...")}
                                                >
                                                    <ChevronRight size={14} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default UserManagement;
