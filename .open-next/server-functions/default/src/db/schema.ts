import { pgTable, serial, text, varchar, integer, decimal, timestamp, boolean, pgEnum } from "drizzle-orm/pg-core";

// User types
export const userTypeEnum = pgEnum("user_type", ["buyer", "seller", "admin"]);

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  fullName: varchar("full_name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  password: varchar("password", { length: 255 }).notNull(),
  userType: userTypeEnum("user_type").default("buyer"),
  avatar: text("avatar"),
  bio: text("bio"),
  phone: varchar("phone", { length: 20 }),
  rating: decimal("rating", { precision: 3, scale: 2 }).default("0.00"),
  totalSales: integer("total_sales").default(0),
  totalPurchases: integer("total_purchases").default(0),
  totalEarnings: decimal("total_earnings", { precision: 10, scale: 2 }).default("0.00"),
  isVerified: boolean("is_verified").default(false),
  isSeller: boolean("is_seller").default(false),
  walletBalance: decimal("wallet_balance", { precision: 10, scale: 2 }).default("0.00"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Categories table
export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  nameFa: varchar("name_fa", { length: 100 }).notNull(),
  icon: text("icon"),
  parentId: integer("parent_id"),
});

// Seller Categories - فروشندگان دسته‌های مورد نظر خود را انتخاب می‌کنند
export const sellerCategories = pgTable("seller_categories", {
  id: serial("id").primaryKey(),
  sellerId: integer("seller_id").references(() => users.id).notNull(),
  categoryId: integer("category_id").references(() => categories.id).notNull(),
  isActive: boolean("is_active").default(true),
});

// Products table
export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description").notNull(),
  categoryId: integer("category_id").references(() => categories.id),
  sellerId: integer("seller_id").references(() => users.id),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  originalPrice: decimal("original_price", { precision: 10, scale: 2 }),
  stock: integer("stock").default(0),
  images: text("images"),
  brand: varchar("brand", { length: 100 }),
  status: varchar("status", { length: 50 }).default("active"),
  views: integer("views").default(0),
  salesCount: integer("sales_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

// Purchase Requests - درخواست‌های خرید از طرف خریدار
export const purchaseRequests = pgTable("purchase_requests", {
  id: serial("id").primaryKey(),
  buyerId: integer("buyer_id").references(() => users.id).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description").notNull(),
  categoryId: integer("category_id").references(() => categories.id).notNull(),
  budget: decimal("budget", { precision: 10, scale: 2 }).notNull(),
  deadline: timestamp("deadline"),
  status: varchar("status", { length: 50 }).default("open"), // open, has_offers, selected, paid, shipped, delivered, completed, cancelled
  views: integer("views").default(0),
  offersCount: integer("offers_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

// Offers - پیشنهادات فروشندگان برای درخواست‌های خرید
export const offers = pgTable("offers", {
  id: serial("id").primaryKey(),
  requestId: integer("request_id").references(() => purchaseRequests.id).notNull(),
  sellerId: integer("seller_id").references(() => users.id).notNull(),
  productId: integer("product_id").references(() => products.id),
  offeredPrice: decimal("offered_price", { precision: 10, scale: 2 }).notNull(),
  deliveryDays: integer("delivery_days").notNull(),
  message: text("message"),
  status: varchar("status", { length: 50 }).default("pending"), // pending, accepted, rejected, counter_offered
  createdAt: timestamp("created_at").defaultNow(),
});

// Orders - سفارشات نهایی
export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  orderId: varchar("order_id", { length: 50 }).notNull().unique(), // کد سفارش یکتا
  buyerId: integer("buyer_id").references(() => users.id).notNull(),
  sellerId: integer("seller_id").references(() => users.id).notNull(),
  requestId: integer("request_id").references(() => purchaseRequests.id),
  offerId: integer("offer_id").references(() => offers.id),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  platformFee: decimal("platform_fee", { precision: 10, scale: 2 }).default("0.00"), // کمیسیون پلتفرم
  sellerAmount: decimal("seller_amount", { precision: 10, scale: 2 }).notNull(), // مبلغ قابل پرداخت به فروشنده
  status: varchar("status", { length: 50 }).default("pending_payment"), // pending_payment, paid, shipped, delivered, completed, cancelled, disputed
  shippingAddress: text("shipping_address"),
  trackingCode: varchar("tracking_code", { length: 100 }),
  paymentMethod: varchar("payment_method", { length: 50 }),
  paidAt: timestamp("paid_at"),
  shippedAt: timestamp("shipped_at"),
  deliveredAt: timestamp("delivered_at"),
  completedAt: timestamp("completed_at"),
  cancelledAt: timestamp("cancelled_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Escrow Transactions - تراکنش‌های امانی
export const escrowTransactions = pgTable("escrow_transactions", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").references(() => orders.id).notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  platformFee: decimal("platform_fee", { precision: 10, scale: 2 }).default("0.00"),
  sellerAmount: decimal("seller_amount", { precision: 10, scale: 2 }).notNull(),
  status: varchar("status", { length: 50 }).default("held"), // held, released, refunded
  heldAt: timestamp("held_at").defaultNow(),
  releasedAt: timestamp("released_at"),
  refundedAt: timestamp("refunded_at"),
});

// Reviews table
export const reviews = pgTable("reviews", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").references(() => orders.id),
  reviewerId: integer("reviewer_id").references(() => users.id).notNull(),
  revieweeId: integer("reviewee_id").references(() => users.id).notNull(),
  rating: integer("rating").notNull(),
  comment: text("comment"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Messages table
export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  senderId: integer("sender_id").references(() => users.id).notNull(),
  receiverId: integer("receiver_id").references(() => users.id).notNull(),
  content: text("content").notNull(),
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Cart table
export const cart = pgTable("cart", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  productId: integer("product_id").references(() => products.id).notNull(),
  quantity: integer("quantity").default(1),
  createdAt: timestamp("created_at").defaultNow(),
});

// Wishlist table
export const wishlist = pgTable("wishlist", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  productId: integer("product_id").references(() => products.id).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Platform Settings - تنظیمات پلتفرم شامل کمیسیون
export const platformSettings = pgTable("platform_settings", {
  id: serial("id").primaryKey(),
  key: varchar("key", { length: 100 }).notNull().unique(),
  value: text("value").notNull(),
  description: text("description"),
  updatedAt: timestamp("updated_at").defaultNow(),
});
