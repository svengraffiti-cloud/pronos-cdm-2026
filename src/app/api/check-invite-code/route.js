import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const body = await req.json();

    const validCode = "PAPY2026";

    if (body.code !== validCode) {
      return NextResponse.json(
        {
          valid: false,
          error: "Code d'accès famille incorrect.",
        },
        { status: 401 }
      );
    }

    return NextResponse.json({
      valid: true,
    });
  } catch (error) {
    return NextResponse.json(
      {
        valid: false,
        error: "Erreur serveur.",
      },
      { status: 500 }
    );
  }
}
