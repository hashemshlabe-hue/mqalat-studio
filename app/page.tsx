"use client";

import {
  FileText,
  Send,
  CalendarClock,
  Image,
  Settings,
  Plus,
  LayoutDashboard,
} from "lucide-react";

const menuItems = [
  { label: "الرئيسية", icon: LayoutDashboard },
  { label: "المقالات", icon: FileText },
  { label: "الوسائط", icon: Image },
  { label: "القنوات", icon: Send },
  { label: "المجدول", icon: CalendarClock },
  { label: "الإعدادات", icon: Settings },
];

export default function Home() {
  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">م</div>
          <div>
            <strong>مقالات</strong>
            <span>Article Studio</span>
          </div>
        </div>

        <nav className="navigation">
          {menuItems.map((item, index) => {
            const Icon = item.icon;

            return (
              <button
                key={item.label}
                className={`nav-item ${index === 0 ? "active" : ""}`}
              >
                <Icon size={19} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="sidebar-bottom">
          <div className="status-dot" />
          <span>النظام يعمل</span>
        </div>
      </aside>

      <section className="content">
        <header className="topbar">
          <div>
            <p className="eyebrow">Article Studio</p>
            <h1>مرحبًا بك 👋</h1>
            <p className="subtitle">
              أنشئ مقالاتك ونظّمها وانشرها إلى قنوات Telegram من مكان واحد.
            </p>
          </div>

          <button className="primary-button">
            <Plus size={19} />
            مقال جديد
          </button>
        </header>

        <section className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">
              <FileText size={21} />
            </div>
            <div>
              <span>المقالات</span>
              <strong>0</strong>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">
              <Send size={21} />
            </div>
            <div>
              <span>القنوات</span>
              <strong>0</strong>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">
              <CalendarClock size={21} />
            </div>
            <div>
              <span>المجدول</span>
              <strong>0</strong>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">
              <Image size={21} />
            </div>
            <div>
              <span>الوسائط</span>
              <strong>0</strong>
            </div>
          </div>
        </section>

        <section className="welcome-card">
          <div>
            <span className="card-label">ابدأ الآن</span>
            <h2>أنشئ أول مقال لك</h2>
            <p>
              محرر متقدم، وسائط، معاينة، حفظ تلقائي، جدولة، وإدارة متعددة
              للقنوات — كل ذلك داخل منصة واحدة.
            </p>

            <button className="primary-button">
              <Plus size={19} />
              إنشاء مقال
            </button>
          </div>

          <div className="editor-preview">
            <div className="preview-toolbar">
              <span />
              <span />
              <span />
              <span />
            </div>

            <div className="preview-lines">
              <i />
              <i />
              <i />
              <i />
              <i />
            </div>
          </div>
        </section>
      </section>
    </main>
  );
}
