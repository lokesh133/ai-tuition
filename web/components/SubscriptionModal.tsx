'use client';

import React, { useState } from 'react';
import {
  Check,
  Sparkles,
  Shield,
  CreditCard,
  Zap,
  Gift,
  X,
  Loader2,
  CheckCircle2,
  Lock,
  Calendar,
  Award,
  Clock,
  BookOpen,
  HeartHandshake,
} from 'lucide-react';

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubscribedSuccess?: (info: any) => void;
  studentName?: string;
  studentPhone?: string;
  isTrialExpired?: boolean;
  trialUploadCount?: number;
  isFourthUploadAttempt?: boolean;
}

declare global {
  interface Window {
    Razorpay: any;
  }
}

export const SubscriptionModal: React.FC<SubscriptionModalProps> = ({
  isOpen,
  onClose,
  onSubscribedSuccess,
  studentName = 'छात्र',
  studentPhone = '',
  isTrialExpired = false,
  trialUploadCount = 0,
  isFourthUploadAttempt = false,
}) => {
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'annual'>('monthly');
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentAmount = selectedPlan === 'monthly' ? 200 : 1499;

  // Helper to dynamically load Razorpay script
  const loadRazorpayScript = (): Promise<boolean> => {
    return new Promise((resolve) => {
      if (typeof window !== 'undefined' && window.Razorpay) {
        return resolve(true);
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  // 1. Live / Sandbox Razorpay Checkout Flow
  const handlePayWithRazorpay = async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      // 1. Create order on server
      const orderRes = await fetch('/api/subscription/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: currentAmount,
          studentName,
          phone: studentPhone,
        }),
      });

      const orderData = await orderRes.json();
      if (!orderData.success) {
        throw new Error(orderData.message || 'ऑर्डर शुरू करने में समस्या हुई।');
      }

      // If in sandbox mode without live Razorpay keys
      if (orderData.isTestMode) {
        const verifyRes = await fetch('/api/subscription/verify-payment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            razorpay_order_id: orderData.orderId,
            isTestMode: true,
            studentIdentifier: studentPhone || 'test_student',
            studentName,
            amount: currentAmount,
          }),
        });

        const verifyData = await verifyRes.json();
        setIsLoading(false);
        setSuccessMessage(`🎉 टेस्ट मोड: ${selectedPlan === 'annual' ? '365' : '30'} दिनों का सब्सक्रिप्शन सफलतापूर्वक एक्टिव हो गया!`);
        if (onSubscribedSuccess) onSubscribedSuccess(verifyData.subscription);
        setTimeout(() => {
          onClose();
        }, 2200);
        return;
      }

      // Live Razorpay Flow
      const isScriptLoaded = await loadRazorpayScript();
      if (!isScriptLoaded) {
        throw new Error('Razorpay SDK लोड नहीं हो सका। कृपया इंटरनेट जांचें।');
      }

      const options = {
        key: orderData.keyId || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_placeholder',
        amount: orderData.amount,
        currency: orderData.currency || 'INR',
        name: 'विद्या AI ट्यूशन (Vidya AI)',
        description: selectedPlan === 'annual' ? 'वार्षिक परीक्षा पैक (365 दिन)' : 'मासिक ट्यूशन पैक (30 दिन)',
        order_id: orderData.orderId,
        handler: async function (response: any) {
          setIsLoading(true);
          const verifyRes = await fetch('/api/subscription/verify-payment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              studentIdentifier: studentPhone || 'student_user',
              studentName,
              amount: currentAmount,
            }),
          });

          const verifyData = await verifyRes.json();
          setIsLoading(false);
          if (verifyData.success) {
            setSuccessMessage(`🎉 बधाई! ₹${currentAmount} का भुगतान सफल रहा और ${selectedPlan === 'annual' ? '365 दिन (पूरा साल)' : '30 दिन'} की ट्यूशन शुरू हो गई है!`);
            if (onSubscribedSuccess) onSubscribedSuccess(verifyData.subscription);
            setTimeout(() => onClose(), 2200);
          } else {
            setErrorMessage(verifyData.message || 'भुगतान सत्यापन असफल।');
          }
        },
        prefill: {
          name: studentName,
          contact: studentPhone || '9829012345',
        },
        theme: {
          color: '#4F46E5', // Indigo-600
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (response: any) {
        setErrorMessage(response.error.description || 'पेमेंट रद्द या असफल रहा।');
        setIsLoading(false);
      });
      rzp.open();
      setIsLoading(false);
    } catch (err: any) {
      console.error('Payment checkout error:', err);
      setErrorMessage(err?.message || 'पेमेंट शुरू करने में त्रुटि।');
      setIsLoading(false);
    }
  };

  // 2. Admin Free Test Mode (₹0 Bypass)
  const handleAdminFreeTestPass = async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/admin/subscription/grant-free', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: studentPhone || 'admin_test_account',
          studentName: studentName || 'Admin Tester',
          days: selectedPlan === 'annual' ? 365 : 30,
          planName: selectedPlan === 'annual' ? 'Admin Free Annual Pass (365 Days - ₹0)' : 'Admin Free Pass (30 Days - ₹0)',
        }),
      });

      const data = await res.json();
      setIsLoading(false);

      if (data.success) {
        setSuccessMessage('🎁 एडमिन टेस्ट पास सफल! आपके खाते को 100% फ्री एक्टिव कर दिया गया है।');
        if (onSubscribedSuccess) onSubscribedSuccess(data.subscription);
        setTimeout(() => {
          onClose();
        }, 2000);
      } else {
        setErrorMessage(data.message || 'फ्री पास एक्टिवेट नहीं हो सका।');
      }
    } catch (err: any) {
      setIsLoading(false);
      setErrorMessage('सर्वर से कनेक्ट करने में त्रुटि हुई।');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl border border-slate-200 relative my-6 max-h-[92vh] flex flex-col">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 w-9 h-9 rounded-full bg-slate-900/40 hover:bg-slate-900/60 text-white flex items-center justify-center transition-all"
          title="बंद करें"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Top Header Banner */}
        <div className="bg-gradient-to-r from-indigo-700 via-indigo-600 to-purple-700 text-white p-5 sm:p-6 text-center relative overflow-hidden shrink-0">
          <div className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-black text-amber-200 mb-2 border border-white/20">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>कक्षा 1 से 8वीं • ऑल-एक्सेस ट्यूशन पैक</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black">विद्या AI ट्यूशन सब्सक्रिप्शन</h2>
          
          {/* Exact Motivational Message Loved by User */}
          <div className="mt-2 bg-white/10 backdrop-blur-sm rounded-xl p-2.5 sm:p-3 border border-white/20 max-w-lg mx-auto">
            <p className="text-xs sm:text-sm font-bold text-amber-100 leading-snug">
              🌟 शाबाश! आपने 7 दिन बहुत मन लगाकर पढ़ाई की। बच्चे की रोज़ाना असीमित पढ़ाई जारी रखने के लिए सिर्फ ₹6/दिन (₹200/माह) का पैक शुरू करें — एक समोसे के खर्च से भी कम!
            </p>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 text-slate-800">
          {/* 🌟 4th Upload / 3-Trial Limit Complete Feature Showcase (Requested by User) */}
          {(isFourthUploadAttempt || trialUploadCount >= 3) && (
            <div className="bg-gradient-to-r from-amber-50 via-indigo-50 to-purple-50 rounded-2xl p-4 border-2 border-indigo-500/40 space-y-3 shadow-xs">
              <div className="flex items-center gap-2.5">
                <span className="text-3xl">🎉</span>
                <div>
                  <h3 className="text-sm font-black text-indigo-950">
                    शाबाश! आपने 3 मुफ़्त वर्कशीट हल कर ली हैं (3/3 Free Uploads Used)
                  </h3>
                  <p className="text-xs text-indigo-800 font-bold mt-0.5">
                    4th अपलोड और आगे की असीमित पढ़ाई के लिए ये सभी प्रीमियम फीचर्स अनलॉक करें:
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div className="flex items-center gap-2 bg-white/90 p-2.5 rounded-xl border border-indigo-100 font-bold text-slate-800 shadow-2xs">
                  <span className="text-base">📸</span>
                  <span>असीमित फोटो व वर्कशीट अपलोड (Unlimited Daily Pages)</span>
                </div>
                <div className="flex items-center gap-2 bg-white/90 p-2.5 rounded-xl border border-indigo-100 font-bold text-slate-800 shadow-2xs">
                  <span className="text-base">👨‍🏫</span>
                  <span>शर्मा सर, नेहा मैम व पूजा मैम द्वारा बोलकर हल</span>
                </div>
                <div className="flex items-center gap-2 bg-white/90 p-2.5 rounded-xl border border-indigo-100 font-bold text-slate-800 shadow-2xs">
                  <span className="text-base">📚</span>
                  <span>कक्षा 1 से 8वीं के सभी 6 विषय (गणित, EVS, हिंदी, English, GK, कंप्यूटर)</span>
                </div>
                <div className="flex items-center gap-2 bg-white/90 p-2.5 rounded-xl border border-indigo-100 font-bold text-slate-800 shadow-2xs">
                  <span className="text-base">📝</span>
                  <span>साप्ताहिक संडे टेस्ट सीरीज और ऑल-बोर्ड रैंकिंग</span>
                </div>
                <div className="flex items-center gap-2 bg-white/90 p-2.5 rounded-xl border border-indigo-100 font-bold text-slate-800 shadow-2xs">
                  <span className="text-base">📲</span>
                  <span>माता-पिता को 1-क्लिक WhatsApp रिपोर्ट कार्ड</span>
                </div>
                <div className="flex items-center gap-2 bg-white/90 p-2.5 rounded-xl border border-indigo-100 font-bold text-slate-800 shadow-2xs">
                  <span className="text-base">🖨️</span>
                  <span>A4 प्रिंट निकालें व हस्तलिखित कॉपी चेकिंग</span>
                </div>
              </div>
            </div>
          )}

          {/* Plan Selector: मासिक vs वार्षिक */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-black text-slate-700 uppercase tracking-wider">
                पैक का चयन करें (Choose Your Plan):
              </span>
              <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                🎉 वार्षिक पैक पर 2 महीने बिल्कुल मुफ़्त
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Monthly Plan */}
              <div
                onClick={() => setSelectedPlan('monthly')}
                className={`p-4 rounded-2xl border-2 cursor-pointer transition-all relative ${
                  selectedPlan === 'monthly'
                    ? 'border-indigo-600 bg-indigo-50/60 shadow-md ring-2 ring-indigo-600/20'
                    : 'border-slate-200 hover:border-indigo-300 bg-white'
                }`}
              >
                {selectedPlan === 'monthly' && (
                  <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                )}
                <div className="text-xs font-black text-slate-600 uppercase">मासिक पैक (Monthly)</div>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-xl font-bold text-indigo-900">₹</span>
                  <span className="text-3xl font-black text-indigo-900 tracking-tight">200</span>
                  <span className="text-xs font-semibold text-slate-500">/माह</span>
                </div>
                <div className="mt-2 text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md inline-block">
                  केवल ₹6.60 प्रति दिन (30 दिन)
                </div>
                <p className="text-[11px] text-slate-500 mt-1.5">
                  सभी 4 विषय, दैनिक होमवर्क चेकर, बोलकर पूछें व संडे टेस्ट।
                </p>
              </div>

              {/* Annual Plan */}
              <div
                onClick={() => setSelectedPlan('annual')}
                className={`p-4 rounded-2xl border-2 cursor-pointer transition-all relative ${
                  selectedPlan === 'annual'
                    ? 'border-purple-600 bg-purple-50/60 shadow-md ring-2 ring-purple-600/20'
                    : 'border-slate-200 hover:border-purple-300 bg-white'
                }`}
              >
                <span className="absolute -top-2.5 right-4 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-xs">
                  ⭐ सबसे लोकप्रिय (Best Value)
                </span>
                {selectedPlan === 'annual' && (
                  <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-purple-600 text-white flex items-center justify-center">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                )}
                <div className="text-xs font-black text-slate-600 uppercase">वार्षिक परीक्षा पैक (Annual)</div>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-xl font-bold text-purple-900">₹</span>
                  <span className="text-3xl font-black text-purple-900 tracking-tight">1,499</span>
                  <span className="text-xs font-semibold text-slate-500">/साल</span>
                </div>
                <div className="mt-2 text-[11px] font-bold text-purple-700 bg-purple-100 px-2 py-0.5 rounded-md inline-block">
                  सिर्फ ₹125/महीना (365 दिन वैलिडिटी)
                </div>
                <p className="text-[11px] text-slate-500 mt-1.5">
                  पूरे साल की ट्यूशन + वार्षिक परीक्षा स्पेशल मॉडल पेपर्स व गाइड।
                </p>
              </div>
            </div>
          </div>

          {/* EXACT COMPARISON TABLE REQUESTED BY USER */}
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200">
            <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider mb-2.5 flex items-center gap-2">
              <span>⚖️ ऑफलाइन ट्यूशन बनाम विद्या AI ट्यूशन की तुलना</span>
            </h4>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-600">
                    <th className="py-2 pr-3 font-bold text-rose-600">❌ गाँव/शहर की ऑफलाइन ट्यूशन</th>
                    <th className="py-2 pl-3 font-bold text-emerald-700 bg-emerald-50/60 rounded-t-lg">✅ विद्या AI ट्यूशन</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-slate-700">
                  <tr>
                    <td className="py-2 pr-3 text-slate-500">₹600 से ₹1,200 प्रति महीना</td>
                    <td className="py-2 pl-3 font-bold text-emerald-800 bg-emerald-50/60">सिर्फ ₹200 प्रति महीना (₹6/दिन)</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-3 text-slate-500">सिर्फ 1 घंटा पढ़ाई, समय की बर्बादी</td>
                    <td className="py-2 pl-3 font-bold text-emerald-800 bg-emerald-50/60">24 घंटे कभी भी, असीमित बार पूछें</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-3 text-slate-500">सिर्फ 1 या 2 विषय</td>
                    <td className="py-2 pl-3 font-bold text-emerald-800 bg-emerald-50/60">गणित, EVS, हिंदी, English, GK, कंप्यूटर सब शामिल</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-3 text-slate-500">डांट और मार का डर</td>
                    <td className="py-2 pl-3 font-bold text-emerald-800 bg-emerald-50/60 rounded-b-lg">प्यार से, आवाज़ में स्टेप-बाय-स्टेप समझाने वाले गुरुजी</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Key Features Quick Checklist */}
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-700 pt-1">
            {[
              'कॉपी की फोटो खींचें और लाल पेन से गलतियाँ सुधारें',
              'माइक दबाकर बोलें — गुरुजी आवाज़ में समझाएंगे',
              'साप्ताहिक संडे टेस्ट एवं WhatsApp प्रोग्रेस रिपोर्ट',
              'स्क्रीन पर ही रफ़ नोटबुक (Scratchpad) में हल करें',
            ].map((f, i) => (
              <li key={i} className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0 stroke-[3]" />
                <span className="font-semibold text-slate-800">{f}</span>
              </li>
            ))}
          </ul>

          {/* Feedback Messages */}
          {successMessage && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-bold flex items-center gap-2 animate-fadeIn">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {errorMessage && (
            <div className="p-3.5 rounded-2xl bg-red-50 border border-red-300 text-red-800 text-xs font-bold flex items-center gap-2 animate-fadeIn">
              <X className="w-5 h-5 text-red-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-2.5 pt-2">
            {/* Main Razorpay / UPI Button */}
            <button
              onClick={handlePayWithRazorpay}
              disabled={isLoading}
              className={`w-full py-3.5 px-5 rounded-2xl text-white font-black text-sm sm:text-base shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 hover:scale-[1.01] active:scale-[0.99] ${
                selectedPlan === 'annual'
                  ? 'bg-purple-600 hover:bg-purple-700 shadow-purple-600/30'
                  : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/30'
              }`}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>कृपया प्रतीक्षा करें...</span>
                </>
              ) : (
                <>
                  <CreditCard className="w-5 h-5" />
                  <span>
                    UPI / Google Pay से ₹{currentAmount} भुगतान करें ({selectedPlan === 'annual' ? 'वार्षिक पैक' : 'मासिक पैक'})
                  </span>
                </>
              )}
            </button>

            {/* Admin Direct Free Test Pass (For User Testing - ₹0) */}
            <button
              type="button"
              onClick={handleAdminFreeTestPass}
              disabled={isLoading}
              className="w-full py-2.5 px-4 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 font-extrabold text-xs transition-all flex items-center justify-center gap-2"
              title="एडमिन या टेस्टर के लिए बिना किसी पेमेंट के फ्री एक्सेस एक्टिव करें"
            >
              <Gift className="w-4 h-4 text-amber-600" />
              <span>🎁 एडमिन फ्री टेस्ट एक्सेस (Test For Free - ₹0)</span>
            </button>
          </div>

          {/* Trust and Supported Gateways */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-medium">
            <span className="flex items-center gap-1">
              <Lock className="w-3.5 h-3.5 text-emerald-600" /> 100% सुरक्षित Razorpay पेमेंट
            </span>
            <div className="flex items-center gap-1.5 font-bold text-slate-600">
              <span className="bg-slate-100 px-1.5 py-0.5 rounded text-[10px]">Google Pay</span>
              <span className="bg-slate-100 px-1.5 py-0.5 rounded text-[10px]">PhonePe</span>
              <span className="bg-slate-100 px-1.5 py-0.5 rounded text-[10px]">Paytm / UPI</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
