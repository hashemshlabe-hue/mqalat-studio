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
    !crypto.timingSafeEqual(
      receivedBuffer,
      calculatedBuffer
    )
  ) {
    return null;
  }

  const authDate = Number(params.get("auth_date"));

  if (!authDate || !Number.isFinite(authDate)) {
    return null;
  }

  const now = Math.floor(Date.now() / 1000);

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

function createSlug(title: string) {
  const slug = title
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  return slug || `article-${Date.now()}`;
}

function countWords(text: string) {
  return text
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      initData,
      title,
      content,
      category,
    } = body;

    /* =========================
       التحقق من البيانات
    ========================= */

    if (
      typeof initData !== "string" ||
      !initData
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing Telegram initData",
        },
        { status: 400 }
      );
    }

    if (
      typeof title !== "string" ||
      !title.trim()
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "عنوان المقال مطلوب.",
        },
        { status: 400 }
      );
    }

    if (
      typeof content !== "string" ||
      !content.trim()
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "محتوى المقال مطلوب.",
        },
        { status: 400 }
      );
    }

    /* =========================
       التحقق من Telegram
    ========================= */

    const telegramUser =
      validateTelegramInitData(initData);

    if (!telegramUser?.id) {
      return NextResponse.json(
        {
          success: false,
          error:
            "بيانات Telegram غير صالحة أو منتهية.",
        },
        { status: 401 }
      );
    }

    const telegramId =
      Number(telegramUser.id);

    /* =========================
       الحصول على المستخدم
    ========================= */

    const { data: user, error: userError } =
      await supabaseAdmin
        .from("users")
        .select("id")
        .eq("telegram_id", telegramId)
        .maybeSingle();

    if (userError) {
      console.error(
        "User lookup error:",
        userError
      );

      return NextResponse.json(
        {
          success: false,
          error: "فشل الوصول إلى بيانات المستخدم.",
        },
        { status: 500 }
      );
    }

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error:
            "المستخدم غير موجود. أعد فتح التطبيق من Telegram.",
        },
        { status: 404 }
      );
    }

    /* =========================
       تجهيز المقال
    ========================= */

    const cleanTitle = title.trim();
    const cleanContent = content.trim();

    const slug = createSlug(cleanTitle);

    const wordCount =
      countWords(cleanContent);

    /* =========================
       إنشاء المقال
    ========================= */

    const { data: article, error: articleError } =
      await supabaseAdmin
        .from("articles")
        .insert({
          owner_id: user.id,

          title: cleanTitle,

          slug,

          status: "draft",

          content: {
            type: "doc",
            content: [
              {
                type: "paragraph",
                content: [
                  {
                    type: "text",
                    text: cleanContent,
                  },
                ],
              },
            ],
          },

          html_content: `<p>${escapeHtml(
            cleanContent
          )}</p>`,

          excerpt: cleanContent.slice(0, 200),

          category:
            typeof category === "string" &&
            category.trim()
              ? category.trim()
              : null,

          tags: [],

          word_count: wordCount,
        })
        .select()
        .single();

    if (articleError) {
      console.error(
        "Article creation error:",
        articleError
      );

      return NextResponse.json(
        {
          success: false,
          error:
            "فشل إنشاء المقال في قاعدة البيانات.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,

      message: "تم حفظ المقال بنجاح.",

      article,
    });
  } catch (error) {
    console.error(
      "Create article error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error: "حدث خطأ داخلي في الخادم.",
      },
      { status: 500 }
    );
  }
}

function escapeHtml(text: string) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
