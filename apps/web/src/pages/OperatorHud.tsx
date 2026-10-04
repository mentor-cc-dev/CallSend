import React, { useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import {
  PhoneCall,
  PhoneForwarded,
  Send,
  Zap,
  Eye,
  Radio,
  Clock,
  User,
  ShoppingBag,
  ExternalLink,
  Flame,
  CheckCircle,
  LayoutDashboard,
  Smartphone,
  Sparkles,
  MapPin,
  MessageSquare,
  Kanban,
  CalendarCheck,
} from 'lucide-react';
import CallSimulatorModal from '../components/CallSimulatorModal';
import CustomerProfile360Drawer from '../components/CustomerProfile360Drawer';
import { Link } from 'react-router-dom';

interface Template {
  id: string;
  title: string;
  messageText: string;
  cardTitle?: string;
  price?: number;
  isAutoPilotDefault?: boolean;
}

interface IncomingCall {
  callId: string;
  callerNumber: string;
  customerId: string;
  customerName: string;
  totalOrders: number;
  totalSpent: number;
  startedAt: string;
}

interface RadarEvent {
  id: string;
  type: 'LINK_OPENED' | 'EVENT' | 'ORDER';
  phoneNumber: string;
  customerName?: string;
  shortCode?: string;
  deviceInfo?: string;
  text: string;
  timestamp: string;
}

export default function OperatorHud() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [organization, setOrganization] = useState<any>(null);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [activeCall, setActiveCall] = useState<IncomingCall | null>(null);
  const [radarEvents, setRadarEvents] = useState<RadarEvent[]>([]);
  const [isSimulatorOpen, setIsSimulatorOpen] = useState(false);
  const [autoPilotEnabled, setAutoPilotEnabled] = useState(true);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [lastDispatchedLink, setLastDispatchedLink] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);

  // Default demo Org ID
  const orgId = organization?.id || '6a5b95fe-7f33-49d4-8ce0-1529f22d6262';

  // 1. Initial Data Fetch
  useEffect(() => {
    fetch('/api/v1/organizations/active/default')
      .then((res) => res.json())
      .then((data) => {
        if (data.organization) {
          setOrganization(data.organization);
          setAutoPilotEnabled(data.organization.autoPilotEnabled);

          fetch(`/api/v1/templates/${data.organization.id}`)
            .then((res) => res.json())
            .then((tpls) => {
              if (Array.isArray(tpls)) {
                setTemplates(tpls);
                const defaultTpl = tpls.find((t: Template) => t.isAutoPilotDefault) || tpls[0];
                if (defaultTpl) setSelectedTemplateId(defaultTpl.id);
              }
            });
        }
      })
      .catch((err) => console.log('Fetch org err', err));
  }, []);

  // 2. Socket.io Connection & Event Handling
  useEffect(() => {
    const s = io({
      transports: ['websocket', 'polling'],
    });

    s.on('connect', () => {
      setIsConnected(true);
      s.emit('join_branch', { organizationId: orgId });
    });

    s.on('disconnect', () => {
      setIsConnected(false);
    });

    // Event: Incoming Call
    s.on('call.incoming', (data: IncomingCall) => {
      setActiveCall(data);
      // Play audio notification chime
      try {
        const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
        audio.play().catch(() => {});
      } catch (e) {}
    });

    // Event: Call Ended
    s.on('call.ended', () => {
      // Keep active call card visible for quick dispatch if not yet dismissed
    });

    // Event: Live Radar - Customer Opened Link!
    s.on('customer.opened_link', (data: any) => {
      const event: RadarEvent = {
        id: Math.random().toString(),
        type: 'LINK_OPENED',
        phoneNumber: data.phoneNumber,
        customerName: data.customerName,
        shortCode: data.shortCode,
        deviceInfo: data.userAgent,
        text: `Mijoz havolani ochdi (${data.userAgent || 'Mobil brauzer'})`,
        timestamp: new Date().toLocaleTimeString('uz-UZ'),
      };
      setRadarEvents((prev) => [event, ...prev.slice(0, 15)]);

      // Audio notification for radar
      try {
        const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3');
        audio.play().catch(() => {});
      } catch (e) {}
    });

    // Event: Customer Order
    s.on('customer.order', (data: any) => {
      const event: RadarEvent = {
        id: Math.random().toString(),
        type: 'ORDER',
        phoneNumber: data.phoneNumber,
        customerName: data.customerName,
        text: `YANGI BUYURTMA! Summa: ${Number(data.amount).toLocaleString('uz-UZ')} so'm`,
        timestamp: new Date().toLocaleTimeString('uz-UZ'),
      };
      setRadarEvents((prev) => [event, ...prev]);
    });

    setSocket(s);

    return () => {
      s.disconnect();
    };
  }, [orgId]);

  // 3. Hotkeys Handler (Press 1, 2, 3 to trigger quick dispatch)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.key === '1' && templates[0]) {
        sendTemplate(templates[0].id);
      } else if (e.key === '2' && templates[1]) {
        sendTemplate(templates[1].id);
      } else if (e.key === '3' && templates[2]) {
        sendTemplate(templates[2].id);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [templates, activeCall]);

  const sendTemplate = async (templateId: string) => {
    const phone = activeCall?.callerNumber || '+998901234567';
    setIsSending(true);
    try {
      const res = await fetch('/api/v1/messages/dispatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationId: orgId,
          phoneNumber: phone,
          templateId,
          callLogId: activeCall?.callId,
        }),
      });
      const result = await res.json();
      if (result.success) {
        setLastDispatchedLink(result.dynamicLink);
        setSuccessToast(`SMS yuborildi: ${phone}`);
        setTimeout(() => setSuccessToast(null), 4000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSending(false);
    }
  };

  const toggleAutoPilot = async () => {
    const nextVal = !autoPilotEnabled;
    setAutoPilotEnabled(nextVal);
    await fetch(`/api/v1/organizations/${orgId}/settings`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ autoPilotEnabled: nextVal }),
    });
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans">
      {/* Top Navigation Bar */}
      <header className="bg-slate-950/80 backdrop-blur-md border-b border-slate-800 px-6 py-3.5 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/25">
              <PhoneForwarded className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-base tracking-tight text-white flex items-center gap-2">
                CallSend <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 font-medium">HUD v1.0</span>
              </h1>
              <p className="text-xs text-slate-400">
                {organization?.name || 'Artel Comfort Pro'} • Chilonzor Filial
              </p>
            </div>
          </div>

          <div className="h-6 w-px bg-slate-800 hidden sm:block" />

          {/* Connection Status */}
          <div className="flex items-center gap-2 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800">
            <span className={`w-2.5 h-2.5 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
            <span className="text-xs font-medium text-slate-300">
              {isConnected ? 'Jonli Server Ulangan' : 'Ulanmoqda...'}
            </span>
          </div>
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-3">
          {/* Auto-Pilot Toggle */}
          <button
            onClick={toggleAutoPilot}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition ${
              autoPilotEnabled
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                : 'bg-slate-800 border-slate-700 text-slate-400'
            }`}
          >
            <Zap className={`w-3.5 h-3.5 ${autoPilotEnabled ? 'text-amber-400 fill-amber-400' : ''}`} />
            Auto-Pilot: {autoPilotEnabled ? 'YONIQ' : 'O‘CHIQ'}
          </button>

          {/* Call Simulator Trigger */}
          <button
            onClick={() => setIsSimulatorOpen(true)}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/20 transition"
          >
            <Smartphone className="w-3.5 h-3.5" />
            Qo‘ng‘iroqni Sinash
          </button>

          {/* CRM Pipeline Link */}
          <Link
            to="/crm/pipeline"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 hover:text-white hover:bg-indigo-600 transition"
          >
            <Kanban className="w-3.5 h-3.5" />
            CRM Voronka
          </Link>

          {/* CRM Tasks Link */}
          <Link
            to="/crm/tasks"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition"
          >
            <CalendarCheck className="w-3.5 h-3.5" />
            Eslatmalar
          </Link>

          {/* Dashboard Link */}
          <Link
            to="/dashboard"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition"
          >
            <LayoutDashboard className="w-4 h-4" />
            Boshqaruv
          </Link>
        </div>
      </header>

      {/* Main Workspace Layout */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Active Call & Quick Send HUD (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Active Call Card */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-emerald-500 animate-ping" />
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                  {activeCall ? 'Faol Qo‘ng‘iroq Sessiyasi' : 'Qo‘ng‘iroq Kutilmoqda...'}
                </span>
              </div>
              {activeCall && (
                <button
                  onClick={() => setActiveCall(null)}
                  className="text-xs text-slate-500 hover:text-slate-300 transition"
                >
                  Yopish
                </button>
              )}
            </div>

            {/* Caller Profile Details */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-slate-900/90 border border-slate-800/80">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-md">
                  <User className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white font-mono tracking-tight">
                    {activeCall?.callerNumber || '+998 (90) 123-45-67'}
                  </h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <p className="text-sm text-slate-300">
                      {activeCall?.customerName || 'Jamshid Karimov'}
                    </p>
                    <button
                      onClick={() =>
                        setSelectedCustomerId(
                          activeCall?.customerId || '6c196613-a038-4caa-a4e4-bdeba5c4e3bc',
                        )
                      }
                      className="text-[11px] px-2 py-0.5 rounded-md bg-blue-500/20 text-blue-300 hover:bg-blue-600 hover:text-white transition font-medium"
                    >
                      Mijoz 360°
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4 sm:border-l sm:border-slate-800 sm:pl-4 text-xs">
                <div>
                  <span className="text-slate-500 block">Buyurtmalar</span>
                  <span className="font-semibold text-emerald-400 flex items-center gap-1">
                    <ShoppingBag className="w-3 h-3" /> {activeCall?.totalOrders ?? 2} ta
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Jami Xarid</span>
                  <span className="font-semibold text-white font-mono">
                    {Number(activeCall?.totalSpent ?? 8900000).toLocaleString('uz-UZ')} so‘m
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Send Templates (1-Click Action buttons) */}
            <div className="mt-6">
              <div className="flex items-center justify-between mb-3">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  Tezkor Yuborish Kartochkalari (Klaviaturadan: [1], [2], [3])
                </label>
                <span className="text-[11px] text-slate-500">1-bosishda SMS/Telegram ketadi</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {templates.map((tpl, idx) => (
                  <button
                    key={tpl.id}
                    onClick={() => sendTemplate(tpl.id)}
                    disabled={isSending}
                    className={`p-4 rounded-xl text-left border transition-all duration-200 relative group flex flex-col justify-between ${
                      tpl.isAutoPilotDefault
                        ? 'bg-blue-950/40 border-blue-500/50 hover:border-blue-400 hover:bg-blue-900/30'
                        : 'bg-slate-900/70 border-slate-800 hover:border-slate-700 hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <span className="w-6 h-6 rounded-md bg-slate-800 group-hover:bg-blue-600 text-slate-300 group-hover:text-white font-bold text-xs flex items-center justify-center transition">
                        {idx + 1}
                      </span>
                      {tpl.isAutoPilotDefault && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 font-medium">
                          Auto
                        </span>
                      )}
                    </div>
                    <div>
                      <h4 className="font-semibold text-xs text-white line-clamp-1 group-hover:text-blue-300 transition">
                        {tpl.title}
                      </h4>
                      <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">
                        {tpl.cardTitle || tpl.messageText}
                      </p>
                    </div>
                    <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-blue-400 font-medium">
                      <span>Jo‘natish</span>
                      <Send className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Notification / Toast Banner */}
            {successToast && (
              <div className="mt-4 p-3 rounded-xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-200 text-xs flex items-center justify-between animate-in fade-in">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                  <span>{successToast}</span>
                </div>
                {lastDispatchedLink && (
                  <a
                    href={lastDispatchedLink}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 underline text-emerald-300 hover:text-white font-mono"
                  >
                    Havolani ko‘rish <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            )}
          </div>

          {/* Micro-Landing Live Simulator Preview for Operator */}
          {lastDispatchedLink && (
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                  <Eye className="w-4 h-4 text-blue-400" />
                  Yuborilgan Dinamik Havola (Mijoz ko‘radigan sahifa)
                </span>
                <a
                  href={lastDispatchedLink}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 font-mono"
                >
                  {lastDispatchedLink} <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-300 font-mono">{lastDispatchedLink}</span>
                <span className="text-[11px] text-emerald-400 font-medium flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> Havola faol
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Live Radar & Activity Feed (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 shadow-2xl flex flex-col h-full min-h-[500px]">
            {/* Radar Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="relative">
                  <Radio className="w-5 h-5 text-emerald-400 animate-pulse" />
                  <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white">Jonli Radar (Real-Time Radar)</h3>
                  <p className="text-[11px] text-slate-400">Mijozlarning havolalarni ochishi va buyurtmalari</p>
                </div>
              </div>
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-950 border border-emerald-500/40 text-emerald-300 font-medium">
                {radarEvents.length} ta hodisa
              </span>
            </div>

            {/* Radar Events Stream */}
            <div className="flex-1 overflow-y-auto space-y-3 mt-4 pr-1">
              {radarEvents.length === 0 ? (
                <div className="h-64 flex flex-col items-center justify-center text-center p-6 text-slate-500">
                  <Radio className="w-10 h-10 mb-2 stroke-1 opacity-40 text-slate-400" />
                  <p className="text-sm font-medium text-slate-400">Radar faol</p>
                  <p className="text-xs mt-1 max-w-xs text-slate-500">
                    Mijoz SMS dagi havolani ochishi bilan bu yerda yashil miltillovchi bildirishnoma paydo bo‘ladi.
                  </p>
                  <button
                    onClick={() => setIsSimulatorOpen(true)}
                    className="mt-4 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 transition"
                  >
                    Simulyator orqali sinash
                  </button>
                </div>
              ) : (
                radarEvents.map((evt) => (
                  <div
                    key={evt.id}
                    className={`p-3.5 rounded-xl border transition-all ${
                      evt.type === 'LINK_OPENED'
                        ? 'bg-emerald-950/40 border-emerald-500/50 radar-glow'
                        : evt.type === 'ORDER'
                        ? 'bg-amber-950/40 border-amber-500/50'
                        : 'bg-slate-900 border-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="font-bold font-mono text-white flex items-center gap-1.5">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            evt.type === 'LINK_OPENED'
                              ? 'bg-emerald-400 animate-ping'
                              : 'bg-amber-400 animate-pulse'
                          }`}
                        />
                        {evt.phoneNumber}
                      </span>
                      <span className="text-[10px] text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {evt.timestamp}
                      </span>
                    </div>
                    <p className="text-xs text-slate-200 font-medium">{evt.text}</p>
                    {evt.shortCode && (
                      <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                        <span className="text-slate-400">{evt.deviceInfo}</span>
                        <a
                          href={`/m/${evt.shortCode}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-blue-400 hover:underline flex items-center gap-1"
                        >
                          Kartochkani ochish <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Simulator Modal */}
      <CallSimulatorModal
        isOpen={isSimulatorOpen}
        onClose={() => setIsSimulatorOpen(false)}
        onSimulateSuccess={() => {}}
      />

      {/* Customer 360 Slide-over Drawer */}
      <CustomerProfile360Drawer
        customerId={selectedCustomerId}
        onClose={() => setSelectedCustomerId(null)}
      />
    </div>
  );
}
