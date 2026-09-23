import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";

const MAX_AUTH_AGE = 24 * 60 * 60;

function validateTelegramInitData(initData: string) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;

  if (!botToken) {
    throw new Error("Missing TELEGRAM_BOT_TOKEN");
  }

  const params = new URLSearchParams(initData);
  const receivedHash = params.get("hash");

  if (!receivedHash) {
    return null;
  }

  params.delete("hash");

  const dataCheckString = Array.from(params.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join("\n");

  const secretKey = crypto
    .createHmac("sha256", "WebAppData")
    .update(botToken)
    .digest();

  const calculatedHash = crypto
    .createHmac("sha256", secretKey)
    .update(dataCheckString)
    .digest("hex");

  if (
    calculatedHash.length !== receivedHash.length ||
    !crypto.timingSafeEqual(
      Buffer.from(calculatedHash),
      Buffer.from(receivedHash)
    )
  ) {
    return null;
  }

  const authDate = Number(params.get("auth_date"));

  if (!authDate || Math.floor(Date.now() / 1000) - authDate > MAX_AUTH_AGE) {
    return null;
  }

  const userString = params.get("user");

  if (!userString) {
    return null;
  }

  try {
    return JSON.parse(userString);
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body?.initData) {
      return NextResponse.json(
        { ok: false, error: "Missing Telegram initData" },
        { status: 400 }
      );
    }

    const telegramUser = validateTelegramInitData(body.initData);

    if (!telegramUser?.id) {
      return NextResponse.json(
        { ok: false, error: "Invalid Telegram authentication data" },
        { status: 401 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey =
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Missing Supabase environment variables");
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: user, error } = await supabase
      .from("users")
      .upsert(
        {
          telegram_id: telegramUser.id,
          username: telegramUser.username ?? null,
          first_name: telegramUser.first_name ?? null,
          last_name: telegramUser.last_name ?? null,
          language_code: telegramUser.language_code ?? "ar",
          is_premium: telegramUser.is_premium ?? false,
          last_seen_at: new Date().toISOString(),
        },
        {
          onConflict: "telegram_id",
        }
      )
      .select(
        "id, telegram_id, username, first_name, last_name, language_code, is_premium, created_at, updated_at, last_seen_at"
      )
      .single();

    if (error) {
      console.error("Supabase user error:", error);

      return NextResponse.json(
        {
          ok: false,
          error: "Could not create or update user",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      user,
    });
  } catch (error) {
    console.error("Telegram authentication error:", error);

    return NextResponse.json(
      {
        ok: false,
        error: "Authentication server error",
      },
      { status: 500 }
    );
  }
}
