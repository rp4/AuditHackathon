# Monetization Guide: Premium Agent Documentation

This guide explains how to enable paid/premium agent downloads in OpenAuditSwarms.

## Overview

The platform is built with monetization support from day one, allowing you to easily enable premium content features when ready. All agents are **free by default**, but can be converted to premium with a simple configuration change.

## Architecture

### Database Schema

The documentation system uses a **preview/full split architecture**:

```
Free Agents:
- documentation_preview = Full content
- documentation_full = Full content
- is_premium = false
- price = 0.00

Premium Agents:
- documentation_preview = First 2-3 paragraphs (teaser)
- documentation_full = Complete documentation
- is_premium = true
- price = 10.00 (example)
```

### Key Tables

1. **agents table**
   - `is_premium`: Boolean flag for paid agents
   - `price`: Price in specified currency
   - `currency`: Currency code (USD, EUR, etc.)
   - `documentation_preview`: Public preview content (Tiptap JSON)
   - `documentation_full`: Complete content (requires purchase)
   - `documentation_preview_images`: Image URLs for preview
   - `documentation_full_images`: Image URLs for full content

2. **agent_purchases table**
   - Tracks user purchases
   - Links to payment provider (Stripe, PayPal)
   - Stores payment status and timestamps
   - Ensures one purchase per user per agent

## Enabling Monetization

### Step 1: Update Environment Variables

Add payment provider credentials to `.env.local`:

```bash
# Stripe Configuration (recommended)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Or PayPal Configuration
NEXT_PUBLIC_PAYPAL_CLIENT_ID=...
PAYPAL_SECRET=...
```

### Step 2: Create Payment Integration

Create Stripe checkout session handler:

```typescript
// src/app/api/checkout/route.ts
import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16'
})

export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { agentId } = await req.json()

  // Get agent details
  const { data: agent } = await supabase
    .from('agents')
    .select('id, name, price, currency, slug')
    .eq('id', agentId)
    .single()

  if (!agent || !agent.is_premium) {
    return NextResponse.json({ error: 'Agent not found or not premium' }, { status: 404 })
  }

  // Create Stripe checkout session
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency: agent.currency.toLowerCase(),
          product_data: {
            name: agent.name,
            description: 'Full agent documentation access',
          },
          unit_amount: Math.round(agent.price * 100), // Convert to cents
        },
        quantity: 1,
      },
    ],
    mode: 'payment',
    success_url: `${process.env.NEXT_PUBLIC_URL}/agents/${agent.slug}?purchased=true`,
    cancel_url: `${process.env.NEXT_PUBLIC_URL}/agents/${agent.slug}`,
    metadata: {
      agentId: agent.id,
      userId: user.id,
    },
  })

  return NextResponse.json({ url: session.url })
}
```

### Step 3: Create Webhook Handler

Handle payment confirmations:

```typescript
// src/app/api/webhooks/stripe/route.ts
import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')!

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret)
  } catch (err) {
    return NextResponse.json({ error: 'Webhook signature verification failed' }, { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    const { agentId, userId } = session.metadata!

    // Record purchase in database
    const supabase = createClient()
    await supabase.from('agent_purchases').insert({
      user_id: userId,
      agent_id: agentId,
      amount: (session.amount_total || 0) / 100,
      currency: session.currency?.toUpperCase(),
      payment_provider: 'stripe',
      payment_intent_id: session.payment_intent as string,
      status: 'completed',
    })
  }

  return NextResponse.json({ received: true })
}
```

### Step 4: Enable Premium Toggle in UI

Update the add/edit agent form:

```tsx
// In src/app/add/page.tsx or agent edit form
<div className="space-y-4">
  <div className="flex items-center gap-2">
    <input
      type="checkbox"
      id="is_premium"
      {...register('is_premium')}
      className="rounded"
    />
    <label htmlFor="is_premium" className="font-medium">
      Make this a premium agent (paid download)
    </label>
  </div>

  {watch('is_premium') && (
    <div className="flex gap-4">
      <div className="flex-1">
        <label className="text-sm font-medium">Price</label>
        <Input
          type="number"
          step="0.01"
          min="0.99"
          {...register('price', { valueAsNumber: true })}
          placeholder="9.99"
        />
      </div>
      <div className="w-32">
        <label className="text-sm font-medium">Currency</label>
        <select {...register('currency')} className="w-full">
          <option value="USD">USD</option>
          <option value="EUR">EUR</option>
          <option value="GBP">GBP</option>
        </select>
      </div>
    </div>
  )}
</div>
```

### Step 5: Update Access Control

The access control is already built into the DocumentViewer component and RLS policies. Once payments are configured, it automatically works:

1. User sees preview content
2. Clicks "Purchase" button → Redirects to Stripe
3. Completes payment → Returns to agent page
4. System checks `agent_purchases` table → Shows full content

