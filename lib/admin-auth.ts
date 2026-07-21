function timingSafeEqual(left: string, right: string) {
  const encoder = new TextEncoder();
  const leftBytes = encoder.encode(left);
  const rightBytes = encoder.encode(right);
  const length = Math.max(leftBytes.length, rightBytes.length);
  let difference = leftBytes.length ^ rightBytes.length;
  for (let index = 0; index < length; index += 1) {
    difference |= (leftBytes[index] ?? 0) ^ (rightBytes[index] ?? 0);
  }
  return difference === 0;
}

export function isAdminRequest(request: Request) {
  const expected = process.env.ADMIN_REVIEW_SECRET;
  const supplied = request.headers.get("x-admin-secret") || "";
  return Boolean(expected && supplied && timingSafeEqual(expected, supplied));
}
