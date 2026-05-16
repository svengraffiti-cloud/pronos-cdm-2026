import { NextResponse } from "next/server";
import { supabase } from "../../../lib/supabase";

export async function POST(request) {
  try {
    const body = await request.json();

    const subscription = body.subscription || body;
    const userId = body.user_id || null;
    const playerId = body.player_id || null;

    if (!subscription?.endpoint) {
      return NextResponse.json(
        { error: "Subscription invalide." },
        { status: 400 }
      );
    }

    const { error } = await supabase.from("push_subscriptions").upsert(
      {
        endpoint: subscription.endpoint,
        subscription,
        user_id: userId,
        player_id: playerId,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "endpoint",
      }
    );

    if (error) {
      throw error;
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("save-subscription error:", error);

    return NextResponse.json(
      { error: "Erreur sauvegarde subscription." },
      { status: 500 }
    );
  }
}
