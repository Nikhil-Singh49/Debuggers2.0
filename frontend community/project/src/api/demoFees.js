const STORAGE_KEY = 'edupulseAditiDemoFees-v2';

export const ADITI_DEMO_FEE_SCHEDULE = [
  { id: 'aditi-demo-fee-1', info: 'Demo · Term 2 tuition fee', amount: 180000, dueDate: '2026-12-01' },
  { id: 'aditi-demo-fee-2', info: 'Demo · Computer lab fee', amount: 10000, dueDate: '2026-12-05' },
  { id: 'aditi-demo-fee-3', info: 'Demo · Library fee', amount: 5000, dueDate: '2026-12-08' },
  { id: 'aditi-demo-fee-4', info: 'Demo · Route B transport fee', amount: 10000, dueDate: '2026-12-10' },
  { id: 'aditi-demo-fee-5', info: 'Demo · Student activity fee', amount: 5000, dueDate: '2026-12-12' },
  { id: 'aditi-demo-fee-6', info: 'Demo · Examination fee', amount: 900, dueDate: '2027-01-05' },
  { id: 'aditi-demo-fee-7', info: 'Demo · Sports fee', amount: 1000, dueDate: '2027-01-08' },
  { id: 'aditi-demo-fee-8', info: 'Demo · Technology fee', amount: 800, dueDate: '2027-01-12' },
  { id: 'aditi-demo-fee-9', info: 'Demo · Annual day fee', amount: 650, dueDate: '2027-01-15' },
  { id: 'aditi-demo-fee-10', info: 'Demo · Term 3 tuition fee', amount: 8500, dueDate: '2027-02-01' },
];

export function createInitialDemoFeeState() {
  return {
    fees: ADITI_DEMO_FEE_SCHEDULE.slice(0, 5).map((fee) => ({ ...fee, status: 'Pending' })),
    nextFeeIndex: 5,
    payments: [],
  };
}

export function loadDemoFeeState() {
  const saved = window.localStorage.getItem(STORAGE_KEY);
  if (!saved) return createInitialDemoFeeState();

  const state = JSON.parse(saved);
  if (
    !state ||
    !Array.isArray(state.fees) ||
    !Array.isArray(state.payments) ||
    !Number.isInteger(state.nextFeeIndex) ||
    state.nextFeeIndex < 5 ||
    state.nextFeeIndex > ADITI_DEMO_FEE_SCHEDULE.length
  ) {
    throw new Error('Saved demo fee records are invalid. Clear this browser’s demo fee data and reload.');
  }
  return state;
}

export function saveDemoFeeState(state) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function recordDemoFeePayment(state, feeId, method, paidAt = new Date()) {
  const fee = state.fees.find((item) => item.id === feeId && item.status === 'Pending');
  if (!fee) throw new Error('This demo fee is no longer pending.');

  const date = paidAt.toISOString().slice(0, 10);
  const payment = {
    id: `DEMO-${paidAt.getTime()}`,
    date,
    student: 'Aditi Sharma',
    amount: fee.amount,
    info: fee.info,
    method,
    status: 'Successful',
    txn: `DEMO-${String(paidAt.getTime()).slice(-8)}`,
  };
  const fees = state.fees.map((item) =>
    item.id === feeId ? { ...item, status: 'Paid', paidAt: date, paymentId: payment.id } : item,
  );
  const nextFee = ADITI_DEMO_FEE_SCHEDULE[state.nextFeeIndex];

  if (nextFee) fees.push({ ...nextFee, status: 'Pending' });

  return {
    state: {
      fees,
      nextFeeIndex: nextFee ? state.nextFeeIndex + 1 : state.nextFeeIndex,
      payments: [payment, ...state.payments],
    },
    payment,
    nextFeeAdded: Boolean(nextFee),
  };
}
