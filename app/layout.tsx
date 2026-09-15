import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "서울 임시버스 지도",
  description: "서울 버스 파업 비상수송 임시노선 안내",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
