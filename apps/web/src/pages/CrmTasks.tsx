import React, { useState, useEffect } from 'react';
import {
  CalendarCheck,
  CheckCircle2,
  Clock,
  User,
  Plus,
  ArrowLeft,
  Phone,
  LayoutDashboard,
  Filter,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import CustomerProfile360Drawer from '../components/CustomerProfile360Drawer';

export default function CrmTasks() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'COMPLETED'>('PENDING');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);

  const orgId = '6a5b95fe-7f33-49d4-8ce0-1529f22d6262';

  const loadTasks = async () => {
    setIsLoading(true);
    try {
      const orgRes = await fetch('/api/v1/organizations/active/default');
      const orgData = await orgRes.json();
      const currentOrgId = orgData?.organization?.id;
      if (!currentOrgId) return;

      const res = await fetch(`/api/v1/crm/tasks/${currentOrgId}`);
      const data = await res.json();
      setTasks(Array.isArray(data) ? data : []);
      setIsLoading(false);
    } catch (err) {
      console.error(err);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
  }, []);

  const handleToggleStatus = async (taskId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'COMPLETED' ? 'PENDING' : 'COMPLETED';
    try {
      await fetch(`/api/v1/crm/tasks/${taskId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      });
      loadTasks();
    } catch (e) {
      console.error(e);
    }
  };

  const filteredTasks = tasks.filter((t) => {
    if (filter === 'PENDING') return t.status === 'PENDING';
    if (filter === 'COMPLETED') return t.status === 'COMPLETED';
    return true;
  });

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans">
      {/* Top Header */}
      <header className="bg-slate-950 border-b border-slate-800 px-6 py-4 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-4">
          <Link
            to="/crm/pipeline"
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white px-2.5 py-1.5 rounded-lg bg-slate-800 transition"
          >
            <ArrowLeft className="w-4 h-4" /> CRM Voronka
          </Link>
          <div className="h-5 w-px bg-slate-800" />
          <div className="flex items-center gap-2">
            <CalendarCheck className="w-5 h-5 text-blue-400" />
            <h1 className="font-bold text-base text-white">Eslatmalar va Qayta Qo‘ng‘iroqlar</h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/operator"
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition"
          >
            <Phone className="w-3.5 h-3.5" /> Operator HUD
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl w-full mx-auto p-6 space-y-6 flex-1">
        {/* Filter Controls */}
        <div className="flex items-center justify-between">
          <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => setFilter('PENDING')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition ${
                filter === 'PENDING' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Kutilayotgan ({tasks.filter((t) => t.status === 'PENDING').length})
            </button>
            <button
              onClick={() => setFilter('COMPLETED')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition ${
                filter === 'COMPLETED' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Bajarilgan ({tasks.filter((t) => t.status === 'COMPLETED').length})
            </button>
            <button
              onClick={() => setFilter('ALL')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition ${
                filter === 'ALL' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Barchasi ({tasks.length})
            </button>
          </div>
        </div>

        {/* Tasks List */}
        {isLoading ? (
          <div className="h-48 flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="p-12 text-center bg-slate-950 border border-slate-800 rounded-2xl text-slate-500 space-y-2">
            <CalendarCheck className="w-10 h-10 mx-auto text-slate-600" />
            <p className="text-sm font-medium text-slate-300">Bu ro‘yxatda vazifalar yo‘q</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredTasks.map((t) => (
              <div
                key={t.id}
                className="p-4 bg-slate-950 border border-slate-800 rounded-2xl flex items-center justify-between gap-4 hover:border-slate-700 transition"
              >
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleToggleStatus(t.id, t.status)}
                    className="p-1 text-slate-500 hover:text-emerald-400 transition"
                  >
                    <CheckCircle2
                      className={`w-6 h-6 ${
                        t.status === 'COMPLETED' ? 'text-emerald-400 fill-emerald-400/20' : 'text-slate-600'
                      }`}
                    />
                  </button>
                  <div>
                    <h4
                      className={`font-semibold text-sm ${
                        t.status === 'COMPLETED' ? 'line-through text-slate-500' : 'text-white'
                      }`}
                    >
                      {t.title}
                    </h4>
                    <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                      <span className="flex items-center gap-1 font-mono text-[11px]">
                        <Clock className="w-3 h-3 text-amber-400" />
                        {new Date(t.dueDate).toLocaleString('uz-UZ')}
                      </span>
                      {t.customer && (
                        <button
                          onClick={() => setSelectedCustomerId(t.customer.id)}
                          className="flex items-center gap-1 text-blue-400 hover:underline"
                        >
                          <User className="w-3 h-3" />
                          {t.customer.fullName || t.customer.phoneNumber}
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span
                    className={`text-[10px] px-2.5 py-0.5 rounded-full font-semibold ${
                      t.priority === 'HIGH'
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {t.priority}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <CustomerProfile360Drawer
        customerId={selectedCustomerId}
        onClose={() => setSelectedCustomerId(null)}
        onCustomerUpdated={loadTasks}
      />
    </div>
  );
}
