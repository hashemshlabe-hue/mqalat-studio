import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY;
const telegramBotToken = process.env.TELEGRAM_BOT_TOKEN;

if (!supabaseUrl) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL");
}

if (!supabaseSecretKey) {
  throw new Error("Missing SUPABASE_SECRET_KEY");
}

if (!telegramBotToken) {
  throw new Error("Missing TELEGRAM_BOT_TOKEN");
}

const supabaseAdmin = createClient(
  supabaseUrl,
  supabaseSecretKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

function validateTelegramInitData(initData: string) {
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
    .update(telegramBotToken!)
    .digest();

  const calculatedHash = crypto
    .createHmac("sha256", secretKey)
    .update(dataCheckString)
    .digest("hex");

  const receivedBuffer = Buffer.from(receivedHash, "hex");
  const calculatedBuffer = Buffer.from(calculatedHash, "hex");

  if (
    receivedBuffer.length !== calculatedBuffer.length ||
    !crypto.timingSafeEqual(receivedBuffer, calculatedBuffer)
  ) {
    return null;
  }

  const authDate = Number(params.get("auth_date"));

  if (!authDate || !Number.isFinite(authDate)) {
    return null;
  }

  const now = Math.floor(Date.now() / 1000);

  // رفض بيانات Telegram الأقدم من 24 ساعة.
  if (now - authDate > 86400) {
    return null;
  }

  const userRaw = params.get("user");

  if (!userRaw) {
    return null;
  }

  try {
    return JSON.parse(userRaw);
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const initData = body?.initData;

    if (typeof initData !== "string" || !initData) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing Telegram initData",
        },
        { status: 400 }
      );
    }

    const telegramUser = validateTelegramInitData(initData);

    if (!telegramUser?.id) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid Telegram authentication data",
        },
        { status: 401 }
      );
    }

    const telegramId = Number(telegramUser.id);

    const { data: existingUser, error: lookupError } =
      await supabaseAdmin
        .from("users")
        .select("*")
        .eq("telegram_id", telegramId)
        .maybeSingle();

    if (lookupError) {
      console.error("User lookup error:", lookupError);

      return NextResponse.json(
        {
          success: false,
          error: "Database lookup failed",
        },
        { status: 500 }
      );
    }

    const userData = {
      telegram_id: telegramId,
      username: telegramUser.username ?? null,
      first_name: telegramUser.first_name ?? null,
      last_name: telegramUser.last_name ?? null,
      language_code: telegramUser.language_code ?? "ar",
      is_premium: telegramUser.is_premium ?? false,
      last_seen_at: new Date().toISOString(),
    };

    let user;

    if (existingUser) {
      const { data, error } = await supabaseAdmin
        .from("users")
        .update(userData)
        .eq("id", existingUser.id)
        .select()
        .single();

      if (error) {
        console.error("User update error:", error);

        return NextResponse.json(
          {
            success: false,
            error: "Failed to update user",
          },
          { status: 500 }
        );
      }

      user = data;
    } else {
      const { data, error } = await supabaseAdmin
        .from("users")
        .insert(userData)
        .select()
        .single();

      if (error) {
        console.error("User insert error:", error);

        return NextResponse.json(
          {
            success: false,
            error: "Failed to create user",
          },
          { status: 500 }
        );
      }

      user = data;

      const { error: settingsError } = await supabaseAdmin
        .from("user_settings")
        .insert({
          user_id: user.id,
        });

      if (settingsError) {
        console.error("Settings creation error:", settingsError);

        return NextResponse.json(
          {
            success: false,
            error: "User created but settings creation failed",
          },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        telegram_id: user.telegram_id,
        username: user.username,
        first_name: user.first_name,
        last_name: user.last_name,
        language_code: user.language_code,
        is_premium: user.is_premium,
      },
    });
  } catch (error) {
    console.error("Telegram authentication error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 }
    );
  }
}
