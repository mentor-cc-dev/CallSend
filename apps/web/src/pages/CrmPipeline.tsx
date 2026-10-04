import React, { useState, useEffect } from 'react';
import {
  Kanban,
  Plus,
  ArrowRight,
  ArrowLeft,
  User,
  ShoppingBag,
  Clock,
  Phone,
  Filter,
  CheckCircle,
  XCircle,
  ExternalLink,
  ChevronRight,
  SlidersHorizontal,
  Flame,
  LayoutDashboard,
  CalendarCheck,
  Send,
} from 'lucide-react';
import CustomerProfile360Drawer from '../components/CustomerProfile360Drawer';
import { Link } from 'react-router-dom';

interface Deal {
  id: string;
  title: string;
  amount: number;
  status: string;
  customer: {
    id: string;
    fullName: string | null;
    phoneNumber: string;
    totalOrders: number;
  };
  assignedUser?: {
    fullName: string;
  };
  updatedAt: string;
}

interface Stage {
  id: string;
  name: string;
  orderIndex: number;
  color: string;
  isWon: boolean;
  isLost: boolean;
  dealCount: number;
  totalAmount: number;
  deals: Deal[];
}

export default function CrmPipeline() {
  const [pipeline, setPipeline] = useState<Stage[]>([]);
  const [summary, setSummary] = useState<any>({ totalDeals: 0, totalPipelineValue: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [isNewDealOpen, setIsNewDealOpen] = useState(false);
  const [newDealTitle, setNewDealTitle] = useState('');
  const [newDealAmount, setNewDealAmount] = useState<number | ''>('');
  const [newDealPhone, setNewDealPhone] = useState('+998901234567');

  const orgId = '6a5b95fe-7f33-49d4-8ce0-1529f22d6262';

  const loadPipeline = async () => {
    try {
      const orgRes = await fetch('/api/v1/organizations/active/default');
      const orgData = await orgRes.json();
      const currentOrgId = orgData?.organization?.id;
      if (!currentOrgId) return;

      const res = await fetch(`/api/v1/crm/deals/pipeline/${currentOrgId}`);
      const data = await res.json();
      if (data.stages) {
        setPipeline(data.stages);
        setSummary(data.summary);
      }
      setIsLoading(false);
    } catch (err) {
      console.error(err);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPipeline();
  }, []);

  const moveDeal = async (dealId: string, targetStageId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await fetch(`/api/v1/crm/deals/${dealId}/stage`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stageId: targetStageId }),
      });
      loadPipeline();
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateDeal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDealTitle.trim()) return;

    try {
      // Find or create customer
      const res = await fetch('/api/v1/crm/deals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationId: orgId,
          customerId: '6c196613-a038-4caa-a4e4-bdeba5c4e3bc', // Fallback or current
          title: newDealTitle,
          amount: newDealAmount ? Number(newDealAmount) : 0,
        }),
      });
      if (res.ok) {
        setIsNewDealOpen(false);
        setNewDealTitle('');
        setNewDealAmount('');
        loadPipeline();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans">
      {/* Top Header */}
      <header className="bg-slate-950 border-b border-slate-800 px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 sticky top-0 z-30">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center">
              <Kanban className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-base text-white flex items-center gap-2">
                Savdo Voronkasi (CRM Pipeline)
              </h1>
              <p className="text-xs text-slate-400">
                Kiruvchi qo‘ng‘iroqlardan tushgan bitimlar oqimi
              </p>
            </div>
          </div>

          <div className="h-6 w-px bg-slate-800 hidden sm:block" />

          {/* Quick Metrics */}
          <div className="flex items-center gap-4 text-xs font-medium">
            <div className="bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl">
              <span className="text-slate-400">Faol Bitimlar: </span>
              <span className="font-bold text-white">{summary.totalDeals} ta</span>
            </div>
            <div className="bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl">
              <span className="text-slate-400">Voronka Qiymati: </span>
              <span className="font-bold text-emerald-400 font-mono">
                {Number(summary.totalPipelineValue).toLocaleString('uz-UZ')} so‘m
              </span>
            </div>
          </div>
        </div>

        {/* Navigation & Actions */}
        <div className="flex items-center gap-2.5">
          <Link
            to="/operator"
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition"
          >
            <Phone className="w-3.5 h-3.5" /> Operator HUD
          </Link>
          <Link
            to="/crm/tasks"
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition"
          >
            <CalendarCheck className="w-3.5 h-3.5" /> Eslatmalar
          </Link>
          <Link
            to="/dashboard"
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition"
          >
            <LayoutDashboard className="w-3.5 h-3.5" /> Boshqaruv
          </Link>
        </div>
      </header>

      {/* Main Kanban Board Container (Horizontal Scrollable) */}
      <main className="flex-1 p-6 overflow-x-auto">
        {isLoading ? (
          <div className="h-64 flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="flex gap-4 min-w-[1300px] h-[calc(100vh-140px)]">
            {pipeline.map((stage, stageIndex) => (
              <div
                key={stage.id}
                className="w-80 bg-slate-950/80 border border-slate-800/80 rounded-2xl flex flex-col overflow-hidden shadow-xl"
              >
                {/* Column Header */}
                <div
                  className="p-4 border-b border-slate-800 flex items-center justify-between"
                  style={{ borderTop: `3px solid ${stage.color}` }}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: stage.color }}
                    />
                    <h3 className="font-bold text-xs text-white uppercase tracking-wider">
                      {stage.name}
                    </h3>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-slate-900 border border-slate-800 font-mono text-slate-300">
                    {stage.dealCount}
                  </span>
                </div>

                {/* Column Volume Sub-header */}
                <div className="px-4 py-2 bg-slate-900/60 border-b border-slate-800/60 flex items-center justify-between text-[11px]">
                  <span className="text-slate-500">Jami summa:</span>
                  <span className="font-mono font-semibold text-emerald-400">
                    {Number(stage.totalAmount).toLocaleString('uz-UZ')} so‘m
                  </span>
                </div>

                {/* Deal Cards Container */}
                <div className="flex-1 overflow-y-auto p-3 space-y-3">
                  {stage.deals.map((deal) => (
                    <div
                      key={deal.id}
                      onClick={() => setSelectedCustomerId(deal.customer.id)}
                      className="p-4 bg-slate-900/90 hover:bg-slate-900 border border-slate-800 hover:border-blue-500/50 rounded-xl cursor-pointer transition shadow-sm group relative space-y-2.5"
                    >
                      {/* Deal Header */}
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="font-semibold text-xs text-white group-hover:text-blue-400 transition leading-snug">
                          {deal.title}
                        </h4>
                      </div>

                      {/* Customer Info */}
                      <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono">
                        <User className="w-3 h-3 text-slate-500 shrink-0" />
                        <span>{deal.customer.fullName || 'Mijoz'}</span>
                        <span>•</span>
                        <span>{deal.customer.phoneNumber}</span>
                      </div>

                      {/* Deal Amount & Controls */}
                      <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                        <span className="text-xs font-bold font-mono text-emerald-400">
                          {Number(deal.amount).toLocaleString('uz-UZ')} so‘m
                        </span>

                        {/* Move stage arrow buttons */}
                        <div className="flex items-center gap-1">
                          {stageIndex > 0 && (
                            <button
                              onClick={(e) => moveDeal(deal.id, pipeline[stageIndex - 1].id, e)}
                              className="p-1 hover:bg-slate-800 text-slate-500 hover:text-white rounded"
                              title="Oldingi bosqichga qaytarish"
                            >
                              <ArrowLeft className="w-3 h-3" />
                            </button>
                          )}
                          {stageIndex < pipeline.length - 1 && (
                            <button
                              onClick={(e) => moveDeal(deal.id, pipeline[stageIndex + 1].id, e)}
                              className="p-1 hover:bg-blue-600/30 text-blue-400 hover:text-blue-300 rounded font-bold"
                              title="Keyingi bosqichga o‘tkazish"
                            >
                              <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}

                  {stage.deals.length === 0 && (
                    <div className="h-32 flex items-center justify-center text-[11px] text-slate-600 border border-dashed border-slate-800 rounded-xl">
                      Bu bosqichda bitimlar yo‘q
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Customer 360 Slide-over Drawer */}
      <CustomerProfile360Drawer
        customerId={selectedCustomerId}
        onClose={() => setSelectedCustomerId(null)}
        onCustomerUpdated={loadPipeline}
      />
    </div>
  );
}
