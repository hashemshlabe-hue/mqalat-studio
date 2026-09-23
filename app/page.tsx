"use client";

import { useEffect, useState } from "react";

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

  /* =========================
     شاشة التحميل
  ========================= */

  if (status === "loading") {
    return (
      <main style={styles.page}>
        <div style={styles.loadingContainer}>
          <div style={styles.logo}>م</div>

          <h1 style={styles.title}>مقالات</h1>

          <p style={styles.subtitle}>Article Studio</p>

          <div style={styles.loadingBox}>
            <div style={styles.spinner}></div>
            <strong>{message}</strong>
          </div>
        </div>
      </main>
    );
  }

  /* =========================
     خطأ
  ========================= */

  if (status === "error" || status === "outside") {
    return (
      <main style={styles.page}>
        <div style={styles.errorContainer}>
          <div style={styles.logo}>م</div>

          <h1 style={styles.title}>مقالات</h1>

          <p style={styles.subtitle}>Article Studio</p>

          <div style={styles.errorBox}>
            <div style={styles.errorIcon}>!</div>

            <h2 style={{ margin: "0 0 10px" }}>
              {status === "outside"
                ? "التطبيق يعمل داخل Telegram"
                : "تعذر تسجيل الدخول"}
            </h2>

            <p style={styles.errorText}>{message}</p>
          </div>
        </div>
      </main>
    );
  }

  /* =========================
     التطبيق الرئيسي
  ========================= */

  return (
    <main style={styles.app}>
      {/* الهيدر */}

      <header style={styles.header}>
        <div>
          <div style={styles.brand}>مقالات</div>
          <div style={styles.brandSub}>Article Studio</div>
        </div>

        <div style={styles.avatar}>
          {user?.first_name?.charAt(0) || "م"}
        </div>
      </header>

      {/* المحتوى */}

      <section style={styles.content}>
        {/* الترحيب */}

        <div style={styles.welcome}>
          <p style={styles.smallText}>مرحبًا بعودتك 👋</p>

          <h1 style={styles.welcomeTitle}>
            {user?.first_name || "صديقي"}
          </h1>

          <p style={styles.welcomeDescription}>
            أنشئ مقالاتك، نظّم أفكارك، واجعل كتابتك أكثر احترافية.
          </p>
        </div>

        {/* زر إنشاء مقال */}

        <button
          style={styles.createButton}
          onClick={() => alert("سنضيف محرر المقالات هنا في الخطوة التالية.")}
        >
          <span style={styles.createIcon}>＋</span>

          <span>
            <strong style={{ display: "block", fontSize: "17px" }}>
              إنشاء مقال جديد
            </strong>

            <small style={{ opacity: 0.8 }}>
              ابدأ كتابة مقال جديد
            </small>
          </span>

          <span style={styles.arrow}>←</span>
        </button>

        {/* الإحصائيات */}

        <div style={styles.sectionTitle}>
          <h2>نظرة سريعة</h2>
        </div>

        <div style={styles.statsGrid}>
          <div style={styles.statCard}>
            <div style={styles.statIcon}>📝</div>
            <strong style={styles.statNumber}>0</strong>
            <span style={styles.statLabel}>المقالات</span>
          </div>

          <div style={styles.statCard}>
            <div style={styles.statIcon}>📂</div>
            <strong style={styles.statNumber}>0</strong>
            <span style={styles.statLabel}>المسودات</span>
          </div>

          <div style={styles.statCard}>
            <div style={styles.statIcon}>⭐</div>
            <strong style={styles.statNumber}>0</strong>
            <span style={styles.statLabel}>المفضلة</span>
          </div>
        </div>

        {/* الأدوات */}

        <div style={styles.sectionTitle}>
          <h2>الوصول السريع</h2>
        </div>

        <div style={styles.toolsGrid}>
          <button
            style={styles.toolCard}
            onClick={() =>
              alert("قسم مقالاتي سنبنيه في الخطوة التالية.")
            }
          >
            <span style={styles.toolIcon}>📚</span>
            <strong>مقالاتي</strong>
            <small>عرض جميع مقالاتك</small>
          </button>

          <button
            style={styles.toolCard}
            onClick={() =>
              alert("قسم التصنيفات سنبنيه في الخطوة التالية.")
            }
          >
            <span style={styles.toolIcon}>🗂️</span>
            <strong>التصنيفات</strong>
            <small>تنظيم مقالاتك</small>
          </button>

          <button
            style={styles.toolCard}
            onClick={() =>
              alert("البحث سنبنيه في الخطوة التالية.")
            }
          >
            <span style={styles.toolIcon}>🔎</span>
            <strong>البحث</strong>
            <small>ابحث في مقالاتك</small>
          </button>

          <button
            style={styles.toolCard}
            onClick={() =>
              alert("الإعدادات سنبنيها في الخطوة التالية.")
            }
          >
            <span style={styles.toolIcon}>⚙️</span>
            <strong>الإعدادات</strong>
            <small>إعدادات الحساب</small>
          </button>
        </div>

        {/* الحساب */}

        <div style={styles.accountCard}>
          <div style={styles.accountAvatar}>
            {user?.first_name?.charAt(0) || "م"}
          </div>

          <div style={{ flex: 1 }}>
            <strong>
              {user?.first_name || ""} {user?.last_name || ""}
            </strong>

            {user?.username && (
              <p style={styles.accountUsername}>
                @{user.username}
              </p>
            )}
          </div>

          {user?.is_premium && (
            <span style={styles.premium}>Premium</span>
          )}
        </div>
      </section>

      {/* شريط التنقل السفلي */}

      <nav style={styles.bottomNav}>
        <button style={styles.navItemActive}>
          <span>⌂</span>
          <small>الرئيسية</small>
        </button>

        <button
          style={styles.navItem}
          onClick={() =>
            alert("صفحة المقالات سنبنيها قريبًا.")
          }
        >
          <span>▤</span>
          <small>مقالاتي</small>
        </button>

        <button
          style={styles.navCreate}
          onClick={() =>
            alert("محرر المقالات سنبنيه في الخطوة التالية.")
          }
        >
          ＋
        </button>

        <button
          style={styles.navItem}
          onClick={() =>
            alert("المفضلة سنبنيها قريبًا.")
          }
        >
          <span>☆</span>
          <small>المفضلة</small>
        </button>

        <button
          style={styles.navItem}
          onClick={() =>
            alert("الإعدادات سنبنيها قريبًا.")
          }
        >
          <span>⚙</span>
          <small>الإعدادات</small>
        </button>
      </nav>
    </main>
  );
}

