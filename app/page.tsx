"use client";

import { useEffect, useState } from "react";

type User = {
  id: string;
  telegram_id: number;
  username?: string | null;
  first_name?: string | null;
  last_name?: string | null;
};

type Article = {
  id: string;
  title: string;
  slug: string;
  status: string;
  category?: string | null;
  excerpt?: string | null;
  word_count?: number | null;
  created_at: string;
  updated_at: string;
  published_at?: string | null;
};

type View = "home" | "editor" | "articles";

export default function Home() {
  const [view, setView] = useState<View>("home");

  const [initData, setInitData] = useState("");
  const [user, setUser] = useState<User | null>(null);

  const [articles, setArticles] = useState<Article[]>([]);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("");

  const [editingArticleId, setEditingArticleId] = useState<string | null>(
    null
  );

  const [loadingArticles, setLoadingArticles] = useState(false);
  const [loadingArticle, setLoadingArticle] = useState(false);
  const [saving, setSaving] = useState(false);

  const [message, setMessage] = useState("");

  useEffect(() => {
    authenticate();
  }, []);

  async function authenticate() {
    try {
      const tg = (window as any).Telegram?.WebApp;

      if (tg) {
        tg.ready();
        tg.expand();
      }

      const telegramInitData = tg?.initData;

      if (!telegramInitData) {
        setMessage("لم يتم العثور على بيانات Telegram.");
        return;
      }

      setInitData(telegramInitData);

      const response = await fetch("/api/auth/telegram", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          initData: telegramInitData,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setMessage(data.message || "فشل تسجيل الدخول.");
        return;
      }

      setUser(data.user);
    } catch (error) {
      console.error(error);
      setMessage("حدث خطأ أثناء تسجيل الدخول.");
    }
  }

  async function loadArticles() {
    if (!initData) {
      setMessage("بيانات Telegram غير جاهزة.");
      return;
    }

    setLoadingArticles(true);
    setMessage("");

    try {
      const response = await fetch("/api/articles/my", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          initData,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setMessage(data.message || "تعذر جلب المقالات.");
        return;
      }

      setArticles(data.articles || []);
      setView("articles");
    } catch (error) {
      console.error(error);
      setMessage("حدث خطأ أثناء جلب المقالات.");
    } finally {
      setLoadingArticles(false);
    }
  }

  async function openArticle(articleId: string) {
    if (!initData) {
      setMessage("بيانات Telegram غير جاهزة.");
      return;
    }

    setLoadingArticle(true);
    setMessage("");

    try {
      const response = await fetch(`/api/articles/${articleId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          initData,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setMessage(data.message || "تعذر فتح المقال.");
        return;
      }

      const article = data.article;

      setEditingArticleId(article.id);
      setTitle(article.title || "");
      setCategory(article.category || "");

      let articleContent = "";

      if (
        article.content &&
        Array.isArray(article.content.content)
      ) {
        articleContent = article.content.content
          .map((block: any) => {
            if (!block.content) return "";

            return block.content
              .map((item: any) => item.text || "")
              .join("");
          })
          .join("\n");
      }

      if (!articleContent && article.html_content) {
        articleContent = article.html_content
          .replace(/<br\s*\/?>/gi, "\n")
          .replace(/<\/p>/gi, "\n")
          .replace(/<[^>]*>/g, "")
          .trim();
      }

      setContent(articleContent);
      setView("editor");
    } catch (error) {
      console.error(error);
      setMessage("حدث خطأ أثناء فتح المقال.");
    } finally {
      setLoadingArticle(false);
    }
  }

  async function saveArticle() {
    if (!initData) {
      setMessage("بيانات Telegram غير جاهزة.");
      return;
    }

    if (!title.trim()) {
      setMessage("اكتب عنوان المقال أولًا.");
      return;
    }

    if (!content.trim()) {
      setMessage("اكتب محتوى المقال أولًا.");
      return;
    }

    setSaving(true);
    setMessage("");

    try {
      let response;

      if (editingArticleId) {
        response = await fetch("/api/articles/update", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            initData,
            articleId: editingArticleId,
            title,
            content,
            category,
          }),
        });
      } else {
        response = await fetch("/api/articles", {
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
        });
      }

      const data = await response.json();

      if (!response.ok || !data.success) {
        setMessage(data.message || "تعذر حفظ المقال.");
        return;
      }

      if (editingArticleId) {
        setMessage("تم تحديث المقال بنجاح ✅");
      } else {
        setMessage("تم حفظ المقال كمسودة بنجاح ✅");
      }

      setEditingArticleId(null);

      setTitle("");
      setContent("");
      setCategory("");

      setTimeout(() => {
        loadArticles();
      }, 700);
    } catch (error) {
      console.error(error);
      setMessage("حدث خطأ أثناء حفظ المقال.");
    } finally {
      setSaving(false);
    }
  }

  function openNewArticle() {
    setEditingArticleId(null);
    setTitle("");
    setContent("");
    setCategory("");
    setMessage("");
    setView("editor");
  }

  function formatDate(date: string) {
    try {
      return new Date(date).toLocaleDateString("ar-LY", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return date;
    }
  }

  function statusText(status: string) {
    switch (status) {
      case "draft":
        return "مسودة";
      case "published":
        return "منشور";
      case "archived":
        return "مؤرشف";
      default:
        return status;
    }
  }

  return (
    <main
      dir="rtl"
      style={{
        minHeight: "100vh",
        background: "#f5f7fb",
        color: "#111827",
        fontFamily:
          "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      }}
    >
      <div
        style={{
          maxWidth: 700,
          margin: "0 auto",
          minHeight: "100vh",
          padding: "20px 16px 90px",
        }}
      >
        {/* Header */}

        <header
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 24,
          }}
        >
          <div>
            <div
              style={{
                fontSize: 24,
                fontWeight: 800,
              }}
            >
              مقالات
            </div>

            <div
              style={{
                color: "#6b7280",
                fontSize: 14,
                marginTop: 4,
              }}
            >
              Article Studio
            </div>
          </div>

          <div
            style={{
              width: 42,
              height: 42,
              borderRadius: "50%",
              background: "#111827",
              color: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 700,
            }}
          >
            {user?.first_name?.charAt(0) || "م"}
          </div>
        </header>

        {/* Message */}

        {message && (
          <div
            style={{
              background: "#ecfdf5",
              border: "1px solid #a7f3d0",
              color: "#065f46",
              borderRadius: 14,
              padding: "12px 14px",
              marginBottom: 18,
              fontSize: 14,
            }}
          >
            {message}
          </div>
        )}

        {/* HOME */}

        {view === "home" && (
          <>
            <section
              style={{
                background: "#111827",
                color: "#fff",
                borderRadius: 24,
                padding: 24,
                marginBottom: 18,
              }}
            >
              <div
                style={{
                  fontSize: 14,
                  opacity: 0.7,
                  marginBottom: 8,
                }}
              >
                مرحبًا
              </div>

              <div
                style={{
                  fontSize: 25,
                  fontWeight: 800,
                  marginBottom: 10,
                }}
              >
                {user?.first_name || "صاحب المقالات"} 👋
              </div>

              <div
                style={{
                  fontSize: 14,
                  opacity: 0.75,
                  lineHeight: 1.7,
                }}
              >
                اكتب مقالاتك ونظّم محتواك من مكان واحد.
              </div>
            </section>

            <button
              onClick={openNewArticle}
              style={{
                width: "100%",
                border: "none",
                borderRadius: 18,
                padding: 18,
                background: "#2563eb",
                color: "#fff",
                fontSize: 17,
                fontWeight: 700,
                cursor: "pointer",
                marginBottom: 14,
              }}
            >
              ＋ إنشاء مقال جديد
            </button>

            <button
              onClick={loadArticles}
              style={{
                width: "100%",
                border: "1px solid #e5e7eb",
                borderRadius: 18,
                padding: 18,
                background: "#fff",
                color: "#111827",
                fontSize: 16,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              {loadingArticles
                ? "جاري تحميل المقالات..."
                : "📚 مقالاتي"}
            </button>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 12,
                marginTop: 14,
              }}
            >
              <div
                style={{
                  background: "#fff",
                  borderRadius: 18,
                  padding: 18,
                  border: "1px solid #e5e7eb",
                }}
              >
                <div style={{ fontSize: 24, marginBottom: 8 }}>
                  🏷️
                </div>

                <div style={{ fontWeight: 700 }}>
                  التصنيفات
                </div>

                <div
                  style={{
                    fontSize: 13,
                    color: "#9ca3af",
                    marginTop: 5,
                  }}
                >
                  قريبًا
                </div>
              </div>

              <div
                style={{
                  background: "#fff",
                  borderRadius: 18,
                  padding: 18,
                  border: "1px solid #e5e7eb",
                }}
              >
                <div style={{ fontSize: 24, marginBottom: 8 }}>
                  ⚙️
                </div>

                <div style={{ fontWeight: 700 }}>
                  الإعدادات
                </div>

                <div
                  style={{
                    fontSize: 13,
                    color: "#9ca3af",
                    marginTop: 5,
                  }}
                >
                  قريبًا
                </div>
              </div>
            </div>
          </>
        )}

        {/* EDITOR */}

        {view === "editor" && (
          <>
            <button
              onClick={() => {
                setEditingArticleId(null);
                setView("articles");
              }}
              style={{
                border: "none",
                background: "transparent",
                padding: 0,
                marginBottom: 20,
                fontSize: 15,
                cursor: "pointer",
                color: "#2563eb",
              }}
            >
              ← العودة
            </button>

            <h1
              style={{
                fontSize: 26,
                marginBottom: 20,
              }}
            >
              {editingArticleId
                ? "تعديل المقال"
                : "إنشاء مقال جديد"}
            </h1>

            {loadingArticle ? (
              <div
                style={{
                  textAlign: "center",
                  padding: 40,
                  color: "#6b7280",
                }}
              >
                جاري فتح المقال...
              </div>
            ) : (
              <>
                <input
                  value={title}
                  onChange={(e) =>
                    setTitle(e.target.value)
                  }
                  placeholder="عنوان المقال"
                  style={{
                    width: "100%",
                    boxSizing: "border-box",
                    padding: 16,
                    borderRadius: 14,
                    border: "1px solid #d1d5db",
                    fontSize: 17,
                    marginBottom: 12,
                    outline: "none",
                  }}
                />

                <input
                  value={category}
                  onChange={(e) =>
                    setCategory(e.target.value)
                  }
                  placeholder="التصنيف (اختياري)"
                  style={{
                    width: "100%",
                    boxSizing: "border-box",
                    padding: 15,
                    borderRadius: 14,
                    border: "1px solid #d1d5db",
                    fontSize: 15,
                    marginBottom: 12,
                    outline: "none",
                  }}
                />

                <textarea
                  value={content}
                  onChange={(e) =>
                    setContent(e.target.value)
                  }
                  placeholder="اكتب محتوى المقال هنا..."
                  rows={14}
                  style={{
                    width: "100%",
                    boxSizing: "border-box",
                    padding: 16,
                    borderRadius: 14,
                    border: "1px solid #d1d5db",
                    fontSize: 16,
                    lineHeight: 1.9,
                    resize: "vertical",
                    outline: "none",
                    marginBottom: 14,
                  }}
                />

                <button
                  onClick={saveArticle}
                  disabled={saving}
                  style={{
                    width: "100%",
                    border: "none",
                    borderRadius: 16,
                    padding: 17,
                    background: saving
                      ? "#93c5fd"
                      : "#2563eb",
                    color: "#fff",
                    fontSize: 16,
                    fontWeight: 700,
                    cursor: saving
                      ? "default"
                      : "pointer",
                  }}
                >
                  {saving
                    ? "جاري الحفظ..."
                    : editingArticleId
                    ? "حفظ التعديلات"
                    : "حفظ كمسودة"}
                </button>
              </>
            )}
          </>
        )}

        {/* ARTICLES */}

        {view === "articles" && (
          <>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 20,
              }}
            >
              <button
                onClick={() => setView("home")}
                style={{
                  border: "none",
                  background: "transparent",
                  padding: 0,
                  fontSize: 15,
                  cursor: "pointer",
                  color: "#2563eb",
                }}
              >
                ← الرئيسية
              </button>

              <h1
                style={{
                  fontSize: 25,
                  margin: 0,
                }}
              >
                مقالاتي
              </h1>
            </div>

            <button
              onClick={openNewArticle}
              style={{
                width: "100%",
                border: "none",
                borderRadius: 16,
                padding: 15,
                background: "#2563eb",
                color: "#fff",
                fontSize: 15,
                fontWeight: 700,
                cursor: "pointer",
                marginBottom: 16,
              }}
            >
              ＋ إنشاء مقال جديد
            </button>

            {loadingArticles ? (
              <div
                style={{
                  textAlign: "center",
                  padding: 40,
                  color: "#6b7280",
                }}
              >
                جاري تحميل المقالات...
              </div>
            ) : articles.length === 0 ? (
              <div
                style={{
                  background: "#fff",
                  borderRadius: 20,
                  padding: 35,
                  textAlign: "center",
                  border: "1px solid #e5e7eb",
                }}
              >
                <div
                  style={{
                    fontSize: 42,
                    marginBottom: 12,
                  }}
                >
                  📝
                </div>

                <div
                  style={{
                    fontWeight: 700,
                    fontSize: 18,
                    marginBottom: 8,
                  }}
                >
                  لا توجد مقالات بعد
                </div>

                <div
                  style={{
                    color: "#6b7280",
                    fontSize: 14,
                  }}
                >
                  أنشئ أول مقال لك وسيظهر هنا.
                </div>
              </div>
            ) : (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 12,
                }}
              >
                {articles.map((article) => (
                  <button
                    key={article.id}
                    onClick={() =>
                      openArticle(article.id)
                    }
                    style={{
                      width: "100%",
                      textAlign: "right",
                      background: "#fff",
                      border: "1px solid #e5e7eb",
                      borderRadius: 20,
                      padding: 18,
                      cursor: "pointer",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent:
                          "space-between",
                        gap: 10,
                        alignItems: "flex-start",
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <div
                          style={{
                            fontSize: 18,
                            fontWeight: 800,
                            lineHeight: 1.5,
                          }}
                        >
                          {article.title ||
                            "بدون عنوان"}
                        </div>

                        {article.excerpt && (
                          <div
                            style={{
                              color: "#6b7280",
                              fontSize: 13,
                              lineHeight: 1.7,
                              marginTop: 7,
                            }}
                          >
                            {article.excerpt}
                          </div>
                        )}
                      </div>

                      <span
                        style={{
                          background: "#fef3c7",
                          color: "#92400e",
                          padding: "5px 9px",
                          borderRadius: 10,
                          fontSize: 12,
                          whiteSpace: "nowrap",
                        }}
                      >
                        {statusText(
                          article.status
                        )}
                      </span>
                    </div>

                    <div
                      style={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: 8,
                        marginTop: 14,
                        color: "#6b7280",
                        fontSize: 12,
                      }}
                    >
                      {article.category && (
                        <span>
                          🏷️ {article.category}
                        </span>
                      )}

                      <span>
                        📅{" "}
                        {formatDate(
                          article.updated_at
                        )}
                      </span>

                      <span>
                        📝{" "}
                        {article.word_count || 0} كلمة
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Bottom Navigation */}

      <nav
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          background: "rgba(255,255,255,0.96)",
          borderTop: "1px solid #e5e7eb",
          padding: "10px 16px",
          display: "flex",
          justifyContent: "center",
          backdropFilter: "blur(10px)",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: 700,
            display: "flex",
            justifyContent: "space-around",
          }}
        >
          <button
            onClick={() => setView("home")}
            style={{
              border: "none",
              background: "transparent",
              cursor: "pointer",
              fontSize: 13,
            }}
          >
            🏠
            <div>الرئيسية</div>
          </button>

          <button
            onClick={openNewArticle}
            style={{
              width: 48,
              height: 48,
              borderRadius: "50%",
              border: "none",
              background: "#2563eb",
              color: "#fff",
              fontSize: 24,
              cursor: "pointer",
              marginTop: -25,
            }}
          >
            +
          </button>

          <button
            onClick={loadArticles}
            style={{
              border: "none",
              background: "transparent",
              cursor: "pointer",
              fontSize: 13,
            }}
          >
            📚
            <div>مقالاتي</div>
          </button>
        </div>
      </nav>
    </main>
  );
}
