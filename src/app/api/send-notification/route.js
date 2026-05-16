import { NextResponse } from "next/server";
import webpush from "web-push";
import { supabase } from "../../../lib/supabase";

export const dynamic = "force-dynamic";

export async function POST(req) {
  try {
    const vapidEmail = process.env.VAPID_EMAIL;
    const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;

    if (!vapidEmail || !vapidPublicKey || !vapidPrivateKey) {
      return NextResponse.json(
        { error: "Configuration VAPID manquante" },
        { status: 500 }
      );
    }

    webpush.setVapidDetails(
      vapidEmail,
      vapidPublicKey,
      vapidPrivateKey
    );

    const body = await req.json();

    if (body.secret !== process.env.NOTIFICATION_ADMIN_SECRET) {
      return NextResponse.json(
        { error: "Non autorisé" },
        { status: 401 }
      );
    }

    const { data: subscriptions, error } = await supabase
      .from("push_subscriptions")
      .select("*");

    if (error) {
      throw error;
    }

    const payload = JSON.stringify({
      title: body.title || "Les Pronos de Papy",
      body: body.message || "Nouvelle notification disponible",
      url: body.url || "/",
    });

    const results = await Promise.allSettled(
      (subscriptions || []).map((sub) =>
        webpush.sendNotification(sub.subscription, payload)
      )
    );

    return NextResponse.json({
      ok: true,
      sent: results.length,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}
