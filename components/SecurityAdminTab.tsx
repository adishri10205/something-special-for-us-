import React, { useEffect, useState } from 'react';
import { db } from '../src/firebaseConfig';
import { ref, onValue, query, limitToLast } from 'firebase/database';
import { useSecurity } from '../context/SecurityContext'; // Root context
import { SecurityLog, WhitelistedIP, UserActivity } from '../types'; // Root types
import { Shield, Activity, Users, Lock, Unlock, AlertTriangle, FileText, CheckCircle, XCircle, Trash2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext'; // Root context

const SecurityAdminTab: React.FC = () => {
    const { logEvent, addToWhitelist, removeFromWhitelist, whitelistedIPs } = useSecurity();
    const { banCurrentDevice } = useAuth();

    const [logs, setLogs] = useState<SecurityLog[]>([]);
    const [activeUsers, setActiveUsers] = useState<{ uid: string, data: UserActivity }[]>([]);
    const [bannedIPs, setBannedIPs] = useState<{ key: string, ip: string, reason: string }[]>([]);

    // Forms
    const [newWhitelistIP, setNewWhitelistIP] = useState('');
    const [newWhitelistLabel, setNewWhitelistLabel] = useState('');

    // 1. Fetch Logs
    useEffect(() => {
        const logsRef = query(ref(db, 'security_logs'), limitToLast(50));
        const unsub = onValue(logsRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                const list = Object.keys(data).map(k => ({ ...data[k], id: k })).reverse();
                setLogs(list as SecurityLog[]);
            } else {
                setLogs([]);
            }
        });

        // 2. Fetch Active Users
        const usersRef = ref(db, 'user_activity');
        const unsubUsers = onValue(usersRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                const list = Object.keys(data).map(k => ({ uid: k, data: data[k] }));
                setActiveUsers(list.filter(u => u.data.isOnline || (new Date(u.data.lastSeen).getTime() > Date.now() - 1000 * 60 * 5)));
            }
        });

        // 3. Fetch Banned IPs
        const banRef = ref(db, 'banned_ips');
        const unsubBans = onValue(banRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                setBannedIPs(Object.keys(data).map(k => ({ key: k, ...data[k] })));
            } else {
                setBannedIPs([]);
            }
        });

        return () => { unsub(); unsubUsers(); unsubBans(); };
    }, []);

    const handleAddWhitelist = async () => {
        if (!newWhitelistIP) return;
        await addToWhitelist(newWhitelistIP, newWhitelistLabel || 'Trusted');
        setNewWhitelistIP('');
        setNewWhitelistLabel('');
    };

    const formatTime = (iso: string) => {
        try { return new Date(iso).toLocaleString(); } catch { return iso; }
    };

    const LiveDuration = ({ startTime }: { startTime: number }) => {
        const [duration, setDuration] = useState<string>('');

        useEffect(() => {
            const update = () => {
                const diff = Date.now() - startTime;
                const secs = Math.floor(diff / 1000);
                const mins = Math.floor(secs / 60);
                const hrs = Math.floor(mins / 60);

                if (hrs > 0) setDuration(`${hrs}h ${mins % 60}m`);
                else if (mins > 0) setDuration(`${mins}m ${secs % 60}s`);
                else setDuration(`${secs}s`);
            };
            update();
            const interval = setInterval(update, 1000);
            return () => clearInterval(interval);
        }, [startTime]);

        return <span>{duration}</span>;
    };

    return (
        <div className="space-y-8">
            {/* Header Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
                    <div className="bg-green-100 p-3 rounded-full text-green-600">
                        <Activity size={24} />
                    </div>
                    <div>
                        <h3 className="text-2xl font-bold text-gray-800">{activeUsers.length}</h3>
                        <p className="text-gray-500 text-sm">Active Sessions</p>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
                    <div className="bg-red-100 p-3 rounded-full text-red-600">
                        <AlertTriangle size={24} />
                    </div>
                    <div>
                        <h3 className="text-2xl font-bold text-gray-800">{bannedIPs.length}</h3>
                        <p className="text-gray-500 text-sm">Banned IPs</p>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
                    <div className="bg-blue-100 p-3 rounded-full text-blue-600">
                        <Shield size={24} />
                    </div>
                    <div>
                        <h3 className="text-2xl font-bold text-gray-800">{whitelistedIPs.length}</h3>
                        <p className="text-gray-500 text-sm">Whitelisted IPs</p>
                    </div>
                </div>
            </div>

            {/* Active Users Monitor */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                    <h3 className="font-bold text-lg text-gray-800 flex items-center gap-2">
                        <Users size={20} className="text-blue-500" /> Live Activity Monitor
                    </h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-bold">
                            <tr>
                                <th className="px-6 py-3">User</th>
                                <th className="px-6 py-3">Status</th>
                                <th className="px-6 py-3">Current Page</th>
                                <th className="px-6 py-3">IP Address</th>
                                <th className="px-6 py-3">Last Seen</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {activeUsers.length === 0 ? (
                                <tr><td colSpan={5} className="p-8 text-center text-gray-400">No active users detected.</td></tr>
                            ) : (
                                activeUsers.map(({ uid, data }) => (
                                    <tr key={uid} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 font-medium text-gray-800 flex items-center gap-2">
                                            <div className={`w-2 h-2 rounded-full ${data.isOnline ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                                            {data.displayName || uid.substring(0, 6)}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded-full text-xs font-bold ${data.isOnline ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                                {data.isOnline ? 'ONLINE' : 'OFFLINE'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-blue-600 font-mono text-xs">{data.currentPath || '/'}</td>
                                        <td className="px-6 py-4 text-gray-500 font-mono text-xs">{data.ip || 'Unknown'}</td>
                                        <td className="px-6 py-4 text-gray-500 text-xs">{formatTime(data.lastSeen)}</td>
                                        <td className="px-6 py-4 text-gray-500 text-xs font-mono">
                                            {data.isOnline ? (
                                                data.lastPageEnter ? (
                                                    <LiveDuration startTime={data.lastPageEnter} />
                                                ) : <span className="text-gray-400 italic">Tracking...</span>
                                            ) : '-'}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Security Logs */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col h-[500px]">
                    <div className="p-6 border-b border-gray-100 bg-gray-50">
                        <h3 className="font-bold text-lg text-gray-800 flex items-center gap-2">
                            <FileText size={20} className="text-gray-500" /> Security Logs
                        </h3>
                        <button
                            onClick={() => {
                                if (confirm("Clear all security logs?")) {
                                    import('firebase/database').then(({ remove, ref }) => {
                                        remove(ref(db, 'security_logs'));
                                    });
                                }
                            }}
                            className="text-xs flex items-center gap-1 text-red-500 hover:bg-red-50 px-2 py-1 rounded transition-colors"
                        >
                            <Trash2 size={14} /> Clear All
                        </button>
                    </div>
                    <div className="overflow-y-auto flex-1 p-4 space-y-3">
                        {logs.map(log => (
                            <div key={log.id} className="text-sm p-3 border rounded-lg flex gap-3 items-start bg-gray-50 hover:bg-white hover:shadow-sm transition-all">
                                <div className={`mt-0.5 ${log.type === 'login_fail' || log.type === 'unauthorized_access' ? 'text-red-500' :
                                    log.type === 'login_success' ? 'text-green-500' : 'text-blue-500'
                                    }`}>
                                    {log.type === 'login_fail' ? <AlertTriangle size={16} /> : <CheckCircle size={16} />}
                                </div>
                                <div className="flex-1">
                                    <div className="flex justify-between">
                                        <span className="font-bold text-gray-700 capitalize">{log.type.replace('_', ' ')}</span>
                                        <span className="text-xs text-gray-400">{formatTime(log.timestamp)}</span>
                                    </div>
                                    <p className="text-gray-600 mt-1">{log.details}</p>
                                    <div className="mt-2 flex gap-4 text-xs text-gray-400 font-mono">
                                        <span>IP: {log.ip}</span>
                                        <span>User: {log.userEmail || 'Anon'}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* IP Management */}
                <div className="space-y-6">
                    {/* Whitelist */}
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                        <h3 className="font-bold text-lg text-gray-800 mb-4 flex items-center gap-2">
                            <Shield size={20} className="text-green-500" /> IP Whitelist
                        </h3>
                        <div className="flex gap-2 mb-4">
                            <input
                                className="flex-1 p-2 border rounded-lg text-sm font-mono"
                                placeholder="1.1.1.1"
                                value={newWhitelistIP}
                                onChange={e => setNewWhitelistIP(e.target.value)}
                            />
                            <input
                                className="w-1/3 p-2 border rounded-lg text-sm"
                                placeholder="Label"
                                value={newWhitelistLabel}
                                onChange={e => setNewWhitelistLabel(e.target.value)}
                            />
                            <button onClick={handleAddWhitelist} className="bg-green-600 text-white px-4 py-2 rounded-lg font-bold text-sm">Add</button>
                        </div>

                        <div className="space-y-2 max-h-60 overflow-y-auto">
                            {whitelistedIPs.map(w => (
                                <div key={w.ip} className="flex justify-between items-center p-2 bg-green-50 rounded text-sm border border-green-100">
                                    <div>
                                        <div className="font-bold text-green-800">{w.label}</div>
                                        <div className="font-mono text-green-600">{w.ip}</div>
                                    </div>
                                    <button onClick={() => removeFromWhitelist(w.ip)} className="text-red-500 hover:bg-red-100 p-1 rounded"><XCircle size={16} /></button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Banned IPs */}
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                        <h3 className="font-bold text-lg text-gray-800 mb-4 flex items-center gap-2">
                            <Lock size={20} className="text-red-500" /> Banned IPs
                        </h3>
                        <div className="space-y-2 max-h-60 overflow-y-auto">
                            {bannedIPs.map(b => (
                                <div key={b.key} className="flex justify-between items-center p-2 bg-red-50 rounded text-sm border border-red-100">
                                    <div>
                                        <div className="font-bold text-red-800">{b.reason}</div>
                                        <div className="font-mono text-red-600">{b.ip}</div>
                                    </div>
                                    {/* Note: Unban logic simplified for speed */}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SecurityAdminTab;
