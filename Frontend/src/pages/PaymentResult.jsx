import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Button, Card, CardContent, CardHeader, CardTitle, CardFooter } from '../components/ui';
import { CheckCircle2, XCircle, ArrowRight, RefreshCw, MessageSquare } from 'lucide-react';
import api from '../services/api';
import { toast } from 'react-toastify';

export default function PaymentResult() {
  const [searchParams] = useSearchParams();
  const paymentId = searchParams.get('paymentId');
  const queryStatus = searchParams.get('status');
  const navigate = useNavigate();

const whtsapplink = import.meta.env.VITE_WHATSAPP_LINK;

  const [payment, setPayment] = useState(null);
  const [whatsappLink, setWhatsappLink] = useState(whtsapplink);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPaymentAndWhatsApp = async () => {
      try {
        const pResponse = await api.get(`/payments/${paymentId}`);
        setPayment(pResponse.data);

        // Fetch whatsapp link
        const wResponse = await api.get(`/payments/whatsapp-groups/${pResponse.data.eventId}`);
        const communityGroup = wResponse.data.find(g => g.groupType === 'COMMUNITY');
        if (communityGroup?.link) {
          setWhatsappLink(communityGroup.link);
        }
      } catch (err) {
        console.error('Error fetching details:', err);
      } finally {
        setLoading(false);
      }
    };

    if (paymentId) {
      fetchPaymentAndWhatsApp();
    } else {
      setLoading(false);
    }
  }, [paymentId]);

  const handleRetry = async () => {
    if (!payment) return;
    setLoading(true);
    try {
      // Re-initiate payment
      const response = await api.post('/payments', {
        registrationId: payment.registrationId
      });
      toast.info('Restarting payment checkout...');
      navigate(`/paytm-checkout/${response.data.payment.id}`);
    } catch (err) {
      toast.error('Failed to restart payment: ' + (err.response?.data?.error || err.message));
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-purple-600 border-t-transparent" />
      </div>
    );
  }

  const isSuccess = queryStatus === 'success' || payment?.status === 'SUCCESSFUL';

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4 py-8 bg-slate-50/50 dark:bg-slate-900/10">
      <Card className="w-full max-w-lg border-slate-200/50 dark:border-slate-800/40 shadow-xl transition-all duration-300">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full mb-4">
            {isSuccess ? (
              <CheckCircle2 className="h-16 w-16 text-emerald-500 animate-bounce" />
            ) : (
              <XCircle className="h-16 w-16 text-rose-500 animate-pulse" />
            )}
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            {isSuccess ? 'Payment Successful' : 'Payment Failed'}
          </CardTitle>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            {isSuccess
              ? 'Thank you! Your registration has been confirmed.'
              : 'There was a problem processing your payment transaction.'}
          </p>
        </CardHeader>

        <CardContent className="space-y-6">
          {payment && (
            <div className="p-4 bg-slate-100/60 dark:bg-slate-900/40 rounded-xl space-y-2 border border-slate-200/50 dark:border-slate-800/40 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Order ID:</span>
                <span className="font-mono font-semibold">{payment.orderId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Transaction ID:</span>
                <span className="font-mono text-xs">{payment.txnId || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Amount Paid:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {payment.currency} {payment.amount.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Status:</span>
                <span
                  className={`font-semibold px-2 py-0.5 rounded text-xs ${
                    isSuccess
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/20 dark:text-emerald-400'
                      : 'bg-rose-100 text-rose-800 dark:bg-rose-950/20 dark:text-rose-400'
                  }`}
                >
                  {payment.status}
                </span>
              </div>
            </div>
          )}

          {isSuccess && (
            <div className="p-4 bg-teal-50 dark:bg-teal-950/20 rounded-xl border border-teal-100 dark:border-teal-900/30 flex flex-col items-center text-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-teal-100 dark:bg-teal-950 text-teal-600 dark:text-teal-400">
                <MessageSquare className="h-5 w-5" />
              </div>
              <div>
                <h4 className="font-bold text-teal-800 dark:text-teal-400 text-sm">Official WhatsApp Community</h4>
                <p className="text-xs text-teal-600 dark:text-teal-500 mt-1 max-w-sm">
                  Join other marathoners and stay updated on route details, kit collection timings, and BIB distribution updates.
                </p>
              </div>
              <a
                href={whatsappLink}
                target="_blank"
                rel="noreferrer"
                className="w-full bg-[#25d366] hover:bg-[#20ba5a] text-white py-2 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 shadow"
              >
                <span>Join Official WhatsApp Group</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </a>
            </div>
          )}
        </CardContent>

        <CardFooter className="pt-2">
          {isSuccess ? (
            <Button
              onClick={() => navigate('/dashboard')}
              className="w-full bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 flex items-center justify-center gap-2 hover:opacity-90"
            >
              <span>Go to Participant Dashboard</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          ) : (
            <div className="w-full flex flex-col sm:flex-row gap-2">
              <Button
                onClick={handleRetry}
                className="flex-1 bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 flex items-center justify-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                <span>Retry Payment</span>
              </Button>
              <Button
                onClick={() => navigate('/dashboard')}
                variant="outline"
                className="flex-1"
              >
                <span>Dashboard</span>
              </Button>
            </div>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
