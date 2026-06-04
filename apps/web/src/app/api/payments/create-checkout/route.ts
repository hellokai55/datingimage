import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { createCheckout, CREDIT_PACKS, MOCK_CHECKOUT } from '@/lib/creem';
import { z } from 'zod';

const createCheckoutSchema = z.object({
  packId: z.enum(['starter', 'popular', 'pro']),
});

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { packId } = createCheckoutSchema.parse(body);

    const pack = CREDIT_PACKS.find((p) => p.id === packId);
    if (!pack || (!pack.productId && !MOCK_CHECKOUT)) {
      return NextResponse.json(
        { error: 'Invalid credit pack or product not configured' },
        { status: 400 }
      );
    }

    // Get current user using publishable key client (reads user session from cookies)
    const cookieStore = await cookies();
    const authClient = createServerClient(
      SUPABASE_URL,
      SUPABASE_PUBLISHABLE_KEY,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll() {},
        },
      }
    );

    const {
      data: { user },
      error: authError,
    } = await authClient.auth.getUser();

    if (authError || !user?.email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Use service role client for database operations (bypasses RLS)
    const serviceClient = createServerClient(
      SUPABASE_URL,
      SUPABASE_SERVICE_KEY,
      {
        cookies: {
          getAll() {
            return [];
          },
          setAll() {},
        },
      }
    );

    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL || 'https://datingimage.vercel.app';

    // Create order record first (pending status)
    const { data: order, error: orderError } = await serviceClient
      .from('orders')
      .insert({
        user_id: user.id,
        status: 'pending',
        amount: pack.price,
        credits: pack.credits,
        currency: 'USD',
        metadata: {
          pack_id: packId,
          pack_name: pack.name,
        },
      })
      .select()
      .single();

    if (orderError || !order) {
      console.error('Failed to create order:', orderError);
      return NextResponse.json(
        { error: 'Failed to create order' },
        { status: 500 }
      );
    }

    // Create Creem checkout
    const checkout = await createCheckout({
      requestId: order.id,
      customerEmail: user.email,
      productId: pack.productId,
      successUrl: `${siteUrl}/checkout/success?order_id=${order.id}`,
      cancelUrl: `${siteUrl}/checkout/cancelled?order_id=${order.id}`,
    });

    // Update order with Creem checkout ID
    await serviceClient
      .from('orders')
      .update({ creem_checkout_id: checkout.id })
      .eq('id', order.id);

    return NextResponse.json({
      checkoutUrl: checkout.url,
      orderId: order.id,
    });
  } catch (err) {
    console.error('Checkout creation error:', err);
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request', details: err.issues },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to create checkout' },
      { status: 500 }
    );
  }
}