"use client";

import { useEffect, useState } from "react";

type AuthState = "loading" | "success" | "error" | "outside";
type View = "home" | "editor";

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
  const [message, setMessage] = useState(
    "جاري الاتصال بـ Telegram..."
  );

  const [user, setUser] = useState<UserData | null>(null);
  const [view, setView] = useState<View>("home");

  const [initData, setInitData] = useState("");

  /* محرر المقال */

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("");

  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [saveError, setSaveError] = useState("");

  /* =========================================
     تسجيل الدخول
  ========================================= */

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

      const telegramInitData = webApp.initData;

      if (!telegramInitData) {
        setStatus("error");
        setMessage(
          "لم تصل بيانات المصادقة من Telegram."
        );
        return;
      }

      setInitData(telegramInitData);

      try {
        const response = await fetch(
          "/api/auth/telegram",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              initData: telegramInitData,
            }),
          }
        );

        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(
            result.error ||
              "فشل التحقق من حساب Telegram."
          );
        }

        setUser(result.user);
        setStatus("success");
        setMessage(
          "تم تسجيل الدخول بنجاح."
        );
      } catch (error) {
        console.error(
          "Authentication error:",
          error
        );

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

  /* =========================================
     حفظ المقال
  ========================================= */

  async function saveArticle() {
    setSaveMessage("");
    setSaveError("");

    if (!title.trim()) {
      setSaveError(
        "اكتب عنوان المقال أولًا."
      );
      return;
    }

    if (!content.trim()) {
      setSaveError(
        "اكتب محتوى المقال أولًا."
      );
      return;
    }

    if (!initData) {
      setSaveError(
        "لم يتم العثور على بيانات Telegram."
      );
      return;
    }

    setSaving(true);

    try {
      const response = await fetch(
        "/api/articles",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            initData,
            title,
            content,
            category,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.error ||
            "فشل حفظ المقال."
        );
      }

      setSaveMessage(
        "تم حفظ المقال كمسودة بنجاح ✅"
      );

      setTitle("");
      setContent("");
      setCategory("");
    } catch (error) {
      console.error(
        "Save article error:",
        error
      );

      setSaveError(
        error instanceof Error
          ? error.message
          : "حدث خطأ أثناء حفظ المقال."
      );
    } finally {
      setSaving(false);
    }
  }

  /* =========================================
     شاشة التحميل
  ========================================= */

  if (status === "loading") {
    return (
      <main style={styles.centerPage}>
        <div style={styles.loadingBox}>
          <div style={styles.logo}>م</div>

          <h1 style={styles.mainTitle}>
            مقالات
          </h1>

          <p style={styles.subtitle}>
            Article Studio
          </p>

          <div style={styles.statusBox}>
            <div style={styles.spinner} />
            <strong>{message}</strong>
          </div>
        </div>
      </main>
    );
  }

  /* =========================================
     شاشة الخطأ
  ========================================= */

  if (
    status === "error" ||
    status === "outside"
  ) {
    return (
      <main style={styles.centerPage}>
        <div style={styles.loadingBox}>
          <div style={styles.logo}>م</div>

          <h1 style={styles.mainTitle}>
            مقالات
          </h1>

          <p style={styles.subtitle}>
            Article Studio
          </p>

          <div style={styles.errorBox}>
            <div style={styles.errorIcon}>
              !
            </div>

            <strong>
              {status === "outside"
                ? "افتح التطبيق من Telegram"
                : "تعذر تسجيل الدخول"}
            </strong>

            <p style={styles.errorText}>
              {message}
            </p>
          </div>
        </div>
      </main>
    );
  }

  /* =========================================
     محرر المقال
  ========================================= */

  if (view === "editor") {
    return (
      <main style={styles.app}>
        <header style={styles.header}>
          <button
            style={styles.backButton}
            onClick={() => {
              setView("home");
              setSaveMessage("");
              setSaveError("");
            }}
          >
            → الرئيسية
          </button>

          <div style={styles.headerBrand}>
            <strong>مقال جديد</strong>
            <small>Article Studio</small>
          </div>
        </header>

        <section style={styles.editorContainer}>
          <div style={styles.editorIntro}>
            <span style={styles.editorIcon}>
              ✍️
            </span>

            <div>
              <h1 style={styles.editorTitle}>
                إنشاء مقال جديد
              </h1>

              <p style={styles.editorDescription}>
                اكتب مقالك واحفظه كمسودة للعودة
                إليه لاحقًا.
              </p>
            </div>
          </div>

          {/* العنوان */}

          <label style={styles.label}>
            عنوان المقال
          </label>

          <input
            value={title}
            onChange={(e) =>
              setTitle(e.target.value)
            }
            placeholder="اكتب عنوان المقال..."
            style={styles.titleInput}
          />

          {/* التصنيف */}

          <label style={styles.label}>
            التصنيف
          </label>

          <input
            value={category}
            onChange={(e) =>
              setCategory(e.target.value)
            }
            placeholder="مثال: تقنية، أدب، تعليم..."
            style={styles.input}
          />

          {/* المحتوى */}

          <label style={styles.label}>
            محتوى المقال
          </label>

          <textarea
            value={content}
            onChange={(e) =>
              setContent(e.target.value)
            }
            placeholder="ابدأ كتابة مقالك هنا..."
            style={styles.textarea}
          />

          <div style={styles.wordCounter}>
            {content.trim()
              ? content
                  .trim()
                  .split(/\s+/)
                  .filter(Boolean).length
              : 0}{" "}
            كلمة
          </div>

          {/* الرسائل */}

          {saveError && (
            <div style={styles.saveError}>
              {saveError}
            </div>
          )}

          {saveMessage && (
            <div style={styles.saveSuccess}>
              {saveMessage}
            </div>
          )}

          {/* زر الحفظ */}

          <button
            onClick={saveArticle}
            disabled={saving}
            style={{
              ...styles.saveButton,
              opacity: saving ? 0.65 : 1,
            }}
          >
            {saving
              ? "جاري الحفظ..."
              : "حفظ كمسودة"}
          </button>
        </section>
      </main>
    );
  }

  /* =========================================
     الصفحة الرئيسية
  ========================================= */

  return (
    <main style={styles.app}>
      <header style={styles.header}>
        <div>
          <div style={styles.brand}>
            مقالات
          </div>

          <small style={styles.brandSub}>
            Article Studio
          </small>
        </div>

        <div style={styles.avatar}>
          {user?.first_name?.charAt(0) ||
            "م"}
        </div>
      </header>

      <section style={styles.content}>
        <div style={styles.welcome}>
          <p style={styles.smallText}>
            مرحبًا بعودتك 👋
          </p>

          <h1 style={styles.welcomeTitle}>
            {user?.first_name || "صديقي"}
          </h1>

          <p style={styles.welcomeDescription}>
            أنشئ مقالاتك ونظّم أفكارك في مكان
            واحد.
          </p>
        </div>

        {/* إنشاء مقال */}

        <button
          style={styles.createButton}
          onClick={() => {
            setView("editor");
            setSaveMessage("");
            setSaveError("");
          }}
        >
          <span style={styles.createIcon}>
            ＋
          </span>

          <span>
            <strong
              style={{
                display: "block",
                fontSize: "17px",
              }}
            >
              إنشاء مقال جديد
            </strong>

            <small
              style={{
                opacity: 0.75,
              }}
            >
              ابدأ كتابة مقال جديد
            </small>
          </span>

          <span style={styles.arrow}>
            ←
          </span>
        </button>

        {/* الإحصائيات */}

        <div style={styles.sectionTitle}>
          <h2>نظرة سريعة</h2>
        </div>

        <div style={styles.statsGrid}>
          <div style={styles.statCard}>
            <div style={styles.statIcon}>
              📝
            </div>

            <strong style={styles.statNumber}>
              0
            </strong>

            <span style={styles.statLabel}>
              المقالات
            </span>
          </div>

          <div style={styles.statCard}>
            <div style={styles.statIcon}>
              📂
            </div>

            <strong style={styles.statNumber}>
              0
            </strong>

            <span style={styles.statLabel}>
              المسودات
            </span>
          </div>

          <div style={styles.statCard}>
            <div style={styles.statIcon}>
              ⭐
            </div>

            <strong style={styles.statNumber}>
              0
            </strong>

            <span style={styles.statLabel}>
              المفضلة
            </span>
          </div>
        </div>

        {/* أدوات */}

        <div style={styles.sectionTitle}>
          <h2>الوصول السريع</h2>
        </div>

        <div style={styles.toolsGrid}>
          <button
            style={styles.toolCard}
            onClick={() =>
              alert(
                "سنربط هذا القسم بالمقالات المحفوظة في الخطوة التالية."
              )
            }
          >
            <span style={styles.toolIcon}>
              📚
            </span>

            <strong>مقالاتي</strong>

            <small>
              عرض المقالات والمسودات
            </small>
          </button>

          <button
            style={styles.toolCard}
            onClick={() =>
              alert(
                "سنربط التصنيفات بقاعدة البيانات لاحقًا."
              )
            }
          >
            <span style={styles.toolIcon}>
              🗂️
            </span>

            <strong>التصنيفات</strong>

            <small>
              تنظيم المقالات
            </small>
          </button>

          <button
            style={styles.toolCard}
            onClick={() =>
              alert(
                "سنضيف البحث في الخطوة التالية."
              )
            }
          >
            <span style={styles.toolIcon}>
              🔎
            </span>

            <strong>البحث</strong>

            <small>
              البحث في المقالات
            </small>
          </button>

          <button
            style={styles.toolCard}
            onClick={() =>
              alert(
                "سنضيف الإعدادات لاحقًا."
              )
            }
          >
            <span style={styles.toolIcon}>
              ⚙️
            </span>

            <strong>الإعدادات</strong>

            <small>
              إعدادات الحساب
            </small>
          </button>
        </div>

        {/* الحساب */}

        <div style={styles.accountCard}>
          <div style={styles.accountAvatar}>
            {user?.first_name?.charAt(0) ||
              "م"}
          </div>

          <div style={{ flex: 1 }}>
            <strong>
              {user?.first_name || ""}{" "}
              {user?.last_name || ""}
            </strong>

            {user?.username && (
              <p
                style={
                  styles.accountUsername
                }
              >
                @{user.username}
              </p>
            )}
          </div>

          {user?.is_premium && (
            <span style={styles.premium}>
              Premium
            </span>
          )}
        </div>
      </section>

      {/* التنقل السفلي */}

      <nav style={styles.bottomNav}>
        <button
          style={styles.navItemActive}
        >
          <span>⌂</span>
          <small>الرئيسية</small>
        </button>

        <button
          style={styles.navItem}
          onClick={() =>
            alert(
              "سنربطها بالمقالات الحقيقية قريبًا."
            )
          }
        >
          <span>▤</span>
          <small>مقالاتي</small>
        </button>

        <button
          style={styles.navCreate}
          onClick={() => {
            setView("editor");
            setSaveMessage("");
            setSaveError("");
          }}
        >
          ＋
        </button>

        <button
          style={styles.navItem}
          onClick={() =>
            alert(
              "سنضيف المفضلة لاحقًا."
            )
          }
        >
          <span>☆</span>
          <small>المفضلة</small>
        </button>

        <button
          style={styles.navItem}
          onClick={() =>
            alert(
              "سنضيف الإعدادات لاحقًا."
            )
          }
        >
          <span>⚙</span>
          <small>الإعدادات</small>
        </button>
      </nav>
    </main>
  );
}

