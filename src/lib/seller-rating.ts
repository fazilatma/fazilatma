// OptiBid Seller Trust & Performance Rating v1
// Evaluation window: rolling last 90 days where enough data exists.
// References used when selecting metrics/thresholds:
// - eBay Seller Standards: transaction defects, unresolved cases, late shipment and tracking.
// - Etsy Star Seller: 95% first-message response within 24h, 95% on-time tracked shipping, rating 4.8+.
// - Amazon seller metrics: <1% order defects, <2.5% cancellations, <4% late shipment, 95% valid tracking.

export type SellerPerformanceMetrics = {
  // Volume and feedback
  completedOrders90d: number;
  completedOrdersLifetime: number;
  reviewsCount90d: number;
  ratingAverage90d: number; // 0..5

  // Customer communication
  firstMessagesReceived90d: number;
  firstMessagesAnsweredWithin24h: number;
  averageFirstResponseHours: number;

  // Fulfilment & logistics
  shippedOrders90d: number;
  onTimeShipments90d: number;
  trackedShipments90d: number;
  validTrackedShipments90d: number;

  // Quality / operational incidents
  sellerCancellations90d: number;
  orderDefects90d: number;
  unresolvedCases90d: number;
  sellerFaultReturns90d: number;
  stockMismatchCancellations90d: number;
  disputesResolvedAgainstSeller90d: number;

  // Trust, compliance and profile
  identityVerified: boolean;
  bankAccountVerified: boolean;
  businessDocumentsVerified: boolean;
  policyViolationsOpen: number;
  profileCompletenessPercent: number; // 0..100
  activeInLast30Days: boolean;
};

export const SELLER_RATING_CRITERIA = [
  {
    key: "reliability",
    title: "قابلیت اتکا و کیفیت معامله",
    weight: 30,
    details: "نرخ نقص سفارش، لغو فروشنده، پرونده حل‌نشده و مغایرت موجودی",
  },
  {
    key: "fulfilment",
    title: "ارسال و تحویل",
    weight: 25,
    details: "ارسال به‌موقع، رهگیری معتبر و تحویل مطابق وعده",
  },
  {
    key: "buyerExperience",
    title: "رضایت و پاسخ‌گویی",
    weight: 25,
    details: "امتیاز خریداران، پاسخ اولیه ظرف ۲۴ ساعت و سرعت پاسخ",
  },
  {
    key: "trust",
    title: "اعتماد و انطباق",
    weight: 12,
    details: "احراز هویت، تایید حساب تسویه، مدارک و رعایت قوانین",
  },
  {
    key: "experience",
    title: "سابقه و فعالیت",
    weight: 8,
    details: "تعداد معاملات تکمیل‌شده، تکمیل پروفایل و فعالیت اخیر",
  },
] as const;

export const SELLER_BENCHMARKS = {
  orderDefectRate: { healthy: 1, warning: 2 },
  cancellationRate: { healthy: 1, warning: 2.5 },
  unresolvedCaseRate: { healthy: 0.3, warning: 1 },
  lateShipmentRate: { healthy: 2, warning: 4 },
  validTrackingRate: { healthy: 97, warning: 95 },
  onTimeShippingRate: { healthy: 95, warning: 80 },
  responseRate24h: { healthy: 95, warning: 80 },
  ratingAverage: { healthy: 4.8, warning: 4.3 },
} as const;

export type SellerScoreBreakdown = {
  finalScore: number;
  confidence: number;
  rankingEligible: boolean;
  minimumDataMessage: string | null;
  level: "new" | "standard" | "silver" | "gold" | "platinum" | "suspended";
  label: string;
  reasons: string[];
  metrics: {
    reliability: number;
    fulfilment: number;
    buyerExperience: number;
    trust: number;
    experience: number;
  };
  rates: {
    defectRate: number;
    cancellationRate: number;
    unresolvedCaseRate: number;
    lateShipmentRate: number;
    validTrackingRate: number;
    onTimeShippingRate: number;
    responseRate24h: number;
    bayesianRating: number;
  };
};

const clamp = (value: number, min = 0, max = 100) => Math.max(min, Math.min(max, value));
const percentage = (part: number, total: number, fallback = 100) =>
  total > 0 ? clamp((part / total) * 100) : fallback;

// Smooth score around a threshold; higher is better.
function scoreHigher(value: number, warning: number, excellent: number) {
  if (value <= warning) return 0;
  return clamp(((value - warning) / (excellent - warning)) * 100);
}

// Smooth score around a threshold; lower is better.
function scoreLower(value: number, excellent: number, warning: number) {
  if (value <= excellent) return 100;
  if (value >= warning) return 0;
  return clamp(((warning - value) / (warning - excellent)) * 100);
}

