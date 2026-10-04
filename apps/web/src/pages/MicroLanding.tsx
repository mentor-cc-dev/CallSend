import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  Send,
  MapPin,
  Phone,
  ShoppingBag,
  CheckCircle2,
  Clock,
  ChevronRight,
  ShieldCheck,
  Zap,
} from 'lucide-react';

interface LandingData {
  id: string;
  shortCode: string;
  organization: {
    id: string;
    name: string;
  };
  branch: {
    id: string;
    name: string;
    address: string;
    latitude?: number;
    longitude?: number;
    phoneNumbers?: string;
  } | null;
  customer: {
    name: string | null;
    phoneNumber: string;
  };
  content: {
    title: string;
    description: string;
    imageUrl?: string;
    price?: number;
    ctaTelegramLink?: string;
    ctaMapsLink?: string;
  };
}

export default function MicroLanding() {
  const { shortCode } = useParams<{ shortCode: string }>();
  const [data, setData] = useState<LandingData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [orderNote, setOrderNote] = useState('');
  const [isOrderPlaced, setIsOrderPlaced] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!shortCode) return;

    fetch(`/api/v1/public/landing/${shortCode}`)
      .then(async (res) => {
        if (!res.ok) {
          throw new Error('Sahifa topilmadi yoki havola muddati tugagan');
        }
        return res.json();
      })
      .then((landingData) => {
        setData(landingData);
        setIsLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setIsLoading(false);
      });
  }, [shortCode]);

  const trackEvent = (eventType: string, meta?: any) => {
    if (!shortCode) return;
    fetch('/api/v1/public/tracking/event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        shortCode,
        eventType,
        payload: meta,
      }),
    }).catch(() => {});
  };

  const handleTelegramClick = () => {
    trackEvent('TELEGRAM_CLICK');
    const link = data?.content.ctaTelegramLink || 'https://t.me/artel_support';
    window.open(link, '_blank');
  };

  const handleMapsClick = () => {
    trackEvent('MAP_CLICK');
    const link =
      data?.content.ctaMapsLink ||
      `https://yandex.uz/maps/?text=${encodeURIComponent(data?.branch?.address || 'Toshkent')}`;
    window.open(link, '_blank');
  };

  const handlePlaceOrder = async () => {
    if (!shortCode) return;
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/v1/public/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shortCode,
          itemsSummary: data?.content.title || 'Maxsus buyurtma',
          customerNote: orderNote,
        }),
      });
      if (res.ok) {
        setIsOrderPlaced(true);
        trackEvent('ORDER_CLICK', { note: orderNote });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-slate-500 font-medium">Sahifa yuklanmoqda...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white p-6 rounded-2xl shadow-xl max-w-sm w-full text-center space-y-3">
          <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto">
            !
          </div>
          <h2 className="text-base font-bold text-slate-800">Havola topilmadi</h2>
          <p className="text-xs text-slate-500">{error || 'Ushbu havola eskirgan yoki o‘chirilgan bo‘lishi mumkin.'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-between max-w-md mx-auto shadow-2xl overflow-hidden font-sans border-x border-slate-200">
      {/* Brand Header */}
      <header className="bg-white px-5 py-4 border-b border-slate-200 flex items-center justify-between sticky top-0 z-20">
        <div>
          <h1 className="font-extrabold text-base text-slate-900 tracking-tight">
            {data.organization.name}
          </h1>
          <p className="text-[11px] text-slate-500 flex items-center gap-1">
            <MapPin className="w-3 h-3 text-blue-600" />
            {data.branch?.name || 'Toshkent'}
          </p>
        </div>
        <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs">
          <Zap className="w-4 h-4 fill-blue-600" />
        </div>
      </header>

      {/* Main Content Area */}
      <main className="p-4 space-y-4 flex-1">
        {/* Personalized Welcome Banner */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-4 text-white shadow-lg shadow-blue-500/15">
          <span className="text-[11px] uppercase tracking-wider text-blue-200 font-semibold block mb-0.5">
            Qo‘ng‘irog‘ingiz bo‘yicha ma’lumot
          </span>
          <h2 className="text-base font-bold">
            Assalomu alaykum{data.customer.name ? `, ${data.customer.name}` : ''}!
          </h2>
          <p className="text-xs text-blue-100 mt-1">
            Siz so‘ragan taklif va to‘liq ma’lumotlar quyida tayyorlandi.
          </p>
        </div>

        {/* Product / Offer Card */}
        <div className="bg-white rounded-2xl overflow-hidden border border-slate-200/80 shadow-sm">
          {data.content.imageUrl && (
            <div className="relative aspect-video w-full bg-slate-100 overflow-hidden">
              <img
                src={data.content.imageUrl}
                alt={data.content.title}
                className="w-full h-full object-cover"
                loading="eager"
              />
              {data.content.price && data.content.price > 0 && (
                <div className="absolute bottom-3 right-3 bg-slate-950/80 backdrop-blur-md text-white px-3 py-1 rounded-xl text-xs font-bold font-mono">
                  {Number(data.content.price).toLocaleString('uz-UZ')} so‘m
                </div>
              )}
            </div>
          )}

          <div className="p-4 space-y-2">
            <h3 className="font-bold text-slate-900 text-base leading-snug">
              {data.content.title}
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">
              {data.content.description}
            </p>
          </div>
        </div>

        {/* Interactive Action Buttons */}
        <div className="space-y-2.5">
          {/* Telegram Action */}
          <button
            onClick={handleTelegramClick}
            className="w-full py-3.5 px-4 bg-[#229ED9] hover:bg-[#1f8ec4] active:bg-[#1a7db0] text-white font-semibold rounded-2xl flex items-center justify-between shadow-lg shadow-[#229ED9]/20 transition"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
                <Send className="w-4 h-4 fill-white text-transparent -rotate-12 translate-x-0.5" />
              </div>
              <div className="text-left">
                <div className="text-xs font-bold">Telegram orqali yozish</div>
                <div className="text-[10px] text-blue-100">Rasm va batafsil narxlarni chatda oling</div>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-white/70" />
          </button>

          {/* Location Action */}
          <button
            onClick={handleMapsClick}
            className="w-full py-3 px-4 bg-white hover:bg-slate-50 text-slate-800 font-semibold rounded-2xl border border-slate-200/90 flex items-center justify-between shadow-sm transition"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <MapPin className="w-4 h-4" />
              </div>
              <div className="text-left">
                <div className="text-xs font-bold">Do‘kon Manzili (Xarita)</div>
                <div className="text-[10px] text-slate-500">Yandex yoki Google xaritada marshrut chizish</div>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </button>

          {/* Instant Order Button */}
          <button
            onClick={() => setIsOrderModalOpen(true)}
            className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-2xl flex items-center justify-between shadow-lg shadow-emerald-600/20 transition"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
                <ShoppingBag className="w-4 h-4" />
              </div>
              <div className="text-left">
                <div className="text-xs font-bold">Buyurtma berish / Bron qilish</div>
                <div className="text-[10px] text-emerald-100">Bir bosishda operator bilan tasdiqlash</div>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-white/70" />
          </button>
        </div>

        {/* Trust Badges */}
        <div className="pt-2 flex items-center justify-center gap-4 text-[11px] text-slate-400">
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-600" /> Rasmiy kafolat
          </span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-blue-600" /> Tezkor yetkazish
          </span>
        </div>
      </main>

      {/* Footer */}
      <footer className="p-4 text-center text-[10px] text-slate-400 border-t border-slate-200 bg-white">
        ⚡ CallSend Conversational Commerce orqali xavfsiz yuklandi
      </footer>

      {/* Instant Checkout / Order Modal */}
      {isOrderModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden p-6 space-y-4 shadow-2xl border border-slate-200">
            {!isOrderPlaced ? (
              <>
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-base text-slate-900">Buyurtmani tasdiqlash</h3>
                    <p className="text-xs text-slate-500">Telefoningizga operatorimiz qayta bog‘lanadi</p>
                  </div>
                  <button
                    onClick={() => setIsOrderModalOpen(false)}
                    className="text-slate-400 hover:text-slate-600 text-sm font-bold p-1"
                  >
                    ✕
                  </button>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-xs space-y-1">
                  <div className="text-slate-500">Aloqa raqami:</div>
                  <div className="font-mono font-bold text-slate-800 text-sm">
                    {data.customer.phoneNumber}
                  </div>
                  <div className="text-slate-500 pt-1">Mahsulot:</div>
                  <div className="font-medium text-slate-800">{data.content.title}</div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Qo‘shimcha izoh (ixtiyoriy)
                  </label>
                  <textarea
                    rows={2}
                    value={orderNote}
                    onChange={(e) => setOrderNote(e.target.value)}
                    placeholder="Masalan: Yetkazib berish vaqti yoki manzil..."
                    className="w-full p-2.5 text-xs border rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <button
                  onClick={handlePlaceOrder}
                  disabled={isSubmitting}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  {isSubmitting ? 'Yuborilmoqda...' : 'Tasdiqlash'}
                </button>
              </>
            ) : (
              <div className="text-center py-6 space-y-3">
                <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="font-bold text-slate-900 text-base">Buyurtmangiz qabul qilindi!</h3>
                <p className="text-xs text-slate-500">
                  Operatorimiz 5 daqiqa ichida <span className="font-bold">{data.customer.phoneNumber}</span> raqamingizga qo‘ng‘iroq qiladi.
                </p>
                <button
                  onClick={() => {
                    setIsOrderModalOpen(false);
                    setIsOrderPlaced(false);
                  }}
                  className="w-full py-2.5 bg-slate-900 text-white font-medium rounded-xl text-xs"
                >
                  Yopish
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
