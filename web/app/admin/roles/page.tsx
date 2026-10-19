'use client';

import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  UserPlus,
  Mail,
  Lock,
  User,
  Key,
  CheckCircle2,
  AlertCircle,
  X,
  Sparkles,
  BookOpen,
  CreditCard,
  Users,
  GraduationCap,
  Layers,
  Check,
  Ban,
} from 'lucide-react';

interface StaffUser {
  id: string;
  name: string;
  email: string;
  role: 'SUPER_ADMIN' | 'SUB_ADMIN';
  roleTitle: string;
  permissions: {
    overview: boolean;
    syllabus: boolean;
    subscriptions: boolean;
    students: boolean;
    courses: boolean;
    teachers: boolean;
    roles: boolean;
  };
  createdAt: string;
  status: 'ACTIVE' | 'INACTIVE';
}

const PAGE_PERMISSIONS = [
  { key: 'overview', label: 'Founder Overview', path: '/admin', icon: Layers },
  { key: 'syllabus', label: 'RBSE पाठ्यक्रम (Syllabus)', path: '/admin/syllabus', icon: BookOpen },
  { key: 'subscriptions', label: 'Subscriptions & Revenue', path: '/admin/subscriptions', icon: CreditCard },
  { key: 'students', label: 'Student Data & Doubts', path: '/admin/students', icon: Users },
  { key: 'courses', label: 'School Courses & RAG', path: '/admin/courses', icon: Sparkles },
  { key: 'teachers', label: 'AI Teachers & Avatars', path: '/admin/teachers', icon: GraduationCap },
  { key: 'roles', label: 'Role & Staff Management', path: '/admin/roles', icon: ShieldCheck },
];

