import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { enforceRateLimit, getClientIp } from '@/lib/rate-limit';
import { captureServerError } from '@/lib/sentry';

export async function POST(request) {
  const ip = getClientIp(request);
  const limit = enforceRateLimit(`payments:${ip}`, 300, 60 * 1000);

  if (!limit.allowed) {
    return NextResponse.json({ success: false, error: 'Rate limit exceeded (300 req/min).' }, { status: 429 });
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ success: false, error: 'Stripe is not configured yet.' }, { status: 503 });
  }

  try {
    const payload = await request.json();
    const amount = Number(payload.amount || 19900);
    const customerEmail = payload.customerEmail;
    const storeName = payload.storeName || 'Township Store';

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      customer_email: customerEmail || undefined,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: 'zar',
            unit_amount: amount,
            product_data: {
              name: `Township Banking - ${storeName}`,
              description: 'Platform subscription for township entrepreneurs',
            },
          },
        },
      ],
      success_url: `${baseUrl}/?payment=success`,
      cancel_url: `${baseUrl}/?payment=cancelled`,
    });

    return NextResponse.json({ success: true, url: session.url });
  } catch (error) {
    captureServerError(error, { route: '/api/payments/checkout' });
    return NextResponse.json({ success: false, error: 'Stripe checkout failed.' }, { status: 500 });
  }
}