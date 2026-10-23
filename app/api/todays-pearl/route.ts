import { getPublicPosts } from '../../../lib/public-posts';
import { selectTodaysPearl } from '../../../lib/todays-pearl';
export const dynamic = 'force-dynamic';
export async function GET() {
  try {
    return Response.json({ pearl: selectTodaysPearl(await getPublicPosts()) }, { headers: { 'cache-control': 'no-store' } });
  } catch {
    return Response.json({ error: '오늘의 진주를 불러오지 못했어요.' }, { status: 503, headers: { 'cache-control': 'no-store' } });
  }
}
