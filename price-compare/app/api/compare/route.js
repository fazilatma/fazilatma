import { NextResponse } from "next/server";
import { searchProducts } from "../../../lib/catalog";
import { generateOffers, priceHistory } from "../../../lib/stores";
import { analyze, answerQuestion } from "../../../lib/ai";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") || "").trim();
  const pid = searchParams.get("pid");
  const ask = searchParams.get("ask");

  // مسیر سؤال سریع: تحلیل را دوباره محاسبه می‌کنیم و جواب AI را می‌دهیم
  if (pid && ask) {
    const { exact } = searchProducts(pid);
    const product = exact || (await getProductById(pid));
    if (!product) return NextResponse.json({ error: "محصول پیدا نشد" }, { status: 404 });
    const offers = generateOffers(product);
    const history = priceHistory(product);
    const analysis = analyze(product, offers, history);
    analysis._offers = offers;
    const answer = answerQuestion(ask, product, analysis);
    delete analysis._offers;
    return NextResponse.json({ answer });
  }

  if (!q) {
    const s = searchProducts("");
    return NextResponse.json({ kind: "suggested", products: s.slice(0, 8) });
  }

  const res = searchProducts(q);

  if (res.kind === "product") {
    const offers = generateOffers(res.exact);
    const history = priceHistory(res.exact);
    const analysis = analyze(res.exact, offers, history);
    return NextResponse.json({
      kind: "product",
      product: res.exact,
      similar: res.similar || [],
      offers,
      history,
      analysis,
    });
  }

  return NextResponse.json({
    kind: res.kind, // suggestions | empty
    suggestions: res.suggestions || [],
  });
}

async function getProductById(pid) {
  const { PRODUCTS } = await import("../../../lib/catalog");
  return PRODUCTS.find((p) => p.id === pid) || null;
}
