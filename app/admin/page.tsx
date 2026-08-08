import type { Metadata } from "next";
import AdminReview from "../../components/AdminReview";

export const metadata: Metadata = {
  title: "운영자 승인 | 진주",
  robots: { index: false, follow: false },
};

export default function AdminPage() {
  return <>
    <a href="/admin/bulk" style={{ position: "fixed", right: 16, bottom: 16, zIndex: 2000, padding: "11px 14px", borderRadius: 10, background: "#f3f3f3", color: "#111", fontSize: 12, fontWeight: 750 }}>일괄 블라인드</a>
    <AdminReview />
  </>;
}
