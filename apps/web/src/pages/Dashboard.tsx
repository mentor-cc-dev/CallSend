import React, { useState, useEffect } from 'react';
import {
  PhoneCall,
  MessageSquare,
  TrendingUp,
  ShoppingBag,
  Zap,
  Smartphone,
  Plus,
  Trash2,
  CheckCircle,
  ExternalLink,
  ArrowLeft,
  Settings,
  BatteryCharging,
  Sliders,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const [data, setData] = useState<any>(null);
  const [templates, setTemplates] = useState<any[]>([]);
  const [callLogs, setCallLogs] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [isCreatingTemplate, setIsCreatingTemplate] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newMessageText, setNewMessageText] = useState('');
  const [newPrice, setNewPrice] = useState<number | ''>('');
  const [newCardTitle, setNewCardTitle] = useState('');

  const loadData = async () => {
    try {
      const orgRes = await fetch('/api/v1/organizations/active/default');
      const orgData = await orgRes.json();
      const currentOrgId = orgData?.organization?.id;
      if (!currentOrgId) return;

      setData(orgData);

      fetch(`/api/v1/templates/${currentOrgId}`)
        .then((res) => res.json())
        .then((d) => setTemplates(Array.isArray(d) ? d : []));

      fetch(`/api/v1/organizations/${currentOrgId}/calls`)
        .then((res) => res.json())
        .then((d) => setCallLogs(Array.isArray(d) ? d : []));

      fetch(`/api/v1/organizations/${currentOrgId}/orders`)
        .then((res) => res.json())
        .then((d) => setOrders(Array.isArray(d) ? d : []));
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newMessageText) return;

    try {
      await fetch('/api/v1/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationId: orgId,
          title: newTitle,
          messageText: newMessageText,
          cardTitle: newCardTitle || newTitle,
          price: newPrice ? Number(newPrice) : 0,
          ctaTelegramLink: 'https://t.me/artel_support',
        }),
      });
      setIsCreatingTemplate(false);
      setNewTitle('');
      setNewMessageText('');
      setNewPrice('');
      setNewCardTitle('');
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteTemplate = async (id: string) => {
    try {
      await fetch(`/api/v1/templates/${id}`, { method: 'DELETE' });
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const stats = data?.stats || {
    totalCalls: 0,
    totalMessages: 0,
    openedMessages: 0,
    openRate: 0,
    totalOrders: 0,
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans">
      {/* Top Header */}
      <header className="bg-slate-950 border-b border-slate-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            to="/operator"
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white px-2.5 py-1.5 rounded-lg bg-slate-800 transition"
          >
            <ArrowLeft className="w-4 h-4" /> Operator HUD
          </Link>
          <div className="h-5 w-px bg-slate-800" />
          <h1 className="font-bold text-lg text-white">CallSend Boshqaruv Paneli</h1>
          <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-400 font-medium">
            {data?.organization?.name || 'Artel Comfort Pro'}
          </span>
        </div>
      </header>

      {/* Content Container */}
      <main className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Metric Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-950 border border-slate-800 p-5 rounded-2xl flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Kiruvchi Qo‘ng‘iroqlar
              </p>
              <h3 className="text-2xl font-bold text-white mt-1">{stats.totalCalls} ta</h3>
              <p className="text-[11px] text-slate-500 mt-0.5">Android va PBX orqali</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
              <PhoneCall className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-slate-950 border border-slate-800 p-5 rounded-2xl flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Yuborilgan Xabarlar
              </p>
              <h3 className="text-2xl font-bold text-white mt-1">{stats.totalMessages} ta</h3>
              <p className="text-[11px] text-slate-500 mt-0.5">SMS va Telegram orqali</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
              <MessageSquare className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-slate-950 border border-slate-800 p-5 rounded-2xl flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Ochilish Ko‘rsatkichi
              </p>
              <h3 className="text-2xl font-bold text-emerald-400 mt-1">{stats.openRate}%</h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {stats.openedMessages} / {stats.totalMessages} ochilgan
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <TrendingUp className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-slate-950 border border-slate-800 p-5 rounded-2xl flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Qabul Qilingan Buyurtmalar
              </p>
              <h3 className="text-2xl font-bold text-amber-400 mt-1">{stats.totalOrders} ta</h3>
              <p className="text-[11px] text-slate-500 mt-0.5">Micro-Landing orqali</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <ShoppingBag className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Templates and Devices Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Templates Section (8 cols) */}
          <div className="lg:col-span-8 bg-slate-950 border border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base text-white">Xabar va Mahsulot Shablonlari</h3>
                <p className="text-xs text-slate-400">
                  Qo‘ng‘iroqdan keyin mijozga boradigan kartochkalar
                </p>
              </div>
              <button
                onClick={() => setIsCreatingTemplate(!isCreatingTemplate)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold transition"
              >
                <Plus className="w-4 h-4" /> Yangi Shablon
              </button>
            </div>

            {/* Create Template Form Drawer */}
            {isCreatingTemplate && (
              <form
                onSubmit={handleCreateTemplate}
                className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3"
              >
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                      Shablon Nomi
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Masalan: Yozgi Konditsioner Aksiyasi"
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                      Narxi (so‘m)
                    </label>
                    <input
                      type="number"
                      placeholder="Masalan: 3500000"
                      value={newPrice}
                      onChange={(e) => setNewPrice(e.target.value ? Number(e.target.value) : '')}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                    SMS Xabar Matni ({'{link}'} o‘rniga avtomatik havola qo‘yiladi)
                  </label>
                  <textarea
                    required
                    rows={2}
                    placeholder="Salom! Siz so‘ragan takliflar: {link}"
                    value={newMessageText}
                    onChange={(e) => setNewMessageText(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white outline-none focus:border-blue-500"
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsCreatingTemplate(false)}
                    className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
                  >
                    Bekor qilish
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold"
                  >
                    Saqlash
                  </button>
                </div>
              </form>
            )}

            {/* Template List */}
            <div className="space-y-3">
              {templates.map((tpl) => (
                <div
                  key={tpl.id}
                  className="p-4 rounded-xl bg-slate-900 border border-slate-800/80 flex items-start justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-sm text-white">{tpl.title}</h4>
                      {tpl.isAutoPilotDefault && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-medium">
                          Auto-Pilot Asosiy
                        </span>
                      )}
                      {tpl.price && tpl.price > 0 && (
                        <span className="text-xs font-mono text-amber-400 font-semibold">
                          {Number(tpl.price).toLocaleString('uz-UZ')} so‘m
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 font-mono">{tpl.messageText}</p>
                  </div>
                  <button
                    onClick={() => handleDeleteTemplate(tpl.id)}
                    className="p-2 text-slate-500 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition"
                    title="O‘chirish"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Connected Android Gateways (4 cols) */}
          <div className="lg:col-span-4 bg-slate-950 border border-slate-800 rounded-2xl p-6 space-y-4">
            <div>
              <h3 className="font-bold text-base text-white">Ulangan Telefonlar (Gateway)</h3>
              <p className="text-xs text-slate-400">Android ilova orqali qo‘ng‘iroqni ushlovchilar</p>
            </div>

            <div className="space-y-3">
              {data?.organization?.devices?.map((dev: any) => (
                <div
                  key={dev.id}
                  className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Smartphone className="w-4 h-4 text-blue-400" />
                      <span className="font-semibold text-xs text-white">{dev.modelName}</span>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-medium">
                      Faol
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800">
                    <span className="flex items-center gap-1 font-mono text-slate-300">
                      <BatteryCharging className="w-3.5 h-3.5 text-emerald-400" /> {dev.batteryLevel ?? 95}%
                    </span>
                    <span className="font-mono text-[10px]">Token: {dev.deviceToken.slice(0, 14)}...</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-3 bg-blue-950/30 border border-blue-800/40 rounded-xl text-xs text-blue-200">
              💡 Yangi Android smartfon ulash uchun Android ilovada ushbu QR-kod yoki server manzilini kiriting.
            </div>
          </div>
        </div>

        {/* Recent Call Logs & Orders Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Call Logs */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 space-y-3">
            <h3 className="font-bold text-base text-white">So‘nggi Kiruvchi Qo‘ng‘iroqlar</h3>
            <div className="divide-y divide-slate-800/60 max-h-72 overflow-y-auto">
              {callLogs.length === 0 ? (
                <p className="text-xs text-slate-500 py-4 text-center">Qo‘ng‘iroqlar hali qayd etilmagan</p>
              ) : (
                callLogs.map((log) => (
                  <div key={log.id} className="py-2.5 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-mono font-bold text-white">{log.callerNumber}</div>
                      <div className="text-[11px] text-slate-400">
                        {log.customer?.fullName || 'Noma‘lum mijoz'} • {log.duration}s
                      </div>
                    </div>
                    <div className="text-right">
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                          log.status === 'ANSWERED'
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : 'bg-rose-500/20 text-rose-300'
                        }`}
                      >
                        {log.status}
                      </span>
                      <div className="text-[10px] text-slate-500 mt-0.5">
                        {new Date(log.startedAt).toLocaleTimeString('uz-UZ')}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Orders */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 space-y-3">
            <h3 className="font-bold text-base text-white">Micro-Landing orqali Buyurtmalar</h3>
            <div className="divide-y divide-slate-800/60 max-h-72 overflow-y-auto">
              {orders.length === 0 ? (
                <p className="text-xs text-slate-500 py-4 text-center">Hali buyurtmalar yo‘q</p>
              ) : (
                orders.map((ord) => (
                  <div key={ord.id} className="py-2.5 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-bold text-white">{ord.itemsSummary}</div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        {ord.customer?.phoneNumber} ({ord.customer?.fullName || 'Mijoz'})
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono font-bold text-emerald-400">
                        {Number(ord.totalAmount).toLocaleString('uz-UZ')} so‘m
                      </div>
                      <span className="text-[10px] px-1.5 py-0.5 bg-blue-500/20 text-blue-300 rounded font-medium">
                        {ord.status}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
