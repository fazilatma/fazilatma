import { getOptiBidData, type JsonOrder, type JsonStoreOrder } from "./json-store";

/** مبلغ‌های ذخیره‌شده گاهی رشته‌اند و گاهی عدد؛ این تابع هر دو را به عدد تبدیل می‌کند. */
function money(value: unknown) {
  if (typeof value === "number") return Number.isFinite(value) ? Math.round(value) : 0;
  const digits = String(value ?? "")
    .replace(/[۰-۹]/g, (digit) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(digit)))
    .replace(/[^\d]/g, "");
  return digits ? Number(digits) : 0;
}

export type MarketOrderRow = {
  id: string;
  createdAt: string;
  buyerName: string;
  sellerName: string;
  title: string;
  category: string;
  quantity: number;
  totalAmount: number;
  commission: number;
  sellerShare: number;
  status: JsonOrder["status"];
  paymentMethod?: JsonOrder["paymentMethod"];
  trackingCode?: string;
  paidAt?: string;
  deliveredAt?: string;
  shippingAddress: string;
  adminNote?: string;
};

export type StoreOrderRow = {
  id: string;
  createdAt: string;
  buyerName: string;
  items: Array<{ title: string; quantity: number; totalPrice: number }>;
  totalAmount: number;
  status: JsonStoreOrder["status"];
  receiverPhone: string;
  shippingAddress: string;
  paidAt?: string;
  paymentMethod?: JsonStoreOrder["paymentMethod"];
  trackingCode?: string;
  adminNote?: string;
  /** مبلغی که پس از لغو به کیف پول خریدار بازگشته است. */
  refundedAmount?: number;
  refundedAt?: string;
};

export type SellerSummaryRow = {
  sellerId: number;
  sellerName: string;
  ordersCount: number;
  completedCount: number;
  openCount: number;
  cancelledCount: number;
  grossAmount: number;
  sellerShare: number;
  commission: number;
  lastOrderAt: string;
};

export type AdminOrdersOverview = {
  marketOrders: MarketOrderRow[];
  storeOrders: StoreOrderRow[];
  sellers: SellerSummaryRow[];
  totals: {
    marketCount: number;
    marketGross: number;
    marketCommission: number;
    marketSellerShare: number;
    marketOpen: number;
    marketCompleted: number;
    storeCount: number;
    storeRevenue: number;
    storePending: number;
    allCount: number;
  };
};

const OPEN_ORDER_STATUSES: JsonOrder["status"][] = ["pending_payment", "paid", "shipped"];

export function isCompletedOrderStatus(status: string) {
  return status === "completed";
}

/** همهٔ سفارش‌های فروشگاه، بازار (خریدار↔فروشنده) و جمع فروش هر فروشنده. */
export async function getAdminOrdersOverview(): Promise<AdminOrdersOverview> {
  const data = await getOptiBidData();

  const marketOrders: MarketOrderRow[] = data.orders.map((order) => ({
    id: order.id,
    createdAt: order.createdAt,
    buyerName: order.buyerName,
    sellerName: order.sellerName,
    title: order.title,
    category: order.category,
    quantity: Math.max(1, Number(order.quantity) || 1),
    totalAmount: money(order.totalAmount),
    commission: money(order.platformFee),
    sellerShare: money(order.sellerAmount),
    status: order.status,
    paymentMethod: order.paymentMethod,
    trackingCode: order.trackingCode,
    paidAt: order.paymentAt,
    deliveredAt: order.deliveredAt,
    shippingAddress: order.shippingAddress,
    adminNote: order.adminNote,
  }));

  const storeOrders: StoreOrderRow[] = data.storeOrders.map((order) => ({
    id: order.id,
    createdAt: order.createdAt,
    buyerName: order.buyerName,
    items: (order.items || []).map((item) => ({
      title: item.title,
      quantity: item.quantity,
      totalPrice: money(item.totalPrice),
    })),
    totalAmount: money(order.totalAmount),
    status: order.status,
    receiverPhone: order.receiverPhone,
    shippingAddress: order.shippingAddress,
    paidAt: order.paidAt,
    paymentMethod: order.paymentMethod,
    trackingCode: order.trackingCode,
    adminNote: order.adminNote,
    refundedAmount: Number(order.refundedAmount || 0) || undefined,
    refundedAt: order.refundedAt,
  }));

  const sellerMap = new Map<number, SellerSummaryRow>();
  for (const order of data.orders) {
    const sellerId = Number(order.sellerId ?? 0);
    const row =
      sellerMap.get(sellerId) ??
      ({
        sellerId,
        sellerName: order.sellerName || "بدون نام",
        ordersCount: 0,
        completedCount: 0,
        openCount: 0,
        cancelledCount: 0,
        grossAmount: 0,
        sellerShare: 0,
        commission: 0,
        lastOrderAt: "",
      } satisfies SellerSummaryRow);
    const amount = money(order.totalAmount);
    row.ordersCount += 1;
    if (order.status === "completed") row.completedCount += 1;
    if (OPEN_ORDER_STATUSES.includes(order.status)) row.openCount += 1;
    if (order.status === "cancelled" || order.status === "returned") row.cancelledCount += 1;
    if (order.status !== "cancelled" && order.status !== "returned") {
      row.grossAmount += amount;
      row.sellerShare += money(order.sellerAmount);
      row.commission += money(order.platformFee);
    }
    if (!row.lastOrderAt || new Date(order.createdAt) > new Date(row.lastOrderAt)) {
      row.lastOrderAt = order.createdAt;
    }
    sellerMap.set(sellerId, row);
  }

  const sellers = Array.from(sellerMap.values()).sort((a, b) => b.grossAmount - a.grossAmount);

  const paidStoreOrders = storeOrders.filter(
    (order) => order.status !== "pending_payment" && order.status !== "cancelled",
  );

  return {
    marketOrders: marketOrders.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    ),
    storeOrders: storeOrders.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    ),
    sellers,
    totals: {
      marketCount: marketOrders.length,
      marketGross: marketOrders
        .filter((order) => order.status !== "cancelled" && order.status !== "returned")
        .reduce((sum, order) => sum + order.totalAmount, 0),
      marketCommission: marketOrders
        .filter((order) => order.status !== "cancelled" && order.status !== "returned")
        .reduce((sum, order) => sum + order.commission, 0),
      marketSellerShare: marketOrders
        .filter((order) => order.status !== "cancelled" && order.status !== "returned")
        .reduce((sum, order) => sum + order.sellerShare, 0),
      marketOpen: marketOrders.filter((order) => OPEN_ORDER_STATUSES.includes(order.status)).length,
      marketCompleted: marketOrders.filter((order) => order.status === "completed").length,
      storeCount: storeOrders.length,
      storeRevenue: paidStoreOrders.reduce((sum, order) => sum + order.totalAmount, 0),
      storePending: storeOrders.filter((order) => order.status === "pending_payment").length,
      allCount: marketOrders.length + storeOrders.length,
    },
  };
}