## Testing Monetization

### Test Mode (No Real Payments)

1. Use Stripe test keys: `pk_test_...` and `sk_test_...`
2. Test card: `4242 4242 4242 4242`, any future expiry, any CVC
3. Manually insert test purchases:

```sql
INSERT INTO agent_purchases (user_id, agent_id, amount, currency, payment_provider, payment_intent_id, status)
VALUES ('your-user-id', 'agent-id', 10.00, 'USD', 'stripe', 'pi_test_123', 'completed');
```

### Preview vs Full Content Testing

```sql
-- Make an agent premium
UPDATE agents
SET
  is_premium = true,
  price = 10.00,
  currency = 'USD'
WHERE slug = 'your-agent-slug';

-- View as non-purchaser: should see only documentation_preview
-- View as purchaser: should see documentation_full
-- View as owner: should always see documentation_full
```

## Disabling Monetization

To completely disable monetization features:

### Option 1: Hide UI Only (Recommended)

Keep database structure but hide premium options:

```typescript
// src/config/features.ts
export const FEATURES = {
  MONETIZATION_ENABLED: false, // Set to true when ready
}

// Then in components:
import { FEATURES } from '@/config/features'

{FEATURES.MONETIZATION_ENABLED && (
  <PremiumToggle />
)}
```

### Option 2: Database-Level Disable

Force all agents to be free:

```sql
-- Set all agents to free
UPDATE agents SET is_premium = false, price = 0.00;

-- Prevent premium agents (add constraint)
ALTER TABLE agents ADD CONSTRAINT no_premium_agents CHECK (is_premium = false);

-- When ready to enable, drop constraint:
ALTER TABLE agents DROP CONSTRAINT no_premium_agents;
```

## Revenue Sharing (Optional)

If you want to take a platform fee:

```sql
-- Add to agents table
ALTER TABLE agents ADD COLUMN platform_fee_percent DECIMAL(5,2) DEFAULT 10.00;

-- Add to agent_purchases table
ALTER TABLE agent_purchases
ADD COLUMN platform_fee DECIMAL(10,2),
ADD COLUMN creator_payout DECIMAL(10,2);

-- Calculate on purchase
UPDATE agent_purchases
SET
  platform_fee = amount * (SELECT platform_fee_percent FROM agents WHERE id = agent_id) / 100,
  creator_payout = amount * (1 - (SELECT platform_fee_percent FROM agents WHERE id = agent_id) / 100)
WHERE id = 'purchase-id';
```

## Analytics & Reporting

Track sales with built-in queries:

```sql
-- Creator's total sales
SELECT
  a.name,
  COUNT(ap.id) as sales_count,
  SUM(ap.amount) as total_revenue
FROM agents a
LEFT JOIN agent_purchases ap ON a.id = ap.agent_id
WHERE a.user_id = 'creator-user-id' AND ap.status = 'completed'
GROUP BY a.id, a.name;

-- Platform-wide sales
SELECT
  COUNT(*) as total_sales,
  SUM(amount) as total_revenue,
  AVG(amount) as avg_price
FROM agent_purchases
WHERE status = 'completed';
```

## Security Considerations

1. **RLS Policies**: Already implemented - users can only see full documentation if they've purchased
2. **Webhook Verification**: Always verify Stripe signatures to prevent fake purchases
3. **Idempotency**: Use `payment_intent_id` as unique key to prevent duplicate purchases
4. **Refund Handling**: Add webhook handler for `charge.refunded` event

## Migration Path

Current state → Monetization enabled:

```sql
-- Already done! Just need to:
-- 1. Add payment provider credentials
-- 2. Create API routes
-- 3. Enable feature flag
-- 4. Start marking agents as premium
```

All the database structure is already in place. No data migration needed.

## Support & Resources

- [Stripe Checkout Docs](https://stripe.com/docs/payments/checkout)
- [Stripe Webhooks](https://stripe.com/docs/webhooks)
- [PayPal Integration](https://developer.paypal.com/docs/checkout/)
- OpenAuditSwarms Discord: [Coming soon]

## FAQ

**Q: Can I change prices after publishing?**
A: Yes, update the `price` field. Existing purchasers keep access.

**Q: Can users get refunds?**
A: Yes, handle via payment provider. Add webhook for `charge.refunded` to revoke access.

**Q: How do preview lengths work?**
A: Authors can set a "Preview Divider" in the editor, or the first 2-3 paragraphs are used automatically.

**Q: Can I offer discounts?**
A: Yes, use Stripe coupons or create custom pricing logic.

**Q: What about subscriptions?**
A: Modify `agent_purchases` to include `subscription_id` and `expires_at` fields.

---

**Ready to enable monetization?** Follow steps 1-4 above and you're live!