/* =====================================================
   Styles
===================================================== */

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    background: "#f5f7fb",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    direction: "rtl",
    fontFamily:
      "Arial, Helvetica, sans-serif",
    padding: "24px",
    boxSizing: "border-box",
  },

  loadingContainer: {
    width: "100%",
    maxWidth: "480px",
    textAlign: "center",
  },

  errorContainer: {
    width: "100%",
    maxWidth: "480px",
    textAlign: "center",
  },

  logo: {
    width: "72px",
    height: "72px",
    borderRadius: "22px",
    background: "#111827",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    margin: "0 auto 18px",
    fontSize: "32px",
    fontWeight: 800,
    boxShadow: "0 12px 30px rgba(0,0,0,.12)",
  },

  title: {
    margin: 0,
    fontSize: "30px",
    fontWeight: 800,
    color: "#111827",
  },

  subtitle: {
    margin: "7px 0 30px",
    color: "#6b7280",
    fontSize: "14px",
  },

  loadingBox: {
    background: "#fff",
    borderRadius: "18px",
    padding: "22px",
    boxShadow: "0 10px 30px rgba(0,0,0,.06)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "12px",
  },

  spinner: {
    width: "20px",
    height: "20px",
    borderRadius: "50%",
    border: "3px solid #e5e7eb",
    borderTopColor: "#111827",
  },

  errorBox: {
    background: "#fff",
    borderRadius: "22px",
    padding: "30px 22px",
    boxShadow: "0 10px 30px rgba(0,0,0,.06)",
  },

  errorIcon: {
    width: "48px",
    height: "48px",
    borderRadius: "50%",
    background: "#fee2e2",
    color: "#dc2626",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    margin: "0 auto 16px",
    fontSize: "24px",
    fontWeight: 800,
  },

  errorText: {
    color: "#6b7280",
    lineHeight: 1.8,
    margin: 0,
  },

  app: {
    minHeight: "100vh",
    background: "#f5f7fb",
    direction: "rtl",
    fontFamily:
      "Arial, Helvetica, sans-serif",
    paddingBottom: "92px",
    color: "#111827",
  },

  header: {
    background: "#ffffff",
    padding: "18px 20px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottom: "1px solid #eef0f4",
    position: "sticky",
    top: 0,
    zIndex: 20,
  },

  brand: {
    fontSize: "21px",
    fontWeight: 900,
  },

  brandSub: {
    color: "#9ca3af",
    fontSize: "11px",
    marginTop: "2px",
    direction: "ltr",
    textAlign: "right",
  },

  avatar: {
    width: "42px",
    height: "42px",
    borderRadius: "14px",
    background: "#111827",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 800,
    fontSize: "18px",
  },

  content: {
    width: "100%",
    maxWidth: "760px",
    margin: "0 auto",
    padding: "26px 18px",
    boxSizing: "border-box",
  },

  welcome: {
    marginBottom: "22px",
  },

  smallText: {
    color: "#6b7280",
    margin: "0 0 6px",
    fontSize: "14px",
  },

  welcomeTitle: {
    margin: 0,
    fontSize: "29px",
    fontWeight: 900,
  },

  welcomeDescription: {
    color: "#6b7280",
    lineHeight: 1.7,
    margin: "9px 0 0",
    fontSize: "14px",
  },

  createButton: {
    width: "100%",
    border: 0,
    borderRadius: "20px",
    padding: "19px",
    background: "#111827",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    gap: "14px",
    textAlign: "right",
    cursor: "pointer",
    boxShadow: "0 12px 28px rgba(17,24,39,.18)",
  },

  createIcon: {
    width: "46px",
    height: "46px",
    borderRadius: "15px",
    background: "rgba(255,255,255,.12)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "27px",
  },

  arrow: {
    marginRight: "auto",
    fontSize: "20px",
    opacity: 0.7,
  },

  sectionTitle: {
    marginTop: "30px",
    marginBottom: "13px",
  },

  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "10px",
  },

  statCard: {
    background: "#fff",
    borderRadius: "18px",
    padding: "16px 10px",
    textAlign: "center",
    boxShadow: "0 5px 18px rgba(0,0,0,.04)",
  },

  statIcon: {
    fontSize: "20px",
    marginBottom: "8px",
  },

  statNumber: {
    display: "block",
    fontSize: "21px",
  },

  statLabel: {
    display: "block",
    color: "#9ca3af",
    fontSize: "12px",
    marginTop: "4px",
  },

  toolsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
    gap: "10px",
  },

  toolCard: {
    background: "#fff",
    border: "1px solid #eef0f4",
    borderRadius: "18px",
    padding: "18px 15px",
    textAlign: "right",
    cursor: "pointer",
    color: "#111827",
  },

  toolIcon: {
    display: "block",
    fontSize: "23px",
    marginBottom: "12px",
  },

  accountCard: {
    marginTop: "26px",
    background: "#fff",
    borderRadius: "20px",
    padding: "15px",
    display: "flex",
    alignItems: "center",
    gap: "12px",
    boxShadow: "0 5px 18px rgba(0,0,0,.04)",
  },

  accountAvatar: {
    width: "45px",
    height: "45px",
    borderRadius: "15px",
    background: "#f3f4f6",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 800,
  },

  accountUsername: {
    margin: "4px 0 0",
    color: "#9ca3af",
    fontSize: "12px",
    direction: "ltr",
    textAlign: "right",
  },

  premium: {
    background: "#f3f4f6",
    borderRadius: "10px",
    padding: "6px 9px",
    fontSize: "10px",
    fontWeight: 700,
  },

  bottomNav: {
    position: "fixed",
    bottom: 0,
    right: 0,
    left: 0,
    height: "70px",
    background: "rgba(255,255,255,.96)",
    borderTop: "1px solid #e5e7eb",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-around",
    zIndex: 30,
    backdropFilter: "blur(12px)",
  },

  navItem: {
    background: "none",
    border: 0,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "4px",
    color: "#9ca3af",
    cursor: "pointer",
    fontSize: "19px",
  },

  navItemActive: {
    background: "none",
    border: 0,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "4px",
    color: "#111827",
    cursor: "pointer",
    fontSize: "19px",
    fontWeight: 800,
  },

  navCreate: {
    width: "48px",
    height: "48px",
    borderRadius: "16px",
    border: 0,
    background: "#111827",
    color: "#fff",
    fontSize: "27px",
    cursor: "pointer",
    marginTop: "-25px",
    boxShadow: "0 8px 20px rgba(17,24,39,.2)",
  },
};