export function createDefaultSellerMetrics(): SellerPerformanceMetrics {
  return {
    completedOrders90d: 0,
    completedOrdersLifetime: 0,
    reviewsCount90d: 0,
    ratingAverage90d: 0,
    firstMessagesReceived90d: 0,
    firstMessagesAnsweredWithin24h: 0,
    averageFirstResponseHours: 0,
    shippedOrders90d: 0,
    onTimeShipments90d: 0,
    trackedShipments90d: 0,
    validTrackedShipments90d: 0,
    sellerCancellations90d: 0,
    orderDefects90d: 0,
    unresolvedCases90d: 0,
    sellerFaultReturns90d: 0,
    stockMismatchCancellations90d: 0,
    disputesResolvedAgainstSeller90d: 0,
    identityVerified: false,
    bankAccountVerified: false,
    businessDocumentsVerified: false,
    policyViolationsOpen: 0,
    profileCompletenessPercent: 0,
    activeInLast30Days: false,
  };
}

export function calculateSellerScore(input: SellerPerformanceMetrics): SellerScoreBreakdown {
  const m = { ...createDefaultSellerMetrics(), ...input };
  const orderBase = Math.max(m.completedOrders90d, 1);
  const shipmentBase = Math.max(m.shippedOrders90d, 1);

  const defectRate = percentage(m.orderDefects90d, orderBase, 0);
  const cancellationRate = percentage(m.sellerCancellations90d, orderBase, 0);
  const unresolvedCaseRate = percentage(m.unresolvedCases90d, orderBase, 0);
  const lateShipmentRate = 100 - percentage(m.onTimeShipments90d, shipmentBase, 100);
  const validTrackingRate = percentage(m.validTrackedShipments90d, Math.max(m.trackedShipments90d, shipmentBase), 0);
  const onTimeShippingRate = percentage(m.onTimeShipments90d, shipmentBase, 0);
  const responseRate24h = percentage(m.firstMessagesAnsweredWithin24h, m.firstMessagesReceived90d, 0);

  // Bayesian average prevents a single 5-star review from outranking established sellers.
  const priorRating = 4.2;
  const priorWeight = 10;
  const bayesianRating =
    m.reviewsCount90d > 0
      ? (m.ratingAverage90d * m.reviewsCount90d + priorRating * priorWeight) /
        (m.reviewsCount90d + priorWeight)
      : priorRating;

  // Reliability 30: order defects, cancellations, unresolved cases, return/stock accuracy.
  const reliability =
    scoreLower(defectRate, SELLER_BENCHMARKS.orderDefectRate.healthy, SELLER_BENCHMARKS.orderDefectRate.warning) * 0.35 +
    scoreLower(cancellationRate, SELLER_BENCHMARKS.cancellationRate.healthy, SELLER_BENCHMARKS.cancellationRate.warning) * 0.25 +
    scoreLower(unresolvedCaseRate, SELLER_BENCHMARKS.unresolvedCaseRate.healthy, SELLER_BENCHMARKS.unresolvedCaseRate.warning) * 0.25 +
    scoreLower(percentage(m.stockMismatchCancellations90d + m.sellerFaultReturns90d, orderBase, 0), 1, 5) * 0.15;

  // Fulfilment 25: on-time handling, valid tracking, late shipments.
  const fulfilment =
    scoreHigher(onTimeShippingRate, SELLER_BENCHMARKS.onTimeShippingRate.warning, SELLER_BENCHMARKS.onTimeShippingRate.healthy) * 0.5 +
    scoreHigher(validTrackingRate, SELLER_BENCHMARKS.validTrackingRate.warning, SELLER_BENCHMARKS.validTrackingRate.healthy) * 0.35 +
    scoreLower(lateShipmentRate, SELLER_BENCHMARKS.lateShipmentRate.healthy, SELLER_BENCHMARKS.lateShipmentRate.warning) * 0.15;

  // Buyer experience 25: Bayesian rating, response rate and first response speed.
  const buyerExperience =
    scoreHigher(bayesianRating, SELLER_BENCHMARKS.ratingAverage.warning, SELLER_BENCHMARKS.ratingAverage.healthy) * 0.6 +
    scoreHigher(responseRate24h, SELLER_BENCHMARKS.responseRate24h.warning, SELLER_BENCHMARKS.responseRate24h.healthy) * 0.3 +
    scoreLower(m.averageFirstResponseHours || 24, 1, 24) * 0.1;

  const trust =
    (m.identityVerified ? 35 : 0) +
    (m.bankAccountVerified ? 30 : 0) +
    (m.businessDocumentsVerified ? 20 : 0) +
    scoreLower(m.policyViolationsOpen, 0, 2) * 0.15;

  const experience =
    clamp((m.completedOrdersLifetime / 100) * 100) * 0.5 +
    clamp(m.profileCompletenessPercent) * 0.3 +
    (m.activeInLast30Days ? 100 : 0) * 0.2;

  let finalScore =
    reliability * 0.3 +
    fulfilment * 0.25 +
    buyerExperience * 0.25 +
    trust * 0.12 +
    experience * 0.08;

  const reasons: string[] = [];

  // Strong, transparent penalties for serious seller-fault events.
  if (m.policyViolationsOpen > 0) {
    finalScore -= Math.min(30, m.policyViolationsOpen * 12);
    reasons.push("تخلف باز در حال بررسی");
  }
  if (unresolvedCaseRate > 0.3) {
    finalScore -= Math.min(15, (unresolvedCaseRate - 0.3) * 8);
    reasons.push("پرونده‌های حل‌نشده به نفع خریدار");
  }
  if (defectRate > 1) {
    finalScore -= Math.min(12, (defectRate - 1) * 4);
    reasons.push("نرخ نقص سفارش بالاتر از هدف داخلی");
  }
  if (cancellationRate > 2.5) {
    finalScore -= Math.min(10, (cancellationRate - 2.5) * 3);
    reasons.push("نرخ لغو فروشنده بالاتر از آستانه");
  }

  const confidence = clamp((m.completedOrders90d / 30) * 70 + (m.reviewsCount90d / 15) * 30);
  const rankingEligible =
    m.completedOrders90d >= 5 &&
    m.reviewsCount90d >= 3 &&
    m.identityVerified &&
    m.bankAccountVerified &&
    m.policyViolationsOpen === 0;

  finalScore = Math.round(clamp(finalScore) * 10) / 10;

  let level: SellerScoreBreakdown["level"] = "new";
  let label = "فروشنده جدید";
  if (m.policyViolationsOpen > 0 || unresolvedCaseRate > 2) {
    level = "suspended";
    label = "نیازمند بررسی";
  } else if (!rankingEligible) {
    level = "new";
    label = "در حال ارزیابی";
  } else if (finalScore >= 92) {
    level = "platinum";
    label = "تامین‌کننده پلاتینیوم";
  } else if (finalScore >= 84) {
    level = "gold";
    label = "تامین‌کننده طلایی";
  } else if (finalScore >= 72) {
    level = "silver";
    label = "تامین‌کننده نقره‌ای";
  } else {
    level = "standard";
    label = "تامین‌کننده استاندارد";
  }

  return {
    finalScore,
    confidence: Math.round(confidence),
    rankingEligible,
    minimumDataMessage: rankingEligible
      ? null
      : "برای ورود به رتبه‌بندی عمومی، حداقل ۵ معامله تکمیل‌شده، ۳ نظر، تایید هویت و تایید حساب تسویه لازم است.",
    level,
    label,
    reasons,
    metrics: {
      reliability: Math.round(reliability * 10) / 10,
      fulfilment: Math.round(fulfilment * 10) / 10,
      buyerExperience: Math.round(buyerExperience * 10) / 10,
      trust: Math.round(trust * 10) / 10,
      experience: Math.round(experience * 10) / 10,
    },
    rates: {
      defectRate: Math.round(defectRate * 100) / 100,
      cancellationRate: Math.round(cancellationRate * 100) / 100,
      unresolvedCaseRate: Math.round(unresolvedCaseRate * 100) / 100,
      lateShipmentRate: Math.round(lateShipmentRate * 100) / 100,
      validTrackingRate: Math.round(validTrackingRate * 100) / 100,
      onTimeShippingRate: Math.round(onTimeShippingRate * 100) / 100,
      responseRate24h: Math.round(responseRate24h * 100) / 100,
      bayesianRating: Math.round(bayesianRating * 100) / 100,
    },
  };
}

export function ratingLevelClass(level: SellerScoreBreakdown["level"]) {
  const classes = {
    new: "bg-slate-100 text-slate-700 border-slate-200",
    standard: "bg-blue-100 text-blue-700 border-blue-200",
    silver: "bg-gray-100 text-gray-700 border-gray-300",
    gold: "bg-amber-100 text-amber-800 border-amber-200",
    platinum: "bg-cyan-100 text-cyan-800 border-cyan-200",
    suspended: "bg-red-100 text-red-700 border-red-200",
  };
  return classes[level];
}
