import { NextResponse } from "next/server";
import webpush from "web-push";
import { supabase } from "../../../lib/supabase";

webpush.setVapidDetails(
  "mailto:contact@lespronosdepapy.fr",
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

export async function POST(request) {
  try {
    const secret = request.headers.get("x-admin-secret");

    if (secret !== process.env.NOTIFICATION_ADMIN_SECRET) {
      return NextResponse.json(
        { error: "Non autorisÃ©." },
        { status: 401 }
      );
    }

    const body = await request.json();

    const payload = JSON.stringify({
      title: body.title || "Les Pronos de Papy ðŸ‘´ðŸ»",
      body: body.body || "Nouvelle notification.",
      url: body.url || "/",
    });

    const { data: subscriptions, error } = await supabase
      .from("push_subscriptions")
      .select("*");

    if (error) {
      throw error;
    }

    const results = await Promise.allSettled(
      (subscriptions || []).map((item) =>
        webpush.sendNotification(item.subscription, payload)
      )
    );

    const failedEndpoints = [];

    results.forEach((result, index) => {
      if (result.status === "rejected") {
        const statusCode = result.reason?.statusCode;

        if (statusCode === 404 || statusCode === 410) {
          failedEndpoints.push(subscriptions[index].endpoint);
        }
      }
    });

    if (failedEndpoints.length > 0) {
      await supabase
        .from("push_subscriptions")
        .delete()
        .in("endpoint", failedEndpoints);
    }

    return NextResponse.json({
      ok: true,
      sent: results.filter((result) => result.status === "fulfilled").length,
      failed: results.filter((result) => result.status === "rejected").length,
      cleaned: failedEndpoints.length,
    });
  } catch (error) {
    console.error("send-notification error:", error);

    return NextResponse.json(
      { error: "Erreur envoi notification." },
      { status: 500 }
    );
  }
}
