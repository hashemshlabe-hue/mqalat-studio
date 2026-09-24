import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY!;
const botToken = process.env.TELEGRAM_BOT_TOKEN!;

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
  try {
    const params = new URLSearchParams(initData);

    const hash = params.get("hash");

    if (!hash) {
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

    const hashBuffer = Buffer.from(hash, "hex");
    const calculatedBuffer = Buffer.from(calculatedHash, "hex");

    if (
      hashBuffer.length !== calculatedBuffer.length ||
      !crypto.timingSafeEqual(hashBuffer, calculatedBuffer)
    ) {
      return null;
    }

    const authDate = Number(params.get("auth_date"));

    if (!authDate) {
      return null;
    }

    const now = Math.floor(Date.now() / 1000);

    if (now - authDate > 86400) {
      return null;
    }

    const userData = params.get("user");

    if (!userData) {
      return null;
    }

    return JSON.parse(userData);
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { initData, articleId } = body;

    if (!initData) {
      return NextResponse.json(
        {
          success: false,
          message: "بيانات Telegram غير موجودة.",
        },
        { status: 400 }
      );
    }

    if (!articleId) {
      return NextResponse.json(
        {
          success: false,
          message: "معرّف المقال غير موجود.",
        },
        { status: 400 }
      );
    }

    const telegramUser = validateTelegramInitData(initData);

    if (!telegramUser) {
      return NextResponse.json(
        {
          success: false,
          message: "بيانات Telegram غير صالحة.",
        },
        { status: 401 }
      );
    }

    const telegramId = Number(telegramUser.id);

    const { data: user, error: userError } =
      await supabaseAdmin
        .from("users")
        .select("id")
        .eq("telegram_id", telegramId)
        .maybeSingle();

    if (userError) {
      console.error("User lookup error:", userError);

      return NextResponse.json(
        {
          success: false,
          message: "حدث خطأ أثناء البحث عن المستخدم.",
        },
        { status: 500 }
      );
    }

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "المستخدم غير موجود.",
        },
        { status: 404 }
      );
    }

    /*
     * الحذف مربوط بـ owner_id
     * حتى لا يستطيع المستخدم حذف مقال مستخدم آخر.
     */
    const { data: article, error: articleError } =
      await supabaseAdmin
        .from("articles")
        .select("id")
        .eq("id", articleId)
        .eq("owner_id", user.id)
        .maybeSingle();

    if (articleError) {
      console.error(
        "Article lookup error:",
        articleError
      );

      return NextResponse.json(
        {
          success: false,
          message: "حدث خطأ أثناء البحث عن المقال.",
        },
        { status: 500 }
      );
    }

    if (!article) {
      return NextResponse.json(
        {
          success: false,
          message:
            "المقال غير موجود أو لا تملك صلاحية حذفه.",
        },
        { status: 404 }
      );
    }

    const { error: deleteError } =
      await supabaseAdmin
        .from("articles")
        .delete()
        .eq("id", articleId)
        .eq("owner_id", user.id);

    if (deleteError) {
      console.error(
        "Article delete error:",
        deleteError
      );

      return NextResponse.json(
        {
          success: false,
          message: "تعذر حذف المقال.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "تم حذف المقال بنجاح.",
    });
  } catch (error) {
    console.error(
      "Delete article API error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message: "حدث خطأ غير متوقع.",
      },
      { status: 500 }
    );
  }
}
