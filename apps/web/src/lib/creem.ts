import 'server-only';

const CREEM_API_KEY = process.env.CREEM_API_KEY;
const CREEM_API_URL = process.env.CREEM_API_URL || 'https://api.creem.io/v1';
export const MOCK_CHECKOUT = process.env.CREEM_MOCK_CHECKOUT === 'true' || !CREEM_API_KEY;

function getApiKey(): string {
  if (!CREEM_API_KEY) {
    throw new Error('CREEM_API_KEY is not set');
  }
  return CREEM_API_KEY;
}

export interface CreemCheckoutInput {
  requestId: string;
  customerEmail: string;
  productId: string;
  successUrl: string;
  cancelUrl?: string;
}

export interface CreemCheckout {
  id: string;
  url: string;
  status: string;
}

export async function createCheckout(
  input: CreemCheckoutInput
): Promise<CreemCheckout> {
  // Mock mode for local development / testing without real Creem credentials
  if (MOCK_CHECKOUT) {
    console.log('[MOCK] Creating checkout for', input.requestId);
    return {
      id: `mock_${input.requestId}`,
      url: input.successUrl,
      status: 'pending',
    };
  }

  const response = await fetch(`${CREEM_API_URL}/checkouts`, {
    method: 'POST',
    headers: {
      'x-api-key': getApiKey(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      request_id: input.requestId,
      customer: {
        email: input.customerEmail,
      },
      product_id: input.productId,
      success_url: input.successUrl,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Creem API error: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  return {
    id: data.id,
    url: data.url || data.checkout_url,
    status: data.status || 'pending',
  };
}

// Webhook verification
export function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  // Creem uses HMAC-SHA256 for webhook signatures
  // Implementation depends on Creem's exact signature format
  // For now, we do a basic check (to be refined with actual Creem docs)
  if (!secret || !signature) return false;
  
  const crypto = require('crypto');
  const expected = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expected)
  );
}

// Credit packs configuration
export const CREDIT_PACKS = [
  {
    id: 'starter',
    name: 'Starter Pack',
    credits: 20,
    price: 4.99,
    productId: process.env.CREEM_PRODUCT_ID_STARTER || '',
  },
  {
    id: 'popular',
    name: 'Popular Pack',
    credits: 50,
    price: 9.99,
    productId: process.env.CREEM_PRODUCT_ID_POPULAR || '',
  },
  {
    id: 'pro',
    name: 'Pro Pack',
    credits: 120,
    price: 19.99,
    productId: process.env.CREEM_PRODUCT_ID_PRO || '',
  },
] as const;