"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function Home() {
  const [status, setStatus] = useState("جاري اختبار الاتصال...");
  const [details, setDetails] = useState("");

  useEffect(() => {
    async function testConnection() {
      const { data, error } = await supabase
        .from("articles")
        .select("id")
        .limit(1);

      if (error) {
        setStatus("فشل الاتصال ❌");
        setDetails(error.message);
        return;
      }

      setStatus("الاتصال ناجح ✅");
      setDetails(`تم الوصول إلى قاعدة البيانات. عدد النتائج: ${data.length}`);
    }

    testConnection();
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
          background: "#fff",
          borderRadius: "20px",
          padding: "40px",
          width: "100%",
          maxWidth: "600px",
          textAlign: "center",
          boxShadow: "0 10px 40px rgba(0,0,0,.08)",
        }}
      >
        <h1 style={{ marginBottom: "20px" }}>
          اختبار اتصال مقالات
        </h1>

        <div
          style={{
            fontSize: "24px",
            fontWeight: 700,
            marginBottom: "15px",
          }}
        >
          {status}
        </div>

        <p style={{ color: "#666" }}>{details}</p>
      </div>
    </main>
  );
}
