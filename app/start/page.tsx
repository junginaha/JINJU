import { redirect } from "next/navigation";

// 기존 홍보 주소는 유지하고 중간 안내 화면 없이 글쓰기로 연결한다.
export default function StartPage() {
  redirect("/?write=1");
}