/* =========================================
   التصميم
========================================= */

const styles: Record<
  string,
  React.CSSProperties
> = {
  centerPage: {
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

  loadingBox: {
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
  },

  mainTitle: {
    margin: 0,
    fontSize: "30px",
    fontWeight: 800,
  },

  subtitle: {
    margin: "7px 0 30px",
    color: "#6b7280",
  },

  statusBox: {
    background: "#fff",
    borderRadius: "18px",
    padding: "22px",
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
    borderRadius: "20px",
    padding: "25px",
  },

  errorIcon: {
    margin: "0 auto 14px",
    width: "45px",
    height: "45px",
    borderRadius: "50%",
    background: "#fee2e2",
    color: "#dc2626",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 800,
    fontSize: "22px",
  },

  errorText: {
    color: "#6b7280",
    lineHeight: 1.8,
  },

  app: {
    minHeight: "100vh",
    background: "#f5f7fb",
    direction: "rtl",
    fontFamily:
      "Arial, Helvetica, sans-serif",
    paddingBottom: "90px",
    color: "#111827",
  },

  header: {
    background: "#fff",
    padding: "16px 20px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottom:
      "1px solid #eef0f4",
    position: "sticky",
    top: 0,
    zIndex: 20,
  },

  headerBrand: {
    display: "flex",
    flexDirection: "column",
    gap: "3px",
  },

  headerBrandSmall: {
    color: "#9ca3af",
  },

  backButton: {
    background: "#f3f4f6",
    border: 0,
    borderRadius: "12px",
    padding: "10px 13px",
    cursor: "pointer",
    color: "#111827",
    fontWeight: 700,
  },

  brand: {
    fontSize: "21px",
    fontWeight: 900,
  },

  brandSub: {
    color: "#9ca3af",
    fontSize: "11px",
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
  },

  content: {
    width: "100%",
    maxWidth: "760px",
    margin: "0 auto",
    padding: "26px 18px",
    boxSizing: "border-box",
  },

  editorContainer: {
    width: "100%",
    maxWidth: "800px",
    margin: "0 auto",
    padding: "24px 18px",
    boxSizing: "border-box",
  },

  editorIntro: {
    display: "flex",
    alignItems: "center",
    gap: "13px",
    marginBottom: "26px",
  },

  editorIcon: {
    width: "50px",
    height: "50px",
    borderRadius: "16px",
    background: "#111827",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "23px",
  },

  editorTitle: {
    margin: 0,
    fontSize: "24px",
  },

  editorDescription: {
    margin: "5px 0 0",
    color: "#6b7280",
    fontSize: "13px",
  },

  label: {
    display: "block",
    fontWeight: 800,
    margin: "18px 0 8px",
    fontSize: "14px",
  },

  titleInput: {
    width: "100%",
    boxSizing: "border-box",
    border: "1px solid #e5e7eb",
    background: "#fff",
    borderRadius: "16px",
    padding: "17px",
    fontSize: "19px",
    outline: "none",
    direction: "rtl",
  },

  input: {
    width: "100%",
    boxSizing: "border-box",
    border: "1px solid #e5e7eb",
    background: "#fff",
    borderRadius: "15px",
    padding: "15px",
    fontSize: "15px",
    outline: "none",
    direction: "rtl",
  },

  textarea: {
    width: "100%",
    minHeight: "320px",
    boxSizing: "border-box",
    resize: "vertical",
    border: "1px solid #e5e7eb",
    background: "#fff",
    borderRadius: "18px",
    padding: "17px",
    fontSize: "16px",
    lineHeight: 1.9,
    outline: "none",
    direction: "rtl",
    fontFamily:
      "Arial, Helvetica, sans-serif",
  },

  wordCounter: {
    color: "#9ca3af",
    fontSize: "12px",
    marginTop: "7px",
  },

  saveButton: {
    width: "100%",
    marginTop: "18px",
    border: 0,
    borderRadius: "16px",
    padding: "17px",
    background: "#111827",
    color: "#fff",
    fontSize: "16px",
    fontWeight: 800,
    cursor: "pointer",
  },

  saveSuccess: {
    marginTop: "15px",
    background: "#ecfdf5",
    color: "#047857",
    borderRadius: "14px",
    padding: "13px",
    fontSize: "14px",
    fontWeight: 700,
  },

  saveError: {
    marginTop: "15px",
    background: "#fef2f2",
    color: "#b91c1c",
    borderRadius: "14px",
    padding: "13px",
    fontSize: "14px",
    fontWeight: 700,
  },

  welcome: {
    marginBottom: "22px",
  },

  smallText: {
    color: "#6b7280",
    margin: "0 0 6px",
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
  },

  createIcon: {
    width: "46px",
    height: "46px",
    borderRadius: "15px",
    background:
      "rgba(255,255,255,.12)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "27px",
  },

  arrow: {
    marginRight: "auto",
    fontSize: "20px",
  },

  sectionTitle: {
    marginTop: "30px",
    marginBottom: "13px",
  },

  statsGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(3, 1fr)",
    gap: "10px",
  },

  statCard: {
    background: "#fff",
    borderRadius: "18px",
    padding: "16px 10px",
    textAlign: "center",
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
    gridTemplateColumns:
      "repeat(2, 1fr)",
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
    background:
      "rgba(255,255,255,.96)",
    borderTop:
      "1px solid #e5e7eb",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-around",
    zIndex: 30,
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
  },
};
