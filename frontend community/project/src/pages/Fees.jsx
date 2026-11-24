import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useAuth } from '../context/AuthContext.jsx';
import { useSchool } from '../context/SchoolContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import api from '../api/client.js';
import { loadDemoFeeState, recordDemoFeePayment, saveDemoFeeState } from '../api/demoFees.js';
import Modal, { Badge, ReceiptModal, SkeletonLoader } from '../components/ui.jsx';

export default function Fees() {
  const { user } = useAuth();
  const { data, refresh } = useSchool();
  const toast = useToast();
  const [payModalOpen, setPayModalOpen] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [selectedDemoFee, setSelectedDemoFee] = useState(null);
  const [demoFeeState, setDemoFeeState] = useState(null);
  const [demoFeeError, setDemoFeeError] = useState('');
  const [processing, setProcessing] = useState(false);

  const { register, handleSubmit, reset, setValue } = useForm({
    defaultValues: { info: 'Term 1 tuition fee', method: 'UPI', amount: '8500' }
  });

  useEffect(() => {
    try {
      setDemoFeeState(loadDemoFeeState());
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not load demo fee records';
      setDemoFeeError(message);
      toast(message);
    }
  }, [toast]);

  if (!data) return <SkeletonLoader count={3} />;

  const me = data.students[0];
  const isAditiStudent = user.role === 'Student' && me.name === 'Aditi Sharma';
  const demoFees = demoFeeState?.fees || [];
  const demoFeeTotal = demoFees.reduce((total, fee) => total + fee.amount, 0);
  const demoFeePaid = demoFees
    .filter((fee) => fee.status === 'Paid')
    .reduce((total, fee) => total + fee.amount, 0);
  const demoFeeDue = demoFeeTotal - demoFeePaid;
  const displayedFeeTotal = isAditiStudent ? demoFeeTotal : me.feeTotal;
  const displayedFeePaid = isAditiStudent ? demoFeePaid : me.feePaid;
  const displayedDue = isAditiStudent ? demoFeeDue : me.due;
  const percentPaid = displayedFeeTotal ? Math.round((displayedFeePaid / displayedFeeTotal) * 100) : 100;
  const allPayments = [...(demoFeeState?.payments || []), ...data.payments];
  const rows = user.role === 'Student' ? allPayments.filter((p) => p.student === me.name) : allPayments;

  const openDemoFeePayment = (fee) => {
    setSelectedDemoFee(fee);
    setValue('amount', String(fee.amount));
    setValue('info', fee.info);
    setPayModalOpen(true);
  };

  const onPaySubmit = async (values) => {
    setProcessing(true);
    // Simulate gateway verification pause
    await new Promise((resolve) => setTimeout(resolve, 800));

    try {
      if (isAditiStudent) {
        if (!demoFeeState || !selectedDemoFee) {
          throw new Error('Select a pending demo fee before paying.');
        }
        const result = recordDemoFeePayment(demoFeeState, selectedDemoFee.id, values.method);
        saveDemoFeeState(result.state);
        setDemoFeeState(result.state);
        setPayModalOpen(false);
        setSelectedDemoFee(null);
        reset();
        setSelectedReceipt(result.payment);
        toast(result.nextFeeAdded
          ? 'Demo fee marked paid; the next demo fee was added.'
          : 'Demo fee marked paid; no more scheduled demo fees remain.');
        return;
      }

      const { data: res } = await api.post('/payments', {
        ...values,
        student: user.role === 'Student' ? me.name : values.student,
      });
      setPayModalOpen(false);
      reset();
      setSelectedReceipt(res.payment);
      toast('✓ Payment verified and recorded!');
      refresh();
    } catch (err) {
      toast(err.response?.data?.error?.message || err.message || 'Payment processing failed');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Student Financial Progress Summary */}
      {user.role === 'Student' && (
        <div className="card space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="eyebrow">Tuition & Fee Status</span>
              <h2 className="font-display text-2xl font-bold text-ink">
                ₹{displayedDue.toLocaleString('en-IN')} <span className="text-xs text-muted font-normal">Pending Balance</span>
              </h2>
              <span className="text-xs text-muted">Due date: {me.dueDate}</span>
            </div>

            <div className="flex items-center gap-2">
              {!isAditiStudent && me.due > 0 && (
                <button onClick={() => setPayModalOpen(true)} className="btn-primary">
                  Pay Now ₹{me.due.toLocaleString('en-IN')} →
                </button>
              )}
              <button onClick={() => toast('Physical receipt copy requested from administration.')} className="btn-outline">
                Request Hardcopy
              </button>
            </div>
          </div>

          {/* Progress bar */}
          <div className="space-y-1.5 pt-2">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-muted">Paid: ₹{displayedFeePaid.toLocaleString('en-IN')}</span>
              <span className="text-blue">{percentPaid}% Complete</span>
            </div>
            <div className="h-3 w-full rounded-full bg-slate-100 overflow-hidden">
              <div className="h-full bg-blue transition-all duration-500 rounded-full" style={{ width: `${percentPaid}%` }} />
            </div>
          </div>
        </div>
      )}

      {isAditiStudent && (
        <article className="card overflow-hidden">
          <div className="mb-4">
            <span className="eyebrow">Demo fee schedule</span>
            <h3 className="font-display text-lg font-bold text-ink">Aditi’s Fee Items</h3>
            <p className="text-xs text-muted">Demo only. Paying an item marks it paid and adds the next scheduled demo fee.</p>
          </div>
          {demoFeeError ? (
            <p role="alert" className="text-sm text-red-700">{demoFeeError}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-line bg-slate-50/70 text-[11px] uppercase tracking-wider text-muted font-bold">
                    <th className="py-3 px-4">Fee</th>
                    <th className="py-3 px-4">Due date</th>
                    <th className="py-3 px-4">Amount</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {demoFees.map((fee) => (
                    <tr key={fee.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4 font-semibold text-ink">{fee.info}</td>
                      <td className="py-3 px-4 text-muted">{fee.dueDate}</td>
                      <td className="py-3 px-4 font-bold text-ink">₹{fee.amount.toLocaleString('en-IN')}</td>
                      <td className="py-3 px-4">
                        <Badge status={fee.status.toLowerCase()}>{fee.status}</Badge>
                      </td>
                      <td className="py-3 px-4 text-right">
                        {fee.status === 'Pending' && (
                          <button
                            disabled={!demoFeeState || processing}
                            onClick={() => openDemoFeePayment(fee)}
                            className="btn-primary px-2.5 py-1 text-[11px]"
                          >
                            Pay ₹{fee.amount.toLocaleString('en-IN')}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </article>
      )}

      {/* Action Header for Staff */}
      {user.role !== 'Student' && (
        <div className="flex justify-between items-center">
          <div>
            <h2 className="font-display text-xl font-bold text-ink">Fee & Payment Records</h2>
            <p className="text-xs text-muted">Manage student tuition, transport fees, and payment receipts.</p>
          </div>
          <button onClick={() => setPayModalOpen(true)} className="btn-primary">
            + Record New Payment
          </button>
        </div>
      )}

      {/* Payment History Table */}
      <article className="card overflow-hidden">
        <div className="mb-4">
          <span className="eyebrow">Transactions</span>
          <h3 className="font-display text-lg font-bold text-ink">Payment History</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-line bg-slate-50/70 text-[11px] uppercase tracking-wider text-muted font-bold">
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Student</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">Description</th>
                <th className="py-3 px-4">Method</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Receipt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rows.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3 px-4 text-muted">{p.date}</td>
                  <td className="py-3 px-4 font-bold text-ink">{p.student}</td>
                  <td className="py-3 px-4 font-bold text-ink">₹{p.amount.toLocaleString('en-IN')}</td>
                  <td className="py-3 px-4 text-slate-600">{p.info}</td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded-lg bg-slate-100 text-[11px] font-semibold text-slate-700">
                      {p.method}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <Badge status={p.status === 'Successful' ? 'paid' : 'absent'}>
                      {p.status}
                    </Badge>
                  </td>
                  <td className="py-3 px-4 text-right">
                    {p.status === 'Successful' && (
                      <button onClick={() => setSelectedReceipt(p)} className="btn-outline px-2.5 py-1 text-[11px]">
                        Receipt 📄
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </article>

      {/* Student Account Balances for Staff */}
      {user.role !== 'Student' && (
        <article className="card overflow-hidden">
          <div className="mb-4">
            <span className="eyebrow">Student Roster</span>
            <h3 className="font-display text-lg font-bold text-ink">Student Fee Balances</h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-line bg-slate-50/70 text-[11px] uppercase tracking-wider text-muted font-bold">
                  <th className="py-3 px-4">Student Name</th>
                  <th className="py-3 px-4">Total Fee</th>
                  <th className="py-3 px-4">Paid</th>
                  <th className="py-3 px-4">Due Balance</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {data.students.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4 font-bold text-ink">{s.name} ({s.klass})</td>
                    <td className="py-3 px-4 text-muted">₹{s.feeTotal.toLocaleString('en-IN')}</td>
                    <td className="py-3 px-4 text-lime-800 font-semibold">₹{s.feePaid.toLocaleString('en-IN')}</td>
                    <td className="py-3 px-4 font-bold text-ink">₹{s.due.toLocaleString('en-IN')}</td>
                    <td className="py-3 px-4">
                      <Badge status={s.status.toLowerCase()}>{s.status}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>
      )}

      {/* Pay Now Gateway Modal */}
      {payModalOpen && (
        <Modal title="Secure Payment Gateway" onClose={() => setPayModalOpen(false)}>
          <form className="space-y-4" onSubmit={handleSubmit(onPaySubmit)}>
            {user.role !== 'Student' && (
              <div>
                <label className="block text-xs font-bold text-ink mb-1">Select Student</label>
                <select className="input" {...register('student', { required: true })}>
                  {data.students.map((s) => (
                    <option key={s.id} value={s.name}>{s.name} ({s.klass}) — Due: ₹{s.due}</option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-ink mb-1">Amount (₹)</label>
              <input 
                type="number" 
                className="input font-bold" 
                placeholder="Enter amount" 
                readOnly={isAditiStudent}
                {...register('amount', { required: true })} 
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-ink mb-1">Description / Term</label>
              <input className="input" readOnly={isAditiStudent} {...register('info', { required: true })} />
            </div>

            <div>
              <label className="block text-xs font-bold text-ink mb-1">Payment Method</label>
              <select className="input" {...register('method')}>
                <option value="UPI">UPI (Google Pay / PhonePe / Paytm)</option>
                <option value="Card">Credit / Debit Card</option>
                <option value="Net banking">Net Banking</option>
              </select>
            </div>

            <div className="rounded-xl border border-line bg-canvas p-3 text-xs text-muted">
              Demo payment only. No real payment is processed; a sample receipt is generated when completed.
            </div>

            <button
              disabled={processing}
              className="btn-primary w-full py-3 text-sm font-bold"
            >
              {processing ? 'Verifying Gateway Response...' : 'Complete Payment →'}
            </button>
          </form>
        </Modal>
      )}

      {/* Receipt Modal */}
      <ReceiptModal payment={selectedReceipt} onClose={() => setSelectedReceipt(null)} />
    </div>
  );
}

