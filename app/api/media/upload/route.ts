import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
);

function validateTelegramInitData(
  initData: string,
  botToken: string
): Record<string, string> | null {
  try {
    const params = new URLSearchParams(initData);
    const hash = params.get("hash");

    if (!hash) return null;

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

    if (calculatedHash !== hash) return null;

    return Object.fromEntries(params.entries());
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    const initData = formData.get("initData");
    const file = formData.get("file");

    if (typeof initData !== "string") {
      return NextResponse.json(
        { error: "بيانات Telegram غير موجودة" },
        { status: 400 }
      );
    }

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "لم يتم إرسال ملف" },
        { status: 400 }
      );
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "يسمح برفع الصور فقط" },
        { status: 400 }
      );
    }

    // حد أقصى 10MB
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: "حجم الصورة يجب ألا يتجاوز 10MB" },
        { status: 400 }
      );
    }

    const botToken = process.env.TELEGRAM_BOT_TOKEN;

    if (!botToken) {
      return NextResponse.json(
        { error: "TELEGRAM_BOT_TOKEN غير موجود في البيئة" },
        { status: 500 }
      );
    }

    const telegramData = validateTelegramInitData(initData, botToken);

    if (!telegramData) {
      return NextResponse.json(
        { error: "بيانات Telegram غير صالحة" },
        { status: 401 }
      );
    }

    const userJson = telegramData.user;

    if (!userJson) {
      return NextResponse.json(
        { error: "بيانات المستخدم غير موجودة" },
        { status: 401 }
      );
    }

    const telegramUser = JSON.parse(userJson);

    if (!telegramUser.id) {
      return NextResponse.json(
        { error: "معرّف Telegram غير موجود" },
        { status: 401 }
      );
    }

    // البحث عن المستخدم في قاعدة البيانات
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("telegram_id", telegramUser.id)
      .single();

    if (userError || !user) {
      return NextResponse.json(
        { error: "المستخدم غير موجود في قاعدة البيانات" },
        { status: 404 }
      );
    }

    // تجهيز اسم فريد للصورة
    const extension =
      file.name.split(".").pop()?.toLowerCase() || "jpg";

    const randomName = crypto.randomBytes(16).toString("hex");

    const storagePath = `${user.id}/${Date.now()}-${randomName}.${extension}`;

    const buffer = Buffer.from(await file.arrayBuffer());

    // رفع الصورة إلى Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from("media")
      .upload(storagePath, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error("Storage upload error:", uploadError);

      return NextResponse.json(
        {
          error: "فشل رفع الصورة إلى Storage",
          details: uploadError.message,
        },
        { status: 500 }
      );
    }

    // الحصول على الرابط العام
    const { data: publicUrlData } = supabase.storage
      .from("media")
      .getPublicUrl(storagePath);

    const publicUrl = publicUrlData.publicUrl;

    // حفظ معلومات الصورة في media_assets
    const { data: mediaAsset, error: mediaError } = await supabase
      .from("media_assets")
      .insert({
        owner_id: user.id,
        type: "image",
        file_name: file.name,
        mime_type: file.type,
        storage_path: storagePath,
        public_url: publicUrl,
        file_size: file.size,
      })
      .select()
      .single();

    if (mediaError) {
      console.error("Media asset error:", mediaError);

      // إذا فشل تسجيل الصورة في قاعدة البيانات نحذف الملف
      await supabase.storage
        .from("media")
        .remove([storagePath]);

      return NextResponse.json(
        {
          error: "تم رفع الصورة لكن فشل تسجيلها في قاعدة البيانات",
          details: mediaError.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      media: mediaAsset,
      url: publicUrl,
    });
  } catch (error) {
    console.error("Upload error:", error);

    return NextResponse.json(
      {
        error: "حدث خطأ أثناء رفع الصورة",
      },
      { status: 500 }
    );
  }
}
