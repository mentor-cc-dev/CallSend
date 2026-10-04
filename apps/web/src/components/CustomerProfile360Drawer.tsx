import React, { useState, useEffect } from 'react';
import {
  X,
  User,
  Phone,
  Building,
  MapPin,
  Tag,
  Clock,
  Send,
  Calendar,
  CheckCircle2,
  FileText,
  PhoneCall,
  Eye,
  ShoppingBag,
  Plus,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';

interface Props {
  customerId: string | null;
  onClose: () => void;
  onCustomerUpdated?: () => void;
}

export default function CustomerProfile360Drawer({ customerId, onClose, onCustomerUpdated }: Props) {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [newNote, setNewNote] = useState('');
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDueDate, setTaskDueDate] = useState('');
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [activeTab, setActiveTab] = useState<'TIMELINE' | 'TASKS' | 'NOTES'>('TIMELINE');

  const loadData = () => {
    if (!customerId) return;
    setIsLoading(true);
    fetch(`/api/v1/crm/customers/${customerId}/timeline`)
      .then((res) => res.json())
      .then((resData) => {
        setData(resData);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setIsLoading(false);
      });
  };

  useEffect(() => {
    loadData();
  }, [customerId]);

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim() || !customerId) return;
    setIsAddingNote(true);
    try {
      await fetch(`/api/v1/crm/customers/${customerId}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newNote }),
      });
      setNewNote('');
      loadData();
      if (onCustomerUpdated) onCustomerUpdated();
    } catch (e) {
      console.error(e);
    } finally {
      setIsAddingNote(false);
    }
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim() || !customerId) return;
    try {
      await fetch('/api/v1/crm/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationId: data?.customer?.organizationId || '6a5b95fe-7f33-49d4-8ce0-1529f22d6262',
          customerId,
          title: taskTitle,
          dueDate: taskDueDate || new Date(Date.now() + 86400000).toISOString(),
          priority: 'HIGH',
        }),
      });
      setTaskTitle('');
      setTaskDueDate('');
      setIsAddingTask(false);
      loadData();
    } catch (e) {
      console.error(e);
    }
  };

  if (!customerId) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-sm flex justify-end animate-in fade-in">
      <div className="bg-slate-900 text-slate-100 w-full max-w-xl h-full shadow-2xl border-l border-slate-800 flex flex-col overflow-hidden animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="p-5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center font-bold text-lg border border-blue-500/30">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-base text-white">
                {isLoading ? 'Yuklanmoqda...' : data?.customer?.fullName || 'Mijoz 360° Profili'}
              </h2>
              <p className="text-xs text-slate-400 font-mono">
                {data?.customer?.phoneNumber} • {data?.customer?.leadSource || 'Qo‘ng‘iroq orqali kelgan'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        {isLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-5 space-y-5">
            {/* Quick Metrics & Tags */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-center">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Buyurtmalar</span>
                <p className="text-base font-bold text-white mt-0.5">{data.customer.totalOrders} ta</p>
              </div>
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-center">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Jami Savdo (LTV)</span>
                <p className="text-xs font-bold text-emerald-400 font-mono mt-1">
                  {Number(data.customer.totalSpent).toLocaleString('uz-UZ')} so‘m
                </p>
              </div>
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-center">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">CRM Holati</span>
                <p className="text-xs font-bold text-blue-400 mt-1 line-clamp-1">
                  {data.activeDeal?.stage?.name || 'Yangi'}
                </p>
              </div>
            </div>

            {/* Tags and Address */}
            <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-xl space-y-2 text-xs">
              <div className="flex items-center gap-2 text-slate-300">
                <MapPin className="w-3.5 h-3.5 text-blue-400" />
                <span>{data.customer.address || 'Manzil kiritilmagan'}</span>
              </div>
              {data.customer.companyName && (
                <div className="flex items-center gap-2 text-slate-300">
                  <Building className="w-3.5 h-3.5 text-amber-400" />
                  <span>{data.customer.companyName}</span>
                </div>
              )}
              <div className="flex items-center gap-1.5 flex-wrap pt-1">
                {data.customer.tags.map((tag: string, i: number) => (
                  <span
                    key={i}
                    className="px-2 py-0.5 rounded-md bg-blue-950 border border-blue-800/60 text-blue-300 text-[10px] font-medium"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Tab Selection */}
            <div className="flex border-b border-slate-800 text-xs">
              <button
                onClick={() => setActiveTab('TIMELINE')}
                className={`pb-2.5 px-4 font-semibold border-b-2 transition ${
                  activeTab === 'TIMELINE'
                    ? 'border-blue-500 text-blue-400'
                    : 'border-transparent text-slate-400 hover:text-white'
                }`}
              >
                Xronologik Tarix ({data.timeline.length})
              </button>
              <button
                onClick={() => setActiveTab('TASKS')}
                className={`pb-2.5 px-4 font-semibold border-b-2 transition ${
                  activeTab === 'TASKS'
                    ? 'border-blue-500 text-blue-400'
                    : 'border-transparent text-slate-400 hover:text-white'
                }`}
              >
                Vazifalar ({data.tasks?.length || 0})
              </button>
            </div>

            {/* TAB 1: Unified Chronological Timeline */}
            {activeTab === 'TIMELINE' && (
              <div className="space-y-4">
                {/* Add Quick Note Input */}
                <form onSubmit={handleAddNote} className="space-y-2">
                  <textarea
                    rows={2}
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    placeholder="Mijoz bo‘yicha tezkor izoh yozish (masalan: Konditsioner narxiga rozi bo‘ldi)..."
                    className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white outline-none focus:border-blue-500 resize-none"
                  />
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={isAddingNote || !newNote.trim()}
                      className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition"
                    >
                      <Plus className="w-3.5 h-3.5" /> Izohni saqlash
                    </button>
                  </div>
                </form>

                {/* Timeline Stream */}
                <div className="relative border-l-2 border-slate-800 ml-4 space-y-4 pt-2">
                  {data.timeline.map((item: any) => (
                    <div key={item.id} className="relative pl-6">
                      {/* Timeline Icon Badge */}
                      <span
                        className={`absolute -left-[11px] top-0.5 w-5 h-5 rounded-full flex items-center justify-center text-[10px] border ${
                          item.type === 'CALL'
                            ? 'bg-blue-950 border-blue-500 text-blue-400'
                            : item.type === 'LINK_OPENED'
                            ? 'bg-emerald-950 border-emerald-500 text-emerald-400'
                            : item.type === 'ORDER'
                            ? 'bg-amber-950 border-amber-500 text-amber-400'
                            : item.type === 'NOTE'
                            ? 'bg-purple-950 border-purple-500 text-purple-400'
                            : 'bg-slate-900 border-slate-700 text-slate-400'
                        }`}
                      >
                        {item.type === 'CALL' && <PhoneCall className="w-3 h-3" />}
                        {item.type === 'LINK_OPENED' && <Eye className="w-3 h-3" />}
                        {item.type === 'ORDER' && <ShoppingBag className="w-3 h-3" />}
                        {item.type === 'NOTE' && <FileText className="w-3 h-3" />}
                        {item.type === 'SMS' && <Send className="w-3 h-3" />}
                      </span>

                      <div className="p-3 bg-slate-950 border border-slate-800/80 rounded-xl space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-white">{item.title}</span>
                          <span className="text-[10px] text-slate-500">
                            {new Date(item.timestamp).toLocaleString('uz-UZ')}
                          </span>
                        </div>
                        <p className="text-xs text-slate-300 whitespace-pre-line leading-relaxed">
                          {item.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 2: Tasks & Callbacks */}
            {activeTab === 'TASKS' && (
              <div className="space-y-4">
                {!isAddingTask ? (
                  <button
                    onClick={() => setIsAddingTask(true)}
                    className="w-full py-2.5 bg-slate-950 border border-slate-800 hover:border-blue-500/50 rounded-xl text-xs font-semibold text-blue-400 flex items-center justify-center gap-1.5 transition"
                  >
                    <Plus className="w-4 h-4" /> Yangi qayta qo‘ng‘iroq / vazifa belgilash
                  </button>
                ) : (
                  <form onSubmit={handleAddTask} className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
                    <div>
                      <label className="block text-[11px] text-slate-400 font-semibold mb-1">
                        Vazifa / Eslatma matni
                      </label>
                      <input
                        type="text"
                        required
                        value={taskTitle}
                        onChange={(e) => setTaskTitle(e.target.value)}
                        placeholder="Masalan: Soat 15:00 da o‘rnatish manzilini aniqlashtirish"
                        className="w-full p-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-400 font-semibold mb-1">
                        Muddati (Sana va vaqt)
                      </label>
                      <input
                        type="datetime-local"
                        value={taskDueDate}
                        onChange={(e) => setTaskDueDate(e.target.value)}
                        className="w-full p-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white outline-none focus:border-blue-500"
                      />
                    </div>
                    <div className="flex justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setIsAddingTask(false)}
                        className="px-3 py-1.5 text-xs text-slate-400"
                      >
                        Bekor qilish
                      </button>
                      <button
                        type="submit"
                        className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold"
                      >
                        Saqlash
                      </button>
                    </div>
                  </form>
                )}

                {/* Tasks List */}
                <div className="space-y-2">
                  {data.tasks.map((t: any) => (
                    <div
                      key={t.id}
                      className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2.5">
                        <CheckCircle2
                          className={`w-4 h-4 ${t.status === 'COMPLETED' ? 'text-emerald-400' : 'text-slate-500'}`}
                        />
                        <div>
                          <p className="font-semibold text-white">{t.title}</p>
                          <p className="text-[10px] text-slate-400">
                            Muddati: {new Date(t.dueDate).toLocaleString('uz-UZ')}
                          </p>
                        </div>
                      </div>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                          t.status === 'COMPLETED'
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : 'bg-amber-500/20 text-amber-400'
                        }`}
                      >
                        {t.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
