import fs from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");
const ORDERS_FILE = path.join(DATA_DIR, "orders.json");

function ensureFile() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(ORDERS_FILE)) fs.writeFileSync(ORDERS_FILE, JSON.stringify([], null, 2));
}

export function getOrders() {
  ensureFile();
  try {
    return JSON.parse(fs.readFileSync(ORDERS_FILE, "utf-8"));
  } catch {
    return [];
  }
}

export function saveOrders(orders) {
  ensureFile();
  fs.writeFileSync(ORDERS_FILE, JSON.stringify(orders, null, 2));
}

export function createOrder({ user, product, offer, size, deliveryType, address, mobile, name }) {
  const orders = getOrders();
  const orderId = "ORD-" + Date.now().toString().slice(-8);
  const trackingCode = "TRK" + Math.random().toString(36).substr(2, 8).toUpperCase();
  
  const isImmediate = deliveryType === "immediate";
  const finalPrice = isImmediate ? offer.immediate : offer.economyTotal;
  const deliveryDays = isImmediate ? 1 : offer.deliveryMax || 7;
  const deliveryDate = new Date();
  deliveryDate.setDate(deliveryDate.getDate() + deliveryDays);

  const newOrder = {
    id: orderId,
    trackingCode,
    userId: user?.id || "guest",
    userName: name || user?.name || "مهمان",
    userEmail: user?.email || "",
    userMobile: mobile || user?.mobile || "",
    product: {
      query: product.query,
      name: product.name || product.query,
      image: product.image || "",
      basePrice: product.basePrice || 0,
    },
    offer: {
      source: offer.name,
      flag: offer.flag,
      sourceId: offer.id,
      delivery: offer.delivery,
      deliveryMin: offer.deliveryMin,
      deliveryMax: offer.deliveryMax,
      price: offer.price,
      total: offer.total,
      economyTotal: offer.economyTotal,
      immediate: offer.immediate,
      breakdown: offer.breakdown,
      cif: offer.cif,
      duty: offer.duty,
      vat: offer.vat,
      risk: offer.risk,
    },
    size: size || "42",
    deliveryType, // immediate | economy
    finalPrice,
    address: address || "",
    status: "pending", // pending, purchasing, shipping, customs, delivering, delivered, returned
    statusHistory: [
      { status: "pending", label: "ثبت سفارش", time: new Date().toISOString(), desc: "سفارش شما ثبت شد" }
    ],
    paymentStatus: "pending", // pending, partial, paid
    paymentAmount: Math.round(finalPrice * 0.5), // 50% پیش پرداخت
    createdAt: new Date().toISOString(),
    estimatedDelivery: deliveryDate.toISOString(),
    notes: isImmediate ? "فوری از انبار تهران - موجودی مجازی" : `اقتصادی از ${offer.name} - ${offer.delivery}`,
  };

  orders.unshift(newOrder);
  saveOrders(orders);
  return newOrder;
}

export function updateOrderStatus(orderId, newStatus, desc = "") {
  const orders = getOrders();
  const order = orders.find(o => o.id === orderId);
  if (!order) throw new Error("سفارش یافت نشد");
  
  const statusLabels = {
    pending: "ثبت سفارش",
    purchasing: "در حال خرید از خارج",
    shipping: "در حال حمل بین‌الملل",
    customs: "در گمرک - در حال ترخیص",
    delivering: "در حال تحویل داخلی",
    delivered: "تحویل داده شد",
    returned: "مرجوع شد",
    cancelled: "لغو شد"
  };

  order.status = newStatus;
  order.statusHistory.push({
    status: newStatus,
    label: statusLabels[newStatus] || newStatus,
    time: new Date().toISOString(),
    desc: desc || statusLabels[newStatus] || ""
  });

  saveOrders(orders);
  return order;
}

export function getOrdersByUser(userId) {
  const orders = getOrders();
  return orders.filter(o => o.userId === userId);
}

export function getAllOrders() {
  return getOrders();
}
