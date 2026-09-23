"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type AuthState = "loading" | "success" | "error" | "outside";

interface UserData {
  id: string;
  telegram_id: number;
  username: string | null;
  first_name: string | null;
  last_name: string | null;
  language_code: string | null;
  is_premium: boolean;
}

export default function Home() {
  const [status, setStatus] = useState<AuthState>("loading");
  const [message, setMessage] = useState("جاري الاتصال بـ Telegram...");
  const [user, setUser] = useState<UserData | null>(null);

  useEffect(() => {
    async function authenticate() {
      const webApp = window.Telegram?.WebApp;

      if (!webApp) {
        setStatus("outside");
        setMessage(
          "افتح التطبيق من داخل Telegram حتى يتم تسجيل الدخول تلقائيًا."
        );
        return;
      }

      webApp.ready();
      webApp.expand();

      const initData = webApp.initData;

      if (!initData) {
        setStatus("error");
        setMessage("لم تصل بيانات المصادقة من Telegram.");
        return;
      }

      try {
        const response = await fetch("/api/auth/telegram", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            initData,
          }),
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(
            result.error || "فشل التحقق من حساب Telegram."
          );
        }

        setUser(result.user);
        setStatus("success");
        setMessage("تم تسجيل الدخول بنجاح.");
      } catch (error) {
        console.error("Authentication error:", error);

        setStatus("error");
        setMessage(
          error instanceof Error
            ? error.message
            : "حدث خطأ أثناء تسجيل الدخول."
        );
      }
    }

    authenticate();
  }, []);

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#f5f7fb",
        padding: "24px",
        direction: "rtl",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "600px",
          background: "#ffffff",
          borderRadius: "24px",
          padding: "40px 30px",
          textAlign: "center",
          boxShadow: "0 12px 40px rgba(0,0,0,0.08)",
        }}
      >
        <div
          style={{
            width: "70px",
            height: "70px",
            borderRadius: "20px",
            background: "#111827",
            color: "#ffffff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 20px",
            fontSize: "30px",
            fontWeight: 700,
          }}
        >
          م
        </div>

        <h1 style={{ marginBottom: "12px" }}>
          مقالات
        </h1>

        <p
          style={{
            color: "#666",
            marginBottom: "28px",
          }}
        >
          Article Studio
        </p>

        <div
          style={{
            padding: "18px",
            borderRadius: "16px",
            background:
              status === "success"
                ? "#ecfdf5"
                : status === "error"
                  ? "#fef2f2"
                  : "#f3f4f6",
          }}
        >
          <strong>{message}</strong>
        </div>

        {status === "success" && user && (
          <div style={{ marginTop: "24px" }}>
            <h2>
              مرحبًا {user.first_name || "بك"} 👋
            </h2>

            {user.username && (
              <p style={{ color: "#666" }}>
                @{user.username}
              </p>
            )}

            <p
              style={{
                marginTop: "18px",
                color: "#16a34a",
                fontWeight: 700,
              }}
            >
              تم ربط حسابك بقاعدة البيانات بنجاح ✅
            </p>
          </div>
        )}

        {status === "outside" && (
          <p
            style={{
              marginTop: "24px",
              color: "#666",
              lineHeight: 1.8,
            }}
          >
            هذا التطبيق مصمم ليعمل داخل Telegram Mini App.
            <br />
            افتحه من زر التطبيق داخل البوت.
          </p>
        )}
      </div>
    </main>
  );
}
