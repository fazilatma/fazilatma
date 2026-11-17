// کانکتور اینستاگرام — نیازمند Instagram Graph API / Hashtag API (توکن رسمی).
// اینستاگرام بدون احراز هویت اجازه‌ی خواندن پست‌ها را نمی‌دهد؛ در این حالت داده‌ی نمایشی می‌دهیم.
import { demoOffers } from "../pricing";
export const META = { id: "instagram", name: "اینستاگرام", color: "#c13584", kind: "social" };

export async function search(query, ctx = {}) {
  // TODO (اتصال واقع): با IG_ACCESS_TOKEN و IG_BUSINESS_ID از Graph API هشتگ/میشِن‌ها را بخوان،
  // زیربنای استخراج قیمت با extractPrices در normalize.js آماده است.
  return {
    source: META, mode: "demo",
    note: "اینستاگرام فقط با توکن رسمی Graph API — فعلاً نمونه‌ی نمایشی",
    offers: demoOffers(query, META, ctx, { note: "پست نمایشی پیج" }),
  };
}
