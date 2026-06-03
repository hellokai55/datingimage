import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(request: Request) {
  try {
    const payload = await request.text();
    const signature = request.headers.get('x-creem-signature') || '';
    const webhookSecret = process.env.CREEM_WEBHOOK_SECRET;

    // Verify webhook signature if secret is configured
    if (webhookSecret) {
      const crypto = await import('crypto');
      const expected = crypto
        .createHmac('sha256', webhookSecret)
        .update(payload)
        .digest('hex');

      try {
        const sigBuf = Buffer.from(signature);
        const expBuf = Buffer.from(expected);
        if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
          return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
        }
      } catch {
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
      }
    }

    const event = JSON.parse(payload);
    const eventType = event.event_type || event.type;

    // Only handle checkout.completed events
    if (eventType !== 'checkout.completed') {
      return NextResponse.json({ status: 'ignored', eventType });
    }

    const checkoutData = event.data?.checkout || event.data;
    const checkoutId = checkoutData?.id;
    const paymentId = checkoutData?.payment?.id || checkoutData?.payment_id;
    const requestId = checkoutData?.request_id;

    if (!checkoutId || !requestId) {
      return NextResponse.json(
        { error: 'Missing checkout or request ID' },
        { status: 400 }
      );
    }

    // Use service role client
    const cookieStore = await cookies();
    const supabase = createServerClient(
      SUPABASE_URL,
      SUPABASE_SERVICE_KEY,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll() {},
        },
      }
    );

    // Find order by Creem checkout ID or request ID
    const { data: order, error: findError } = await supabase
      .from('orders')
      .select('*')
      .or(`creem_checkout_id.eq.${checkoutId},id.eq.${requestId}`)
      .single();

    if (findError || !order) {
      console.error('Order not found:', findError, { checkoutId, requestId });
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Idempotency: already processed
    if (order.status === 'completed') {
      return NextResponse.json({ status: 'already_completed' });
    }

    if (order.status !== 'pending') {
      return NextResponse.json(
        { error: `Order status is ${order.status}` },
        { status: 400 }
      );
    }

    // Call RPC to add credits and mark order as completed
    const { error: rpcError } = await supabase.rpc('add_credits_from_order', {
      p_order_id: order.id,
      p_creem_payment_id: paymentId || checkoutId,
    });

    if (rpcError) {
      console.error('Failed to process payment:', rpcError);
      // Mark as failed
      await supabase.rpc('fail_order', {
        p_order_id: order.id,
        p_reason: rpcError.message,
      });
      return NextResponse.json(
        { error: 'Failed to process payment' },
        { status: 500 }
      );
    }

    return NextResponse.json({ status: 'completed', orderId: order.id });
  } catch (err) {
    console.error('Webhook processing error:', err);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}