export default function AdminRolesPage() {
  const [staffList, setStaffList] = useState<StaffUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [roleTitle, setRoleTitle] = useState('Syllabus Manager');
  const [permissions, setPermissions] = useState<Record<string, boolean>>({
    overview: false,
    syllabus: true,
    subscriptions: false,
    students: true,
    courses: true,
    teachers: false,
    roles: false,
  });

  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchStaff = async () => {
    try {
      const res = await fetch('/api/admin/roles');
      const data = await res.json();
      if (data.success) {
        setStaffList(data.users);
      }
    } catch (e) {
      console.error('Failed to fetch staff:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  const togglePermission = (key: string) => {
    setPermissions((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);

    if (!name || !email || !password || !roleTitle) {
      setMsg({ type: 'error', text: 'कृपया सभी अनिवार्य फील्ड भरें।' });
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/admin/roles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          password: password.trim(),
          roleTitle: roleTitle.trim(),
          permissions,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setMsg({ type: 'error', text: data.message || 'स्टाफ बनाने में समस्या आई।' });
        setSaving(false);
        return;
      }

      setMsg({ type: 'success', text: data.message });
      // Reset form
      setName('');
      setEmail('');
      setPassword('');
      await fetchStaff();
      setTimeout(() => {
        setShowModal(false);
        setMsg(null);
      }, 1500);
      setSaving(false);
    } catch (err: any) {
      setMsg({ type: 'error', text: 'सर्वर त्रुटि।' });
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 md:p-8 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-black text-amber-400 bg-amber-500/20 px-3 py-1 rounded-full border border-amber-500/30 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" /> RBAC (Role-Based Access Control)
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black">
            स्टाफ रोल्स एवं पेज परमिशन (Role Management)
          </h1>
          <p className="text-xs text-slate-300 mt-1 max-w-xl leading-relaxed">
            यहाँ से आप नए सब-एडमिन बना सकते हैं, उन्हें ईमेल व पासवर्ड दे सकते हैं और तय कर सकते हैं कि उन्हें कौन-सा पेज देखने की अनुमति है।
          </p>
        </div>

        <button
          onClick={() => {
            setMsg(null);
            setShowModal(true);
          }}
          className="px-5 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs shadow-lg shadow-indigo-600/30 flex items-center gap-2 transition-all whitespace-nowrap"
        >
          <UserPlus className="w-4 h-4" />
          <span>+ नया स्टाफ / रोल जोड़ें</span>
        </button>
      </div>

      {/* Staff Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="font-extrabold text-slate-900 text-base">सक्रिय स्टाफ एवं सब-एडमिन</h2>
            <p className="text-xs text-slate-500">
              कुल {staffList.length} अधिकृत एडमिन सदस्य
            </p>
          </div>
          <span className="text-xs bg-indigo-50 text-indigo-700 font-bold px-3 py-1 rounded-full border border-indigo-200">
            Founder: Super Admin
          </span>
        </div>

        {loading ? (
          <div className="p-8 text-center text-xs text-slate-400">स्टाफ सूची लोड हो रही है...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100">
                <tr>
                  <th className="py-3 px-5">नाम और ईमेल</th>
                  <th className="py-3 px-5">रोल (Role Title)</th>
                  <th className="py-3 px-5">प्रकार</th>
                  <th className="py-3 px-5">अनुमतियां (Page Permissions)</th>
                  <th className="py-3 px-5">स्थिति</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {staffList.map((user) => {
                  const isSuper = user.role === 'SUPER_ADMIN';
                  return (
                    <tr key={user.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-4 px-5">
                        <div className="font-bold text-slate-900 text-sm">{user.name}</div>
                        <div className="text-slate-500 text-[11px] font-mono">{user.email}</div>
                      </td>
                      <td className="py-4 px-5">
                        <span className="font-bold text-slate-800 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
                          {user.roleTitle}
                        </span>
                      </td>
                      <td className="py-4 px-5">
                        {isSuper ? (
                          <span className="inline-flex items-center gap-1 font-black text-amber-700 bg-amber-100 px-2.5 py-0.5 rounded-full text-[10px]">
                            ⚡ Full Access
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 font-bold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full text-[10px]">
                            Custom Access
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-5 max-w-md">
                        <div className="flex flex-wrap gap-1.5">
                          {isSuper ? (
                            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                              सभी पेज की अनुमति है ✓
                            </span>
                          ) : (
                            PAGE_PERMISSIONS.map((perm) => {
                              const hasAccess = (user.permissions as any)?.[perm.key];
                              if (!hasAccess) return null;
                              return (
                                <span
                                  key={perm.key}
                                  className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center gap-1"
                                >
                                  <Check className="w-2.5 h-2.5" />
                                  {perm.label.split('(')[0]}
                                </span>
                              );
                            })
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-5">
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100/70 px-2.5 py-0.5 rounded-full">
                          ● सक्रिय (Active)
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Create Staff / Sub-Admin */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-2xl relative border border-slate-100 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-700"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-11 h-11 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center">
                <UserPlus className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 text-lg">नया स्टाफ / सब-एडमिन जोड़ें</h3>
                <p className="text-xs text-slate-500">
                  ईमेल, पासवर्ड और विशिष्ट पेजों की अनुमति निर्धारित करें
                </p>
              </div>
            </div>

            {msg && (
              <div
                className={`mb-4 p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                  msg.type === 'success'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-rose-50 text-rose-700 border border-rose-200'
                }`}
              >
                {msg.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                )}
                <span>{msg.text}</span>
              </div>
            )}

            <form onSubmit={handleCreateStaff} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  स्टाफ का नाम (Full Name) *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="उदा. राहुल सैनी"
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  लॉगिन ईमेल आईडी *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="rahul@aituition.com"
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    लॉगिन पासवर्ड *
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="स्टाफ पासवर्ड"
                      className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    पद / रोल का नाम (Title) *
                  </label>
                  <input
                    type="text"
                    required
                    value={roleTitle}
                    onChange={(e) => setRoleTitle(e.target.value)}
                    placeholder="उदा. Syllabus Specialist"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Page Permissions Checklist */}
              <div className="pt-2">
                <label className="block text-xs font-black text-slate-900 mb-2">
                  पेज अनुमतियां चुनें (Select Page Permissions):
                </label>
                <div className="space-y-2 bg-slate-50 p-3 rounded-2xl border border-slate-200">
                  {PAGE_PERMISSIONS.map((perm) => {
                    const isChecked = Boolean(permissions[perm.key]);
                    const Icon = perm.icon;
                    return (
                      <label
                        key={perm.key}
                        onClick={() => togglePermission(perm.key)}
                        className={`flex items-center justify-between p-2 rounded-xl cursor-pointer text-xs font-semibold transition-all ${
                          isChecked
                            ? 'bg-indigo-600 text-white shadow-sm'
                            : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <Icon className={`w-4 h-4 ${isChecked ? 'text-white' : 'text-slate-500'}`} />
                          <span>{perm.label}</span>
                        </div>
                        <div
                          className={`w-5 h-5 rounded-md flex items-center justify-center border ${
                            isChecked
                              ? 'bg-white text-indigo-600 border-white font-black'
                              : 'border-slate-300'
                          }`}
                        >
                          {isChecked && <Check className="w-3.5 h-3.5" />}
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="flex gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="w-1/3 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
                >
                  रद्द करें
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-50"
                >
                  {saving ? 'स्टाफ जोड़ा जा रहा है...' : 'सब-एडमिन सेव करें ✓'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
