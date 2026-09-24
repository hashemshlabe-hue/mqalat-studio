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

function escapeHtml(text: string) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function countWords(text: string) {
  return text.trim()
    ? text.trim().split(/\s+/).length
    : 0;
}

function createSlug(title: string) {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\u0600-\u06FFa-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .substring(0, 100);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      initData,
      articleId,
      title,
      content,
      category,
    } = body;

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

    if (!title || !title.trim()) {
      return NextResponse.json(
        {
          success: false,
          message: "عنوان المقال مطلوب.",
        },
        { status: 400 }
      );
    }

    if (!content || !content.trim()) {
      return NextResponse.json(
        {
          success: false,
          message: "محتوى المقال مطلوب.",
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

    const { data: user, error: userError } = await supabaseAdmin
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
     * نتأكد أن المقال يعود لهذا المستخدم
     * حتى لا يستطيع مستخدم تعديل مقال مستخدم آخر.
     */
    const { data: existingArticle, error: articleLookupError } =
      await supabaseAdmin
        .from("articles")
        .select("id, owner_id")
        .eq("id", articleId)
        .eq("owner_id", user.id)
        .maybeSingle();

    if (articleLookupError) {
      console.error(
        "Article lookup error:",
        articleLookupError
      );

      return NextResponse.json(
        {
          success: false,
          message: "حدث خطأ أثناء البحث عن المقال.",
        },
        { status: 500 }
      );
    }

    if (!existingArticle) {
      return NextResponse.json(
        {
          success: false,
          message: "المقال غير موجود أو لا تملك صلاحية تعديله.",
        },
        { status: 404 }
      );
    }

    const cleanTitle = title.trim();
    const cleanContent = content.trim();
    const cleanCategory = category?.trim() || null;

    const wordCount = countWords(cleanContent);
    const slug = createSlug(cleanTitle);

    const jsonContent = {
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
    };

    const htmlContent = `<p>${escapeHtml(cleanContent).replace(
      /\n/g,
      "<br>"
    )}</p>`;

    const excerpt = cleanContent.substring(0, 200);

    const { data: updatedArticle, error: updateError } =
      await supabaseAdmin
        .from("articles")
        .update({
          title: cleanTitle,
          slug,
          content: jsonContent,
          html_content: htmlContent,
          excerpt,
          category: cleanCategory,
          word_count: wordCount,
          updated_at: new Date().toISOString(),
        })
        .eq("id", articleId)
        .eq("owner_id", user.id)
        .select(
          `
          id,
          title,
          slug,
          status,
          category,
          excerpt,
          word_count,
          created_at,
          updated_at,
          published_at
          `
        )
        .single();

    if (updateError) {
      console.error("Article update error:", updateError);

      return NextResponse.json(
        {
          success: false,
          message: "تعذر تحديث المقال.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "تم تحديث المقال بنجاح.",
      article: updatedArticle,
    });
  } catch (error) {
    console.error("Update article API error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "حدث خطأ غير متوقع.",
      },
      { status: 500 }
    );
  }
}
