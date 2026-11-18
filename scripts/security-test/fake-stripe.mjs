// In-memory fake Stripe: every payment intent "succeeds" immediately.
const intents = new Map(); let n = 0;
class FakeStripe {
  constructor() {
    this.paymentIntents = {
      create: async (p) => { const id = `pi_fake_${++n}`; const it = { id, status: 'succeeded', amount: p.amount, metadata: p.metadata || {}, client_secret: id + '_secret' }; intents.set(id, it); return it; },
      retrieve: async (id) => { const it = intents.get(id); if (!it) throw new Error('No such payment_intent'); return it; },
      update: async (id, p) => Object.assign(intents.get(id), p),
    };
    this.webhooks = { constructEvent: () => { throw new Error('fake'); } };
    return new Proxy(this, { get: (t, k) => k in t ? t[k] : new Proxy({}, { get: () => async () => ({ data: [] }) }) });
  }
}
export default FakeStripe;
export { FakeStripe as Stripe };
