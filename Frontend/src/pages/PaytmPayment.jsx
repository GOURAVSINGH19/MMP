import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui';
import { ShieldCheck, ArrowRight, XCircle, CreditCard, Landmark, QrCode } from 'lucide-react';
import api from '../services/api';
import { toast } from 'react-toastify';

export default function PaytmPayment() {
  const { paymentId } = useParams();
  const navigate = useNavigate();

  const [payment, setPayment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState('card');

  useEffect(() => {
    const fetchPaymentDetails = async () => {
      try {
        const response = await api.get(`/payments/${paymentId}`);
        setPayment(response.data);
      } catch (err) {
        toast.error('Failed to load payment details.');
      } finally {
        setLoading(false);
      }
    };
    fetchPaymentDetails();
  }, [paymentId]);

  const handleSimulatePayment = async (status) => {
    setSubmitting(true);
    try {
      await api.post(`/payments/${paymentId}/mock-callback`, {
        status,
        txnId: `TXN-SIM-${Date.now()}`
      });

      toast.success(status === 'SUCCESS' ? 'Payment Simulated Successfully!' : 'Payment Simulation Failed.');
      navigate(`/payment-result?paymentId=${paymentId}&status=${status.toLowerCase()}`);
    } catch (err) {
      toast.error('Simulation error: ' + (err.response?.data?.error || err.message));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[85vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-cyan-500 border-t-transparent" />
      </div>
    );
  }

  if (!payment) {
    return (
      <div className="flex min-h-[85vh] flex-col items-center justify-center gap-4 text-center">
        <XCircle className="h-16 w-16 text-rose-500" />
        <h2 className="text-2xl font-bold text-slate-800">Invalid Payment Session</h2>
        <p className="text-slate-500">The payment session could not be found or has expired.</p>
        <Button onClick={() => navigate('/dashboard')} className="mt-2 bg-slate-900 text-white">
          Go to Dashboard
        </Button>
      </div>
    );
  }

  const baseFee = payment.event.registrationFee;
  const tax = payment.event.tax || 0;
  const convenienceFee = payment.event.convenienceFee || 0;
  const total = payment.amount;

  return (
    <div className="flex min-h-[85vh] items-center justify-center px-4 py-8 bg-[#f5f7fa]">
      <div className="w-full max-w-2xl bg-white shadow-2xl rounded-2xl overflow-hidden border border-slate-200">

        {/* Paytm Header */}
        <div className="bg-[#002970] p-6 text-white flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl font-black tracking-tight text-[#00baf2]">paytm</span>
            <div className="h-6 w-[1px] bg-slate-400 hidden sm:block" />
            <span className="text-xs font-semibold uppercase tracking-widest bg-cyan-500/20 px-2 py-0.5 rounded text-cyan-300">
              Gateway Simulator
            </span>
          </div>
          <div className="text-right text-xs">
            <div className="text-slate-300">Order ID</div>
            <div className="font-mono font-bold text-white text-sm">{payment.orderId}</div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 divide-y md:divide-y-0 md:divide-x divide-slate-200">

          {/* Left panel: Order Summary */}
          <div className="md:col-span-2 p-6 bg-slate-50/50 space-y-6">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Marathon Registration</h3>
              <p className="font-bold text-slate-800 text-lg leading-tight">{payment.event.name}</p>
              <p className="text-xs text-slate-500 mt-1">Category: <span className="font-bold text-cyan-600">{payment.registration.distance}</span></p>
            </div>

            <div className="space-y-2 text-sm border-t border-slate-200/80 pt-4">
              <div className="flex justify-between text-slate-600">
                <span>Registration Fee</span>
                <span>{payment.currency} {baseFee.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Tax</span>
                <span>{payment.currency} {tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Convenience Fee</span>
                <span>{payment.currency} {convenienceFee.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold text-slate-800 text-base border-t border-slate-200/85 pt-2 mt-2">
                <span>Total Amount</span>
                <span className="text-cyan-700">{payment.currency} {total.toFixed(2)}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs text-emerald-600 bg-emerald-50 px-3 py-2 rounded-lg border border-emerald-100">
              <ShieldCheck className="h-4 w-4 shrink-0" />
              <span>Secure 128-bit SSL encrypted transaction</span>
            </div>
          </div>

          {/* Right panel: Payment simulation */}
          <div className="md:col-span-3 p-6 space-y-6">
            <div>
              <h3 className="font-bold text-slate-800 text-base mb-3">Select Payment Method</h3>

              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedMethod('card')}
                  className={`flex flex-col items-center justify-center p-3 rounded-lg border text-xs font-semibold gap-1.5 transition ${selectedMethod === 'card'
                      ? 'border-cyan-600 bg-cyan-50/30 text-cyan-700'
                      : 'border-slate-200 text-slate-500 hover:bg-slate-50'
                    }`}
                >
                  <CreditCard className="h-5 w-5" />
                  <span>Card</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedMethod('upi')}
                  className={`flex flex-col items-center justify-center p-3 rounded-lg border text-xs font-semibold gap-1.5 transition ${selectedMethod === 'upi'
                      ? 'border-cyan-600 bg-cyan-50/30 text-cyan-700'
                      : 'border-slate-200 text-slate-500 hover:bg-slate-50'
                    }`}
                >
                  <QrCode className="h-5 w-5" />
                  <span>UPI / QR</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedMethod('netbanking')}
                  className={`flex flex-col items-center justify-center p-3 rounded-lg border text-xs font-semibold gap-1.5 transition ${selectedMethod === 'netbanking'
                      ? 'border-cyan-600 bg-cyan-50/30 text-cyan-700'
                      : 'border-slate-200 text-slate-500 hover:bg-slate-50'
                    }`}
                >
                  <Landmark className="h-5 w-5" />
                  <span>Net Banking</span>
                </button>
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-sm text-slate-600">
              {selectedMethod === 'card' && (
                <div className="space-y-3">
                  <p className="font-semibold text-slate-700">Simulate Card Transaction</p>
                  <div className="space-y-2">
                    <input type="text" placeholder="Card Number (4000 1234 5678 9010)" className="w-full p-2 border border-slate-200 rounded text-xs bg-white" disabled />
                    <div className="grid grid-cols-2 gap-2">
                      <input type="text" placeholder="Expiry (MM/YY)" className="w-full p-2 border border-slate-200 rounded text-xs bg-white" disabled />
                      <input type="password" placeholder="CVV (***)" className="w-full p-2 border border-slate-200 rounded text-xs bg-white" disabled />
                    </div>
                  </div>
                </div>
              )}
              {selectedMethod === 'upi' && (
                <div className="text-center py-2 space-y-2">
                  <div className="mx-auto w-24 h-24 bg-white border border-slate-200 rounded flex items-center justify-center">
                    <QrCode className="h-16 w-16 text-slate-800" />
                  </div>
                  <p className="text-xs text-slate-500">Scan QR Code using Paytm or any UPI App to pay</p>
                </div>
              )}
              {selectedMethod === 'netbanking' && (
                <div>
                  <p className="font-semibold text-slate-700 mb-2">Simulate Net Banking</p>
                  <select className="w-full p-2 border border-slate-200 rounded text-xs bg-white" disabled>
                    <option>State Bank of India</option>
                    <option>HDFC Bank</option>
                    <option>ICICI Bank</option>
                    <option>Axis Bank</option>
                  </select>
                </div>
              )}
            </div>

            <div className="pt-2 border-t border-slate-100 flex flex-col gap-2.5">
              <Button
                onClick={() => handleSimulatePayment('SUCCESS')}
                className="w-full bg-[#00baf2] hover:bg-[#009bca] text-white py-2.5 font-bold shadow-lg flex items-center justify-center gap-1.5 transition active:scale-[0.99]"
                disabled={submitting}
              >
                <span>Simulate Success</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button
                onClick={() => handleSimulatePayment('FAILURE')}
                variant="outline"
                className="w-full border-rose-200 hover:bg-rose-50 text-rose-600 py-2.5 font-bold flex items-center justify-center gap-1.5 transition"
                disabled={submitting}
              >
                <span>Simulate Failure</span>
              </Button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
