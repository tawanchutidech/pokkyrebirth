import type { Metadata } from "next";
import "./globals.css";
import SiteHeader from "@/components/SiteHeader";
import RankMascot from "@/components/RankMascot";

export const metadata: Metadata = {
  title: "TDERM Guild War Hub",
  description: "เครื่องมือวางแผนทีม Guild War สำหรับเกม 7 Knights",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="th" className="dark">
      <head>
        <link rel="icon" href="/public/images/SevenKnight.png" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Anuphan:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <div className="app-shell">
          <SiteHeader />
          {children}
          <footer className="site-footer">
            <div className="site-footer-inner">
              <div className="site-footer-brand">TDERM Guild War Hub</div>
              <div className="site-footer-meta">
                <span>เครื่องมือวางแผนทีม Guild War สำหรับเกม 7 Knights</span>
                <span className="site-footer-dot">·</span>
                <span>
                  พัฒนาโดย <strong>BRAV0</strong> จากกิลด์ <strong>เสือหนิก</strong>
                </span>
              </div>
              <div>© 2026 BRAV0 · เสือหนิก &amp; หนิกเสือ &amp; LEGENDS · ไม่ใช่เนื้อหาทางการของ 7 Knights</div>
            </div>
          </footer>
        </div>
        <RankMascot />
      </body>
    </html>
  );
}
