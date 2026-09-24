"use client";

import { useEffect, useState } from "react";

type User = {
  id: string;
  telegram_id: number;
  username?: string;
  first_name?: string;
  last_name?: string;
};

type Article = {
  id: string;
  title: string;
  slug?: string;
  status?: string;
  category?: string | null;
  excerpt?: string | null;
  word_count?: number;
  created_at?: string;
  updated_at?: string;
  published_at?: string | null;
  content?: any;
  html_content?: string | null;
};

export default function Home() {
  const [initData, setInitData] = useState("");
  const [user, setUser] = useState<User | null>(null);

  const [view, setView] = useState<
    "home" | "editor" | "articles"
  >("home");

  const [articles, setArticles] = useState<Article[]>([]);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("");

  const [editingArticleId, setEditingArticleId] =
    useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] =
    useState<string | null>(null);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // =========================
  // Telegram Authentication
  // =========================

  useEffect(() => {
    const authenticate = async () => {
      try {
        const tg = (window as any).Telegram?.WebApp;

        if (!tg) {
          setError(
            "لم يتم فتح التطبيق من داخل Telegram."
          );
          setLoading(false);
          return;
        }

        tg.ready();
        tg.expand();

        const telegramInitData = tg.initData;

        if (!telegramInitData) {
          setError(
            "تعذر الحصول على بيانات Telegram."
          );
          setLoading(false);
          return;
        }

        setInitData(telegramInitData);

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

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(
            data.message ||
              "فشل تسجيل الدخول."
          );
        }

        setUser(data.user);
      } catch (err: any) {
        console.error(err);

        setError(
          err.message ||
            "حدث خطأ أثناء تسجيل الدخول."
        );
      } finally {
        setLoading(false);
      }
    };

    authenticate();
  }, []);

  // =========================
  // Load Articles
  // =========================

  const loadArticles = async () => {
    if (!initData) return;

    try {
      setError("");

      const response = await fetch(
        "/api/articles/my",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            initData,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "تعذر تحميل المقالات."
        );
      }

      setArticles(data.articles || []);
    } catch (err: any) {
      console.error(err);

      setError(
        err.message ||
          "حدث خطأ أثناء تحميل المقالات."
      );
    }
  };

  // =========================
  // Open Articles View
  // =========================

  const openArticles = async () => {
    setView("articles");
    await loadArticles();
  };

  // =========================
  // Open New Article Editor
  // =========================

  const openNewArticle = () => {
    setEditingArticleId(null);
    setTitle("");
    setContent("");
    setCategory("");
    setMessage("");
    setError("");

    setView("editor");
  };

  // =========================
  // Open Existing Article
  // =========================

  const openArticle = async (
    articleId: string
  ) => {
    try {
      setLoading(true);
      setError("");
      setMessage("");

      const response = await fetch(
        `/api/articles/${articleId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            initData,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "تعذر فتح المقال."
        );
      }

      const article: Article = data.article;

      setEditingArticleId(article.id);
      setTitle(article.title || "");
      setCategory(article.category || "");

      let extractedContent = "";

      if (
        article.content &&
        Array.isArray(article.content.content)
      ) {
        extractedContent =
          article.content.content
            .map((node: any) => {
              if (
                node.type === "paragraph" &&
                Array.isArray(node.content)
              ) {
                return node.content
                  .map(
                    (item: any) =>
                      item.text || ""
                  )
                  .join("");
              }

              return "";
            })
            .join("\n");
      }

      if (!extractedContent && article.html_content) {
        extractedContent =
          article.html_content
            .replace(/<br\s*\/?>/gi, "\n")
            .replace(
              /<\/p>/gi,
              "\n"
            )
            .replace(
              /<[^>]+>/g,
              ""
            )
            .trim();
      }

      setContent(extractedContent);

      setView("editor");
    } catch (err: any) {
      console.error(err);

      setError(
        err.message ||
          "حدث خطأ أثناء فتح المقال."
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // Save Article
  // =========================

  const saveArticle = async () => {
    if (!title.trim()) {
      setError("اكتب عنوان المقال أولًا.");
      return;
    }

    if (!content.trim()) {
      setError("اكتب محتوى المقال أولًا.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setMessage("");

      const endpoint = editingArticleId
        ? "/api/articles/update"
        : "/api/articles";

      const body = editingArticleId
        ? {
            initData,
            articleId: editingArticleId,
            title,
            content,
            category,
          }
        : {
            initData,
            title,
            content,
            category,
          };

      const response = await fetch(
        endpoint,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "تعذر حفظ المقال."
        );
      }

      setMessage(
        editingArticleId
          ? "تم حفظ التعديلات بنجاح."
          : "تم حفظ المقال بنجاح."
      );

      setEditingArticleId(null);
      setTitle("");
      setContent("");
      setCategory("");

      await loadArticles();
    } catch (err: any) {
      console.error(err);

      setError(
        err.message ||
          "حدث خطأ أثناء حفظ المقال."
      );
    } finally {
      setSaving(false);
    }
  };

  // =========================
  // Delete Article
  // =========================

  const deleteArticle = async (
    articleId: string,
    articleTitle: string
  ) => {
    const confirmed = window.confirm(
      `هل أنت متأكد من حذف المقال:\n\n"${articleTitle}"؟\n\nلا يمكن التراجع عن هذا الإجراء.`
    );

    if (!confirmed) return;

    try {
      setDeletingId(articleId);
      setError("");
      setMessage("");

      const response = await fetch(
        "/api/articles/delete",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            initData,
            articleId,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "تعذر حذف المقال."
        );
      }

      // إزالة المقال من القائمة فورًا
      setArticles((current) =>
        current.filter(
          (article) =>
            article.id !== articleId
        )
      );

      setMessage(
        "تم حذف المقال بنجاح."
      );

      // إذا كان المقال المفتوح هو المحذوف
      if (editingArticleId === articleId) {
        setEditingArticleId(null);
        setTitle("");
        setContent("");
        setCategory("");
        setView("articles");
      }
    } catch (err: any) {
      console.error(err);

      setError(
        err.message ||
          "حدث خطأ أثناء حذف المقال."
      );
    } finally {
      setDeletingId(null);
    }
  };

  // =========================
  // Loading
  // =========================

  if (loading && !user) {
    return (
      <main
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 20,
          fontFamily:
            "Arial, sans-serif",
          direction: "rtl",
        }}
      >
        <div
          style={{
            textAlign: "center",
          }}
        >
          <div
            style={{
              fontSize: 30,
              marginBottom: 12,
            }}
          >
            ✍️
          </div>

          <div>
            جارٍ تسجيل الدخول...
          </div>
        </div>
      </main>
    );
  }

  // =========================
  // Main UI
  // =========================

  return (
    <main
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(135deg, #f8fafc, #eef2ff)",
        padding: 20,
        fontFamily:
          "Arial, sans-serif",
        direction: "rtl",
      }}
    >
      <div
        style={{
          maxWidth: 850,
          margin: "0 auto",
        }}
      >
        {/* Header */}

        <header
          style={{
            background: "#ffffff",
            borderRadius: 20,
            padding: 20,
            marginBottom: 20,
            boxShadow:
              "0 8px 30px rgba(0,0,0,0.06)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent:
                "space-between",
              gap: 12,
            }}
          >
            <div>
              <h1
                style={{
                  margin: 0,
                  fontSize: 26,
                }}
              >
                مقالات
              </h1>

              <p
                style={{
                  margin:
                    "6px 0 0",
                  color: "#64748b",
                }}
              >
                Article Studio
              </p>
            </div>

            {user && (
              <div
                style={{
                  textAlign: "left",
                  fontSize: 13,
                  color: "#64748b",
                }}
              >
                {user.first_name ||
                  user.username ||
                  "مستخدم"}
              </div>
            )}
          </div>
        </header>

        {/* Messages */}

        {message && (
          <div
            style={{
              background: "#ecfdf5",
              color: "#047857",
              padding: 14,
              borderRadius: 14,
              marginBottom: 16,
            }}
          >
            ✅ {message}
          </div>
        )}

        {error && (
          <div
            style={{
              background: "#fef2f2",
              color: "#b91c1c",
              padding: 14,
              borderRadius: 14,
              marginBottom: 16,
            }}
          >
            ⚠️ {error}
          </div>
        )}

        {/* =========================
            HOME
        ========================= */}

        {view === "home" && (
          <section>
            <div
              style={{
                background: "#ffffff",
                borderRadius: 20,
                padding: 24,
                marginBottom: 16,
                boxShadow:
                  "0 8px 30px rgba(0,0,0,0.06)",
              }}
            >
              <h2
                style={{
                  marginTop: 0,
                }}
              >
                مرحبًا بك 👋
              </h2>

              <p
                style={{
                  color: "#64748b",
                  lineHeight: 1.8,
                }}
              >
                أنشئ مقالاتك، عدّلها،
                واحفظها في مكان واحد.
              </p>

              <button
                onClick={openNewArticle}
                style={{
                  width: "100%",
                  border: "none",
                  borderRadius: 14,
                  padding: 15,
                  background: "#111827",
                  color: "#ffffff",
                  fontSize: 16,
                  cursor: "pointer",
                  marginTop: 10,
                }}
              >
                ✍️ كتابة مقال جديد
              </button>

              <button
                onClick={openArticles}
                style={{
                  width: "100%",
                  border: "1px solid #e2e8f0",
                  borderRadius: 14,
                  padding: 15,
                  background: "#ffffff",
                  color: "#111827",
                  fontSize: 16,
                  cursor: "pointer",
                  marginTop: 10,
                }}
              >
                📚 مقالاتي
              </button>
            </div>
          </section>
        )}

        {/* =========================
            EDITOR
        ========================= */}

        {view === "editor" && (
          <section
            style={{
              background: "#ffffff",
              borderRadius: 20,
              padding: 24,
              boxShadow:
                "0 8px 30px rgba(0,0,0,0.06)",
            }}
          >
            <button
              onClick={() => {
                setView("home");
                setMessage("");
                setError("");
              }}
              style={{
                border: "none",
                background: "transparent",
                cursor: "pointer",
                marginBottom: 18,
                color: "#64748b",
              }}
            >
              ← العودة
            </button>

            <h2
              style={{
                marginTop: 0,
              }}
            >
              {editingArticleId
                ? "تعديل المقال"
                : "مقال جديد"}
            </h2>

            <input
              value={title}
              onChange={(e) =>
                setTitle(e.target.value)
              }
              placeholder="عنوان المقال"
              style={{
                width: "100%",
                boxSizing: "border-box",
                padding: 15,
                borderRadius: 12,
                border:
                  "1px solid #e2e8f0",
                fontSize: 18,
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
                padding: 14,
                borderRadius: 12,
                border:
                  "1px solid #e2e8f0",
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
              rows={16}
              style={{
                width: "100%",
                boxSizing: "border-box",
                padding: 15,
                borderRadius: 12,
                border:
                  "1px solid #e2e8f0",
                fontSize: 16,
                lineHeight: 1.9,
                resize: "vertical",
                outline: "none",
              }}
            />

            <button
              onClick={saveArticle}
              disabled={saving}
              style={{
                width: "100%",
                border: "none",
                borderRadius: 14,
                padding: 15,
                background: saving
                  ? "#94a3b8"
                  : "#111827",
                color: "#ffffff",
                fontSize: 16,
                cursor: saving
                  ? "not-allowed"
                  : "pointer",
                marginTop: 14,
              }}
            >
              {saving
                ? "جارٍ الحفظ..."
                : editingArticleId
                ? "💾 حفظ التعديلات"
                : "💾 حفظ المقال"}
            </button>

            {/* Delete current article */}

            {editingArticleId && (
              <button
                onClick={() =>
                  deleteArticle(
                    editingArticleId,
                    title
                  )
                }
                disabled={
                  deletingId ===
                  editingArticleId
                }
                style={{
                  width: "100%",
                  border:
                    "1px solid #fecaca",
                  borderRadius: 14,
                  padding: 15,
                  background: "#fff",
                  color: "#dc2626",
                  fontSize: 16,
                  cursor:
                    deletingId ===
                    editingArticleId
                      ? "not-allowed"
                      : "pointer",
                  marginTop: 10,
                }}
              >
                {deletingId ===
                editingArticleId
                  ? "جارٍ الحذف..."
                  : "🗑️ حذف المقال"}
              </button>
            )}
          </section>
        )}

        {/* =========================
            ARTICLES
        ========================= */}

        {view === "articles" && (
          <section>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent:
                  "space-between",
                marginBottom: 16,
                gap: 10,
              }}
            >
              <button
                onClick={() => {
                  setView("home");
                  setMessage("");
                  setError("");
                }}
                style={{
                  border: "none",
                  background:
                    "transparent",
                  cursor: "pointer",
                  color: "#64748b",
                }}
              >
                ← الرئيسية
              </button>

              <button
                onClick={openNewArticle}
                style={{
                  border: "none",
                  borderRadius: 12,
                  padding:
                    "10px 14px",
                  background: "#111827",
                  color: "#fff",
                  cursor: "pointer",
                }}
              >
                + مقال جديد
              </button>
            </div>

            {articles.length === 0 ? (
              <div
                style={{
                  background: "#ffffff",
                  borderRadius: 20,
                  padding: 30,
                  textAlign: "center",
                  color: "#64748b",
                }}
              >
                <div
                  style={{
                    fontSize: 40,
                    marginBottom: 10,
                  }}
                >
                  📭
                </div>

                لا توجد مقالات حتى الآن.
              </div>
            ) : (
              <div
                style={{
                  display: "grid",
                  gap: 12,
                }}
              >
                {articles.map(
                  (article) => (
                    <div
                      key={article.id}
                      style={{
                        background:
                          "#ffffff",
                        borderRadius: 18,
                        padding: 18,
                        boxShadow:
                          "0 5px 20px rgba(0,0,0,0.05)",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems:
                            "flex-start",
                          justifyContent:
                            "space-between",
                          gap: 12,
                        }}
                      >
                        {/* Article */}

                        <button
                          onClick={() =>
                            openArticle(
                              article.id
                            )
                          }
                          style={{
                            flex: 1,
                            border: "none",
                            background:
                              "transparent",
                            textAlign: "right",
                            cursor: "pointer",
                            padding: 0,
                          }}
                        >
                          <h3
                            style={{
                              margin:
                                "0 0 8px",
                              fontSize: 18,
                              color:
                                "#111827",
                            }}
                          >
                            {article.title}
                          </h3>

                          {article.excerpt && (
                            <p
                              style={{
                                margin:
                                  "0 0 10px",
                                color:
                                  "#64748b",
                                lineHeight: 1.7,
                                fontSize: 14,
                              }}
                            >
                              {
                                article.excerpt
                              }
                            </p>
                          )}

                          <div
                            style={{
                              display:
                                "flex",
                              gap: 10,
                              flexWrap:
                                "wrap",
                              color:
                                "#94a3b8",
                              fontSize: 12,
                            }}
                          >
                            <span>
                              {article.word_count ||
                                0}{" "}
                              كلمة
                            </span>

                            {article.category && (
                              <span>
                                📁{" "}
                                {
                                  article.category
                                }
                              </span>
                            )}

                            <span>
                              {article.status ===
                              "draft"
                                ? "مسودة"
                                : article.status}
                            </span>
                          </div>
                        </button>

                        {/* Delete */}

                        <button
                          onClick={() =>
                            deleteArticle(
                              article.id,
                              article.title
                            )
                          }
                          disabled={
                            deletingId ===
                            article.id
                          }
                          aria-label="حذف المقال"
                          style={{
                            flexShrink: 0,
                            width: 42,
                            height: 42,
                            border:
                              "1px solid #fee2e2",
                            borderRadius: 12,
                            background:
                              "#fff",
                            color:
                              "#dc2626",
                            cursor:
                              deletingId ===
                              article.id
                                ? "not-allowed"
                                : "pointer",
                            fontSize: 18,
                          }}
                        >
                          {deletingId ===
                          article.id
                            ? "..."
                            : "🗑️"}
                        </button>
                      </div>
                    </div>
                  )
                )}
              </div>
            )}
          </section>
        )}
      </div>
    </main>
  );
}
