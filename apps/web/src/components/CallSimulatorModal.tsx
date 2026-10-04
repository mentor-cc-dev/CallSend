import React, { useState } from 'react';
import { PhoneCall, PhoneOff, Smartphone, X, Play, CheckCircle2 } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSimulateSuccess?: () => void;
}

export default function CallSimulatorModal({ isOpen, onClose, onSimulateSuccess }: Props) {
  const [phoneNumber, setPhoneNumber] = useState('+998901234567');
  const [deviceToken, setDeviceToken] = useState('test_android_token_777');
  const [duration, setDuration] = useState(25);
  const [isCalling, setIsCalling] = useState(false);
  const [statusText, setStatusText] = useState('');

  if (!isOpen) return null;

  const simulateCallStart = async () => {
    setIsCalling(true);
    setStatusText('Qo‘ng‘iroq boshlanmoqda (RINGING)...');
    try {
      const res = await fetch('/api/v1/telephony/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: 'CALL_START',
          caller_number: phoneNumber,
          device_token: deviceToken,
          destination_number: '+998712000001',
          timestamp: new Date().toISOString(),
        }),
      });
      if (res.ok) {
        setStatusText('Qo‘ng‘iroq ulandi! Operator HUD ekranida pop-up chiqdi.');
      }
    } catch (err) {
      setStatusText('Xatolik yuz berdi: ' + err.message);
      setIsCalling(false);
    }
  };

  const simulateCallEnd = async () => {
    setStatusText('Qo‘ng‘iroq yakunlanmoqda (CALL_END)...');
    try {
      const res = await fetch('/api/v1/telephony/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: 'CALL_END',
          caller_number: phoneNumber,
          device_token: deviceToken,
          duration: duration,
          timestamp: new Date().toISOString(),
        }),
      });
      if (res.ok) {
        setStatusText('Qo‘ng‘iroq yakunlandi! Auto-Pilot rejimida avtomatik SMS yuborilmoqda.');
        setIsCalling(false);
        if (onSimulateSuccess) onSimulateSuccess();
      }
    } catch (err) {
      setStatusText('Xatolik: ' + err.message);
      setIsCalling(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-5 text-white flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Smartphone className="w-6 h-6" />
            <div>
              <h3 className="font-bold text-lg">Android / SIP Simulyatori</h3>
              <p className="text-xs text-blue-100">Qo‘ng‘iroq tushish jarayonini sinash</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-full transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
              Mijoz telefon raqami
            </label>
            <input
              type="text"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              className="w-full px-3 py-2 border rounded-xl font-mono text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="+998901234567"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                Qurilma tokeni
              </label>
              <input
                type="text"
                value={deviceToken}
                onChange={(e) => setDeviceToken(e.target.value)}
                className="w-full px-3 py-2 border rounded-xl font-mono text-xs focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                Davomiylik (sek)
              </label>
              <input
                type="number"
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                className="w-full px-3 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>

          {statusText && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-800 flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <span>{statusText}</span>
            </div>
          )}

          <div className="pt-2 flex flex-col gap-2">
            {!isCalling ? (
              <button
                onClick={simulateCallStart}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-semibold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 transition"
              >
                <PhoneCall className="w-5 h-5 animate-pulse" />
                Kiruvchi qo‘ng‘iroqni boshlash (RINGING)
              </button>
            ) : (
              <button
                onClick={simulateCallEnd}
                className="w-full py-3 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white font-semibold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-rose-600/20 transition"
              >
                <PhoneOff className="w-5 h-5" />
                Go‘shakni qo‘yish (Tugash va Auto-Pilot)
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
