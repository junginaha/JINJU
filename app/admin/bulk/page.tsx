import type { Metadata } from "next";
import AdminBulkBlind from "../../../components/AdminBulkBlind";

export const metadata: Metadata = {
  title: "일괄 블라인드 | 진주",
  robots: { index: false, follow: false },
};

export default function AdminBulkPage() {
  return <AdminBulkBlind />;
}
