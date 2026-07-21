import type { Metadata } from "next";
import AdminReview from "../../components/AdminReview";

export const metadata: Metadata = {
  title: "운영자 승인 | 진주",
  robots: { index: false, follow: false },
};

export default function AdminPage() {
  return <AdminReview />;
}
