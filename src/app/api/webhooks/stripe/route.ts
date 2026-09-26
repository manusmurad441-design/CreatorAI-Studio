import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("Stripe is not configured");
  return new Stripe(key, { apiVersion: "2025-02-24.acacia" });
}

// Service role client for webhook (bypasses RLS)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Missing signature or webhook secret" }, { status: 400 });
  }

  const stripe = getStripe();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err: any) {
    console.error("Webhook signature verification failed:", err.message);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.client_reference_id || session.metadata?.user_id;

      if (userId && session.mode === "subscription") {
        const subscriptionId = session.subscription as string;
        const sub = await stripe.subscriptions.retrieve(subscriptionId);

        // Upsert subscription
        await supabaseAdmin.from("subscriptions").upsert(
          {
            user_id: userId,
            plan: "pro",
            status: "active",
            payment_provider: "stripe",
            payment_reference: subscriptionId,
            started_at: new Date(sub.current_period_start * 1000).toISOString(),
            expires_at: new Date(sub.current_period_end * 1000).toISOString(),
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id" }
        );

        // Update profile plan
        await supabaseAdmin
          .from("profiles")
          .update({ plan: "pro", updated_at: new Date().toISOString() })
          .eq("user_id", userId);
      }
    }

    if (
      event.type === "customer.subscription.updated" ||
      event.type === "customer.subscription.deleted"
    ) {
      const sub = event.data.object as Stripe.Subscription;
      const userId = sub.metadata?.user_id;

      if (userId) {
        const status =
          sub.status === "active"
            ? "active"
            : sub.status === "canceled"
            ? "canceled"
            : "inactive";

        await supabaseAdmin
          .from("subscriptions")
          .update({
            status,
            expires_at: new Date(sub.current_period_end * 1000).toISOString(),
            updated_at: new Date().toISOString(),
            plan: status === "active" ? "pro" : "free",
          })
          .eq("payment_reference", sub.id);

        if (status !== "active") {
          await supabaseAdmin
            .from("profiles")
            .update({ plan: "free", updated_at: new Date().toISOString() })
            .eq("user_id", userId);
        }
      }
    }
  } catch (err) {
    console.error("Webhook handler error:", err);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
