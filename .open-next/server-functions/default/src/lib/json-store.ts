import { promises as fs } from "node:fs";
import path from "node:path";
import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
  scryptSync,
  timingSafeEqual,
} from "node:crypto";
import {
  calculateSellerScore,
  createDefaultSellerMetrics,
  type SellerPerformanceMetrics,
} from "@/lib/seller-rating";
import { getKvNamespace, kvPutText } from "@/lib/kv-storage";
import { getExternalMarketSeriesForProduct } from "@/lib/external-market-data";
import {
  estimateFairUsedProductPrice,
  normalizeProductValuationFactors,
  type AiPriceEstimate,
  type ProductValuationFactors,
} from "@/lib/request-valuation";
import {
  normalizeProductImageAttachments,
  type ProductImageAttachment,
} from "@/lib/product-image-shared";

// کلید KV که کل داده‌های برنامه به صورت یک JSON در آن ذخیره می‌شود.
// فقط در محیط Cloudflare Workers استفاده می‌شود.
const KV_DATA_KEY = "optibid:data";

export type UserRole = "buyer" | "seller" | "admin";
export type OrderStatus =
  | "pending_payment"
  | "paid"
  | "shipped"
  | "completed"
  | "cancelled"
  | "returned";

export type JsonRequest = {
  id: number;
  buyerId: number;
  buyerName: string;
  title: string;
  description: string;
  category: string;
  budget: string;
  quantity: number;
  deadline: string;
  imageNames: string[];
  productImages?: ProductImageAttachment[];
  valuationFactors?: ProductValuationFactors;
  aiPriceEstimate?: AiPriceEstimate;
  status:
    | "open"
    | "selected"
    | "paid"
    | "shipped"
    | "completed"
    | "cancelled"
    | "returned";
  offersCount: number;
  createdAt: string;
};

export type JsonKycDocument = {
  id: string;
  type: "national_card" | "birth_certificate" | "bank_card";
  label: string;
  originalName: string;
  storedName: string;
  mimeType: string;
  size: number;
  uploadedAt: string;
};

export type SocialAuthProvider = "google" | "facebook";

export type JsonSocialAccount = {
  provider: SocialAuthProvider;
  providerUserId: string;
  email: string;
  linkedAt: string;
};

export type JsonUser = {
  id: number;
  fullName: string;
  username?: string;
  email: string;
  password?: string;
  role: UserRole;
  isActive: boolean;
  kycStatus?: "pending" | "approved" | "rejected";
  kycDocuments?: JsonKycDocument[];
  kycRejectReason?: string;
  kycReviewedAt?: string;
  createdAt: string;
  avatarName?: string;
  socialAccounts?: JsonSocialAccount[];
  bio?: string;
  categories?: string[];
  city?: string;
  postalCode?: string;
  defaultAddress?: string;
  bankAccountHolder?: string;
  bankName?: string;
  bankAccountNumber?: string;
  bankCardNumber?: string;
  bankShebaNumber?: string;
  bankDetailsVerified?: boolean;
  walletBalance: number;
  sellerMetrics?: SellerPerformanceMetrics;
};

export type JsonWithdrawalRequest = {
  id: string;
  userId: number;
  userName: string;
  role: "buyer" | "seller";
  amount: number;
  status: "pending" | "approved" | "rejected";
  bankAccountHolder: string;
  bankName: string;
  bankAccountNumber: string;
  bankCardNumber: string;
  bankShebaNumber: string;
  createdAt: string;
  resolvedAt?: string;
  adminNote?: string;
};

export type OfferProductSpecs = {
  brand: string;
  exactModel: string;
  serialOrConfig: string;
  cpu: string;
  ram: string;
  storage: string;
  gpu: string;
  display: string;
  manufactureYear: string;
  productCondition: string;
  warrantyStatus: string;
  warrantyMonths: string;
  partsHealth: string;
  cpuHealth: string;
  motherboardHealth: string;
  displayHealth: string;
  storageHealth: string;
  ramHealth: string;
  gpuHealth: string;
  keyboardTouchpadHealth: string;
  bodyHingeHealth: string;
  batteryHealthPercent: string;
  appearanceGrade: string;
  repairHistory: string;
  usageLevel: string;
  accessoriesStatus: string;
  chargerStatus: string;
  originalPackaging: string;
  purchaseInvoiceAvailable: string;
  testDeadlineDays: string;
  returnPolicy: string;
  notes: string;
};

export type JsonOffer = {
  id: number;
  requestId: number;
  sellerId: number;
  sellerName: string;
  amount: string;
  deliveryDays: number;
  message: string;
  productSpecs?: OfferProductSpecs;
  productImages?: ProductImageAttachment[];
  status: "pending" | "accepted" | "rejected";
  createdAt: string;
};

export type JsonSellerRequestAction = {
  sellerId: number;
  requestId: number;
  action: "rejected" | "offered";
  createdAt: string;
};

export type JsonOrder = {
  id: string;
  requestId: number;
  offerId: number;
  buyerId: number;
  sellerId: number;
  buyerName: string;
  sellerName: string;
  title: string;
  description: string;
  category: string;
  quantity: number;
  requestImages?: ProductImageAttachment[];
  productImages?: ProductImageAttachment[];
  totalAmount: string;
  platformFee: string;
  sellerAmount: string;
  status: OrderStatus;
  paymentMethod?: PaymentMethod;
  shippingAddress: string;
  useAlternateAddress: boolean;
  productSpecs?: OfferProductSpecs;
  productSpecsConfirmedAt?: string;
  trackingCode?: string;
  paymentAt?: string;
  gatewayAuthority?: string;
  gatewayRefId?: string;
  shippedAt?: string;
  deliveredAt?: string;
  cancelledAt?: string;
  buyerArchived: boolean;
  sellerArchived: boolean;
  createdAt: string;
};

export type JsonWalletTransaction = {
  id: string;
  userId: number;
  type:
    | "topup"
    | "escrow_hold"
    | "escrow_release"
    | "gateway_payment"
    | "refund"
    | "withdrawal_hold"
    | "withdrawal_completed"
    | "withdrawal_refund";
  amount: number;
  balanceAfter: number;
  description: string;
  orderId?: string;
  withdrawalId?: string;
  createdAt: string;
};

export type JsonEscrowTransaction = {
  id: string;
  orderId: string;
  buyerId: number;
  sellerId: number;
  amount: number;
  platformFee: number;
  sellerAmount: number;
  status: "held" | "released" | "refunded";
  createdAt: string;
  releasedAt?: string;
};

export type JsonPlatformTransaction = {
  id: string;
  type: "commission_credit" | "admin_withdrawal" | "manual_adjustment";
  amount: number;
  balanceAfter: number;
  description: string;
  orderId?: string;
  createdAt: string;
};

export type JsonZarinpalPayment = {
  id: string;
  orderId: string;
  buyerId: number;
  amount: number;
  authority: string;
  callbackUrl: string;
  mode: "sandbox" | "production";
  status: "pending" | "verified" | "failed" | "cancelled";
  refId?: string;
  cardPan?: string;
  fee?: number;
  code?: number;
  message?: string;
  createdAt: string;
  updatedAt: string;
};

export type ZarinpalAdminSettings = {
  zarinpalEnabled: boolean;
  zarinpalSandbox: boolean;
  zarinpalMerchantId: string;
  zarinpalCallbackBaseUrl: string;
  zarinpalDescription: string;
};

export type ZarinpalPrerequisites = ZarinpalAdminSettings & {
  hasMerchantId: boolean;
  callbackUrl: string;
  requestEndpoint: string;
  verifyEndpoint: string;
  startPayBaseUrl: string;
  ready: boolean;
  missingItems: string[];
};

export type PaymentMethod = "wallet" | "gateway" | "zarinpal";

export type JsonMessage = {
  id: number;
  senderId: number;
  receiverId: number;
  orderId?: string;
  content: string;
  createdAt: string;
  readAt?: string;
};

export type JsonNotification = {
  id: number;
  userId: number;
  type:
    | "offer"
    | "order"
    | "payment"
    | "shipment"
    | "delivery"
    | "wallet"
    | "message";
  title: string;
  body: string;
  createdAt: string;
  readAt?: string;
  href?: string;
};

export type JsonReview = {
  id: number;
  orderId: string;
  reviewerId: number;
  revieweeId: number;
  reviewerRole: "buyer" | "seller";
  overall: number;
  scores: Record<string, number>;
  comment: string;
  createdAt: string;
};

export type JsonPasswordReset = {
  id: string;
  userId: number;
  tokenHash: string;
  createdAt: string;
  expiresAt: string;
  usedAt?: string;
};

export type OptiBidJsonData = {
  requests: JsonRequest[];
  users: JsonUser[];
  offers: JsonOffer[];
  sellerRequestActions: JsonSellerRequestAction[];
  orders: JsonOrder[];
  walletTransactions: JsonWalletTransaction[];
  withdrawals: JsonWithdrawalRequest[];
  transactions: JsonEscrowTransaction[];
  platformTransactions: JsonPlatformTransaction[];
  zarinpalPayments: JsonZarinpalPayment[];
  messages: JsonMessage[];
  notifications: JsonNotification[];
  reviews: JsonReview[];
  passwordResets: JsonPasswordReset[];
  settings: {
    commissionRate: number;
    platformWalletBalance: number;
    adminAccountHolder: string;
    adminBankName: string;
    adminSheba: string;
    adminCardNumber: string;
    zarinpalEnabled: boolean;
    zarinpalSandbox: boolean;
    zarinpalMerchantId: string;
    zarinpalCallbackBaseUrl: string;
    zarinpalDescription: string;
  };
};

const emptyData = (): OptiBidJsonData => ({
  requests: [],
  users: [],
  offers: [],
  sellerRequestActions: [],
  orders: [],
  walletTransactions: [],
  withdrawals: [],
  transactions: [],
  platformTransactions: [],
  zarinpalPayments: [],
  messages: [],
  notifications: [],
  reviews: [],
  passwordResets: [],
  settings: {
    commissionRate: 5,
    platformWalletBalance: 0,
    adminAccountHolder: "مدیر پلتفرم OptiBid",
    adminBankName: "",
    adminSheba: "",
    adminCardNumber: "",
    zarinpalEnabled: false,
    zarinpalSandbox: true,
    zarinpalMerchantId: "",
    zarinpalCallbackBaseUrl: "https://optibid.fazilat-ma.workers.dev",
    zarinpalDescription: "پرداخت امانی سفارش OptiBid",
  },
});

// On PaaS /tmp is writable. Set OPTIBID_DATA_FILE to a persistent Volume path in production.
const dataFile =
  process.env.OPTIBID_DATA_FILE ||
  path.join(process.env.TMPDIR || "/tmp", "optibid-data.json");

const encryptionSecret =
  process.env.OPTIBID_BANK_ENCRYPTION_KEY ||
  "optibid-development-key-change-this-in-production";
const encryptionKey = createHash("sha256").update(encryptionSecret).digest();

function encryptBankValue(value?: string) {
  if (!value || value.startsWith("enc:")) return value || "";
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey, iv);
  const encrypted = Buffer.concat([
    cipher.update(value, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return `enc:${iv.toString("base64")}:${tag.toString("base64")}:${encrypted.toString("base64")}`;
}

function decryptBankValue(value?: string) {
  if (!value || !value.startsWith("enc:")) return value || "";
  try {
    const [, ivValue, tagValue, encryptedValue] = value.split(":");
    const decipher = createDecipheriv(
      "aes-256-gcm",
      encryptionKey,
      Buffer.from(ivValue, "base64"),
    );
    decipher.setAuthTag(Buffer.from(tagValue, "base64"));
    return Buffer.concat([
      decipher.update(Buffer.from(encryptedValue, "base64")),
      decipher.final(),
    ]).toString("utf8");
  } catch {
    return "";
  }
}

function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `scrypt:${salt}:${hash}`;
}

function verifyPassword(password: string, storedPassword?: string) {
  if (!storedPassword) return false;

  if (!storedPassword.startsWith("scrypt:")) {
    // سازگاری موقت با حساب‌های قدیمی که قبل از این تغییر ثبت شده‌اند.
    return storedPassword === password;
  }

  try {
    const [, salt, expectedHash] = storedPassword.split(":");
    const actualHash = scryptSync(password, salt, 64);
    const expected = Buffer.from(expectedHash, "hex");
    return (
      expected.length === actualHash.length &&
      timingSafeEqual(expected, actualHash)
    );
  } catch {
    return false;
  }
}

function nextNumericId(items: { id: number }[]) {
  return items.reduce((max, item) => Math.max(max, item.id), 0) + 1;
}

function nextStringId(prefix: string) {
  return `${prefix}-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random() * 900 + 100)}`;
}

function money(value: string | number) {
  return Math.max(0, Number(String(value).replace(/\D/g, "")) || 0);
}

function isSuccessfulOrder(order: JsonOrder) {
  return order.status === "completed";
}

function isFailedOrder(
  order: JsonOrder,
  transactions: JsonEscrowTransaction[] = [],
) {
  if (["cancelled", "returned"].includes(order.status)) return true;
  return transactions.some(
    (transaction) =>
      transaction.orderId === order.id && transaction.status === "refunded",
  );
}

function isPublicRequest(request: JsonRequest) {
  return request.status === "open";
}

function migrateData(parsed: Partial<OptiBidJsonData>): OptiBidJsonData {
  const users = (Array.isArray(parsed.users) ? parsed.users : []).map(
    (user) => ({
      ...user,
      username: user.username || "",
      kycStatus: user.kycStatus || "approved",
      kycDocuments: Array.isArray(user.kycDocuments) ? user.kycDocuments : [],
      socialAccounts: Array.isArray(
        (user as { socialAccounts?: unknown }).socialAccounts,
      )
        ? (
            (user as { socialAccounts?: JsonSocialAccount[] }).socialAccounts ||
            []
          ).filter(
            (account) =>
              account.provider === "google" || account.provider === "facebook",
          )
        : [],
      kycRejectReason: user.kycRejectReason || "",
      walletBalance: Number(user.walletBalance || 0),
      city: user.city || "",
      postalCode: user.postalCode || "",
      defaultAddress: user.defaultAddress || "",
      bankAccountHolder: decryptBankValue(user.bankAccountHolder),
      bankName: decryptBankValue(user.bankName),
      bankAccountNumber: decryptBankValue(user.bankAccountNumber),
      bankCardNumber: decryptBankValue(user.bankCardNumber),
      bankShebaNumber: decryptBankValue(user.bankShebaNumber),
      bankDetailsVerified: Boolean(user.bankDetailsVerified),
    }),
  ) as JsonUser[];

  return {
    requests: Array.isArray(parsed.requests)
      ? (parsed.requests.map((request) => {
          const productImages = normalizeProductImageAttachments(
            (request as { productImages?: unknown }).productImages,
          );
          return {
            ...request,
            imageNames: Array.isArray(request.imageNames)
              ? request.imageNames
              : productImages.map((image) => image.originalName),
            productImages,
            valuationFactors: request.valuationFactors
              ? normalizeProductValuationFactors(request.valuationFactors)
              : undefined,
            aiPriceEstimate: request.aiPriceEstimate,
          };
        }) as JsonRequest[])
      : [],
    users,
    offers: Array.isArray(parsed.offers)
      ? (parsed.offers.map((offer) => ({
          ...offer,
          productImages: normalizeProductImageAttachments(
            (offer as { productImages?: unknown }).productImages,
          ),
        })) as JsonOffer[])
      : [],
    sellerRequestActions: Array.isArray(parsed.sellerRequestActions)
      ? parsed.sellerRequestActions
      : [],
    orders: Array.isArray(parsed.orders)
      ? (parsed.orders.map((order) => ({
          ...order,
          offerId: Number(order.offerId || 0),
          buyerName: order.buyerName || "خریدار",
          sellerName: order.sellerName || "فروشنده",
          title: order.title || "سفارش OptiBid",
          description: order.description || "",
          category: order.category || "سایر",
          quantity: Number(order.quantity || 1),
          shippingAddress: order.shippingAddress || "",
          useAlternateAddress: Boolean(order.useAlternateAddress),
          requestImages: normalizeProductImageAttachments(
            (order as { requestImages?: unknown }).requestImages,
          ),
          productImages: normalizeProductImageAttachments(
            (order as { productImages?: unknown }).productImages,
          ),
          productSpecs: order.productSpecs,
          productSpecsConfirmedAt: order.productSpecsConfirmedAt || "",
          buyerArchived: Boolean(order.buyerArchived),
          sellerArchived: Boolean(order.sellerArchived),
        })) as JsonOrder[])
      : [],
    walletTransactions: Array.isArray(parsed.walletTransactions)
      ? parsed.walletTransactions
      : [],
    withdrawals: Array.isArray(parsed.withdrawals)
      ? parsed.withdrawals.map((withdrawal) => ({
          ...withdrawal,
          bankAccountHolder: decryptBankValue(withdrawal.bankAccountHolder),
          bankName: decryptBankValue(withdrawal.bankName),
          bankAccountNumber: decryptBankValue(withdrawal.bankAccountNumber),
          bankCardNumber: decryptBankValue(withdrawal.bankCardNumber),
          bankShebaNumber: decryptBankValue(withdrawal.bankShebaNumber),
        }))
      : [],
    transactions: Array.isArray(parsed.transactions) ? parsed.transactions : [],
    platformTransactions: Array.isArray(parsed.platformTransactions)
      ? parsed.platformTransactions
      : [],
    zarinpalPayments: Array.isArray(
      (parsed as { zarinpalPayments?: unknown }).zarinpalPayments,
    )
      ? (parsed as { zarinpalPayments?: JsonZarinpalPayment[] })
          .zarinpalPayments || []
      : [],
    messages: Array.isArray(parsed.messages) ? parsed.messages : [],
    notifications: Array.isArray(parsed.notifications)
      ? parsed.notifications
      : [],
    reviews: Array.isArray(parsed.reviews) ? parsed.reviews : [],
    passwordResets: Array.isArray(parsed.passwordResets)
      ? parsed.passwordResets
      : [],
    settings: {
      commissionRate:
        typeof parsed.settings?.commissionRate === "number"
          ? parsed.settings.commissionRate
          : 5,
      platformWalletBalance: Number(
        parsed.settings?.platformWalletBalance || 0,
      ),
      adminAccountHolder:
        decryptBankValue(parsed.settings?.adminAccountHolder) ||
        "مدیر پلتفرم OptiBid",
      adminBankName: decryptBankValue(parsed.settings?.adminBankName),
      adminSheba: decryptBankValue(parsed.settings?.adminSheba),
      adminCardNumber: decryptBankValue(parsed.settings?.adminCardNumber),
      zarinpalEnabled: Boolean(
        (parsed.settings as Partial<ZarinpalAdminSettings> | undefined)
          ?.zarinpalEnabled,
      ),
      zarinpalSandbox:
        typeof (parsed.settings as Partial<ZarinpalAdminSettings> | undefined)
          ?.zarinpalSandbox === "boolean"
          ? Boolean(
              (parsed.settings as Partial<ZarinpalAdminSettings> | undefined)
                ?.zarinpalSandbox,
            )
          : true,
      zarinpalMerchantId:
        process.env.ZARINPAL_MERCHANT_ID ||
        decryptBankValue(
          (parsed.settings as Partial<ZarinpalAdminSettings> | undefined)
            ?.zarinpalMerchantId,
        ),
      zarinpalCallbackBaseUrl:
        (parsed.settings as Partial<ZarinpalAdminSettings> | undefined)
          ?.zarinpalCallbackBaseUrl ||
        process.env.NEXT_PUBLIC_SITE_URL ||
        "https://optibid.fazilat-ma.workers.dev",
      zarinpalDescription:
        (parsed.settings as Partial<ZarinpalAdminSettings> | undefined)
          ?.zarinpalDescription || "پرداخت امانی سفارش OptiBid",
    },
  };
}

async function ensureDataFile() {
  // در محیط Cloudflare Workers داده در KV نگهداری می‌شود و فایلی وجود ندارد.
  if (await getKvNamespace()) return;
  try {
    await fs.access(dataFile);
  } catch {
    await fs.mkdir(path.dirname(dataFile), { recursive: true });
    await writeOptiBidData(emptyData());
  }
}

export async function getOptiBidData(): Promise<OptiBidJsonData> {
  // حالت Cloudflare Workers: خواندن از KV
  if (await getKvNamespace()) {
    try {
      const { kvGetText } = await import("@/lib/kv-storage");
      const content = await kvGetText(KV_DATA_KEY);
      if (!content) return emptyData();
      return migrateData(JSON.parse(content) as Partial<OptiBidJsonData>);
    } catch (error) {
      console.error("[optibid] خطا در خواندن داده از KV:", error);
      return emptyData();
    }
  }

  // حالت Node: خواندن از فایل JSON روی دیسک
  await ensureDataFile();
  try {
    const content = await fs.readFile(dataFile, "utf8");
    return migrateData(JSON.parse(content) as Partial<OptiBidJsonData>);
  } catch {
    return emptyData();
  }
}

export async function writeOptiBidData(data: OptiBidJsonData) {
  const encryptedData: OptiBidJsonData = {
    ...data,
    users: data.users.map((user) => ({
      ...user,
      bankAccountHolder: encryptBankValue(user.bankAccountHolder),
      bankName: encryptBankValue(user.bankName),
      bankAccountNumber: encryptBankValue(user.bankAccountNumber),
      bankCardNumber: encryptBankValue(user.bankCardNumber),
      bankShebaNumber: encryptBankValue(user.bankShebaNumber),
    })),
    withdrawals: data.withdrawals.map((withdrawal) => ({
      ...withdrawal,
      bankAccountHolder: encryptBankValue(withdrawal.bankAccountHolder),
      bankName: encryptBankValue(withdrawal.bankName),
      bankAccountNumber: encryptBankValue(withdrawal.bankAccountNumber),
      bankCardNumber: encryptBankValue(withdrawal.bankCardNumber),
      bankShebaNumber: encryptBankValue(withdrawal.bankShebaNumber),
    })),
    settings: {
      ...data.settings,
      adminAccountHolder: encryptBankValue(data.settings.adminAccountHolder),
      adminBankName: encryptBankValue(data.settings.adminBankName),
      adminSheba: encryptBankValue(data.settings.adminSheba),
      adminCardNumber: encryptBankValue(data.settings.adminCardNumber),
      zarinpalMerchantId: encryptBankValue(data.settings.zarinpalMerchantId),
    },
  };

  // حالت Cloudflare Workers: نوشتن در KV (فایل‌سیستم پایدار وجود ندارد)
  if (await getKvNamespace()) {
    await kvPutText(KV_DATA_KEY, JSON.stringify(encryptedData));
    return;
  }

  // حالت Node: نوشتن اتمیک روی دیسک (فایل موقت + rename)
  await fs.mkdir(path.dirname(dataFile), { recursive: true });
  const temporaryFile = `${dataFile}.tmp`;
  await fs.writeFile(
    temporaryFile,
    JSON.stringify(encryptedData, null, 2),
    "utf8",
  );
  await fs.rename(temporaryFile, dataFile);
}

function addNotification(
  data: OptiBidJsonData,
  input: Omit<JsonNotification, "id" | "createdAt">,
) {
  data.notifications.unshift({
    id: nextNumericId(data.notifications),
    createdAt: new Date().toISOString(),
    ...input,
  });
}

function addWalletTransaction(
  data: OptiBidJsonData,
  input: Omit<JsonWalletTransaction, "id" | "createdAt">,
) {
  data.walletTransactions.unshift({
    id: nextStringId("WLT"),
    createdAt: new Date().toISOString(),
    ...input,
  });
}

function addMessage(
  data: OptiBidJsonData,
  input: Omit<JsonMessage, "id" | "createdAt">,
) {
  data.messages.unshift({
    id: nextNumericId(data.messages),
    createdAt: new Date().toISOString(),
    ...input,
  });
}

function addPlatformTransaction(
  data: OptiBidJsonData,
  input: Omit<JsonPlatformTransaction, "id" | "createdAt" | "balanceAfter">,
) {
  data.settings.platformWalletBalance += input.amount;
  data.platformTransactions.unshift({
    id: nextStringId("PLT"),
    createdAt: new Date().toISOString(),
    balanceAfter: data.settings.platformWalletBalance,
    ...input,
  });
}

function getUserOrThrow(data: OptiBidJsonData, id: number, role?: UserRole) {
  const user = data.users.find(
    (item) => item.id === id && (!role || item.role === role),
  );
  if (!user) throw new Error("User not found");
  return user;
}

export async function createJsonUser(input: {
  fullName: string;
  username: string;
  email: string;
  password?: string;
  role: "buyer" | "seller";
  avatarName?: string;
  bio?: string;
  categories?: string[];
  city?: string;
  postalCode?: string;
  defaultAddress?: string;
  bankAccountHolder?: string;
  bankName?: string;
  bankAccountNumber?: string;
  bankCardNumber?: string;
  bankShebaNumber?: string;
  kycDocuments: JsonKycDocument[];
}) {
  const data = await getOptiBidData();
  const normalizedEmail = input.email.trim().toLowerCase();
  const normalizedUsername = input.username.trim().toLowerCase();
  const existingEmail = data.users.find(
    (user) => user.email.toLowerCase() === normalizedEmail,
  );
  if (existingEmail) throw new Error("Email already registered");
  const existingUsername = data.users.find(
    (user) => (user.username || "").toLowerCase() === normalizedUsername,
  );
  if (existingUsername) throw new Error("Username already registered");

  const user: JsonUser = {
    id: nextNumericId(data.users),
    fullName: input.fullName.trim(),
    username: normalizedUsername,
    email: normalizedEmail,
    password: input.password ? hashPassword(input.password) : undefined,
    role: input.role,
    isActive: false,
    kycStatus: "pending",
    kycDocuments: input.kycDocuments,
    kycRejectReason: "",
    avatarName: input.avatarName,
    bio: input.bio || "",
    categories: input.categories || [],
    city: input.city || "",
    postalCode: input.postalCode || "",
    defaultAddress: input.defaultAddress || "",
    bankAccountHolder: input.bankAccountHolder || input.fullName.trim(),
    bankName: input.bankName || "",
    bankAccountNumber: input.bankAccountNumber || "",
    bankCardNumber: input.bankCardNumber || "",
    bankShebaNumber: input.bankShebaNumber || "",
    bankDetailsVerified: false,
    walletBalance: 0,
    sellerMetrics:
      input.role === "seller" ? createDefaultSellerMetrics() : undefined,
    createdAt: new Date().toISOString(),
  };
  data.users.push(user);
  await writeOptiBidData(data);
  return { user, created: true };
}

export async function authenticateJsonUser(input: {
  identifier: string;
  password: string;
}) {
  const data = await getOptiBidData();
  const identifier = input.identifier.trim().toLowerCase();
  const user = data.users.find(
    (item) =>
      item.email.toLowerCase() === identifier ||
      (item.username || "").toLowerCase() === identifier,
  );
  if (!user || !verifyPassword(input.password, user.password)) return null;
  if (user.kycStatus === "rejected") {
    throw new Error(
      `KYC_REJECTED:${user.kycRejectReason || "مدارک نیازمند اصلاح است"}`,
    );
  }
  if (user.kycStatus === "pending" || !user.isActive) {
    throw new Error("KYC_PENDING");
  }

  // پس از اولین ورود موفق، رمزهای قدیمی متن‌خام به Hash ایمن تبدیل می‌شوند.
  if (user.password && !user.password.startsWith("scrypt:")) {
    user.password = hashPassword(input.password);
    await writeOptiBidData(data);
  }
  return user;
}

function normalizeUsernameSeed(value: string) {
  const normalized = value
    .trim()
    .toLowerCase()
    .replace(/@.*$/, "")
    .replace(/[^a-z0-9._-]/g, "")
    .replace(/^[._-]+|[._-]+$/g, "");
  return normalized.length >= 3
    ? normalized.slice(0, 24)
    : `user${Date.now().toString(36)}`;
}

function uniqueUsername(users: JsonUser[], seed: string) {
  const base = normalizeUsernameSeed(seed);
  const existing = new Set(
    users.map((user) => (user.username || "").toLowerCase()).filter(Boolean),
  );
  if (!existing.has(base)) return base;
  for (let index = 2; index < 1000; index += 1) {
    const candidate = `${base}${index}`.slice(0, 30);
    if (!existing.has(candidate)) return candidate;
  }
  return `${base.slice(0, 20)}${Math.floor(Math.random() * 900000 + 100000)}`;
}

export async function authenticateOrCreateJsonSocialUser(input: {
  provider: SocialAuthProvider;
  providerUserId: string;
  email: string;
  fullName: string;
  role?: "buyer" | "seller";
}) {
  const data = await getOptiBidData();
  const normalizedEmail = (
    input.email ||
    `${input.provider}-${input.providerUserId}@social.optibid.local`
  )
    .trim()
    .toLowerCase();
  const providerUserId = input.providerUserId.trim();
  if (!providerUserId) throw new Error("Social provider id is required");

  let user = data.users.find((item) =>
    (item.socialAccounts || []).some(
      (account) =>
        account.provider === input.provider &&
        account.providerUserId === providerUserId,
    ),
  );
  if (!user)
    user = data.users.find(
      (item) => item.email.toLowerCase() === normalizedEmail,
    );

  if (user) {
    user.socialAccounts = user.socialAccounts || [];
    if (
      !user.socialAccounts.some(
        (account) =>
          account.provider === input.provider &&
          account.providerUserId === providerUserId,
      )
    ) {
      user.socialAccounts.push({
        provider: input.provider,
        providerUserId,
        email: normalizedEmail,
        linkedAt: new Date().toISOString(),
      });
    }
    if (!user.fullName.trim() && input.fullName.trim())
      user.fullName = input.fullName.trim();
    if (user.kycStatus === "rejected")
      throw new Error(
        `KYC_REJECTED:${user.kycRejectReason || "مدارک نیازمند اصلاح است"}`,
      );
    if (user.kycStatus === "pending" || !user.isActive)
      throw new Error("KYC_PENDING");
    await writeOptiBidData(data);
    return user;
  }

  const role = input.role === "seller" ? "seller" : "buyer";
  const createdAt = new Date().toISOString();
  const socialUser: JsonUser = {
    id: nextNumericId(data.users),
    fullName:
      input.fullName.trim() ||
      (role === "seller" ? "فروشنده OptiBid" : "خریدار OptiBid"),
    username: uniqueUsername(data.users, normalizedEmail),
    email: normalizedEmail,
    role,
    isActive: true,
    kycStatus: "approved",
    kycDocuments: [],
    kycRejectReason: "",
    socialAccounts: [
      {
        provider: input.provider,
        providerUserId,
        email: normalizedEmail,
        linkedAt: createdAt,
      },
    ],
    bio:
      input.provider === "google" ? "ورود با حساب گوگل" : "ورود با حساب فیسبوک",
    categories: [],
    city: "",
    postalCode: "",
    defaultAddress: "",
    bankAccountHolder: input.fullName.trim() || "",
    bankName: "",
    bankAccountNumber: "",
    bankCardNumber: "",
    bankShebaNumber: "",
    bankDetailsVerified: false,
    walletBalance: 0,
    sellerMetrics: role === "seller" ? createDefaultSellerMetrics() : undefined,
    createdAt,
  };
  data.users.push(socialUser);
  await writeOptiBidData(data);
  return socialUser;
}

export async function createJsonPurchaseRequest(input: {
  title: string;
  description: string;
  category: string;
  budget: string;
  quantity?: string;
  deadline?: string;
  imageNames?: string[];
  productImages?: ProductImageAttachment[];
  buyerName?: string;
  buyerId?: number;
  valuationFactors?: Partial<ProductValuationFactors>;
}) {
  const data = await getOptiBidData();
  let buyer: JsonUser | undefined;

  if (input.buyerId)
    buyer = data.users.find(
      (user) => user.id === input.buyerId && user.role === "buyer",
    );
  if (!buyer) {
    const buyerEmail = "buyer@optibid.local";
    buyer = data.users.find((user) => user.email === buyerEmail);
    if (!buyer) {
      buyer = {
        id: nextNumericId(data.users),
        fullName: input.buyerName || "خریدار OptiBid",
        email: buyerEmail,
        role: "buyer",
        isActive: true,
        walletBalance: 0,
        defaultAddress: "",
        createdAt: new Date().toISOString(),
      };
      data.users.push(buyer);
    }
  }

  const valuationFactors = normalizeProductValuationFactors(
    input.valuationFactors,
  );
  const aiPriceEstimate = estimateFairUsedProductPrice({
    title: input.title,
    category: input.category,
    budget: input.budget,
    quantity: input.quantity || "1",
    factors: valuationFactors,
  });
  const productImages = normalizeProductImageAttachments(input.productImages);

  const purchaseRequest: JsonRequest = {
    id: nextNumericId(data.requests),
    buyerId: buyer.id,
    buyerName: buyer.fullName,
    title: input.title.trim(),
    description: input.description.trim(),
    category: input.category.trim(),
    budget: String(money(input.budget)),
    quantity: Math.max(1, Number.parseInt(input.quantity || "1", 10) || 1),
    deadline: input.deadline || "flexible",
    imageNames: input.imageNames?.length
      ? input.imageNames
      : productImages.map((image) => image.originalName),
    productImages,
    valuationFactors,
    aiPriceEstimate,
    status: "open",
    offersCount: 0,
    createdAt: new Date().toISOString(),
  };

  data.requests.unshift(purchaseRequest);
  await writeOptiBidData(data);
  return purchaseRequest;
}

export async function updateJsonBuyerProfile(
  buyerId: number,
  updates: {
    fullName?: string;
    bio?: string;
    defaultAddress?: string;
    categories?: string[];
    avatarName?: string;
  },
) {
  const data = await getOptiBidData();
  const buyer = getUserOrThrow(data, buyerId, "buyer");
  if (updates.fullName?.trim()) buyer.fullName = updates.fullName.trim();
  if (typeof updates.bio === "string") buyer.bio = updates.bio.trim();
  if (typeof updates.defaultAddress === "string")
    buyer.defaultAddress = updates.defaultAddress.trim();
  if (typeof updates.avatarName === "string" && updates.avatarName.trim())
    buyer.avatarName = updates.avatarName.trim();
  if (Array.isArray(updates.categories))
    buyer.categories = [
      ...new Set(updates.categories.map((x) => x.trim()).filter(Boolean)),
    ];
  await writeOptiBidData(data);
  return buyer;
}

export async function getJsonKycUsers() {
  const data = await getOptiBidData();
  return data.users
    .filter((user) => user.role !== "admin" && user.kycStatus !== "approved")
    .map((user) => {
      const {
        password: _password,
        bankAccountNumber: _account,
        bankCardNumber: _card,
        bankShebaNumber: _sheba,
        ...safeUser
      } = user;
      return safeUser;
    })
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
}

export async function updateJsonKycStatus(input: {
  userId: number;
  status: "approved" | "rejected";
  reason?: string;
}) {
  const data = await getOptiBidData();
  const user = data.users.find(
    (item) => item.id === input.userId && item.role !== "admin",
  );
  if (!user) throw new Error("KYC user not found");
  if (input.status === "rejected" && !input.reason?.trim()) {
    throw new Error("Rejection reason is required");
  }

  user.kycStatus = input.status;
  user.isActive = input.status === "approved";
  user.kycRejectReason =
    input.status === "rejected" ? input.reason!.trim() : "";
  user.kycReviewedAt = new Date().toISOString();
  user.bankDetailsVerified = input.status === "approved";
  if (user.role === "seller") {
    const metrics = user.sellerMetrics || createDefaultSellerMetrics();
    user.sellerMetrics = {
      ...metrics,
      identityVerified: input.status === "approved",
      bankAccountVerified: input.status === "approved",
      profileCompletenessPercent: Math.max(
        metrics.profileCompletenessPercent,
        80,
      ),
    };
  }

  addNotification(data, {
    userId: user.id,
    type: "order",
    title:
      input.status === "approved"
        ? "احراز هویت شما تایید شد"
        : "مدارک احراز هویت نیازمند اصلاح است",
    body:
      input.status === "approved"
        ? "حساب و نام کاربری شما فعال شد و اکنون می‌توانید وارد OptiBid شوید."
        : `علت رد مدارک: ${user.kycRejectReason}`,
    href: "/login",
  });
  await writeOptiBidData(data);
  return user;
}

export async function updateJsonSellerProfile(
  sellerId: number,
  updates: {
    fullName?: string;
    bio?: string;
    categories?: string[];
    avatarName?: string;
  },
) {
  const data = await getOptiBidData();
  const seller = getUserOrThrow(data, sellerId, "seller");
  if (updates.fullName?.trim()) seller.fullName = updates.fullName.trim();
  if (typeof updates.bio === "string") seller.bio = updates.bio.trim();
  if (typeof updates.avatarName === "string" && updates.avatarName.trim())
    seller.avatarName = updates.avatarName.trim();
  if (Array.isArray(updates.categories))
    seller.categories = [
      ...new Set(updates.categories.map((x) => x.trim()).filter(Boolean)),
    ];
  const metrics = seller.sellerMetrics || createDefaultSellerMetrics();
  seller.sellerMetrics = {
    ...metrics,
    profileCompletenessPercent: Math.max(
      metrics.profileCompletenessPercent,
      seller.bio && seller.categories?.length ? 75 : 40,
    ),
  };
  await writeOptiBidData(data);
  return seller;
}

export async function updateJsonSellerMetrics(
  sellerId: number,
  updates: Partial<SellerPerformanceMetrics>,
) {
  const data = await getOptiBidData();
  const seller = getUserOrThrow(data, sellerId, "seller");
  seller.sellerMetrics = {
    ...(seller.sellerMetrics || createDefaultSellerMetrics()),
    ...updates,
  };
  await writeOptiBidData(data);
  return seller;
}

export async function getJsonSellerRankings() {
  const data = await getOptiBidData();
  return data.users
    .filter((user) => user.role === "seller" && user.isActive)
    .map((seller) => {
      const {
        password: _password,
        bankAccountHolder: _bankAccountHolder,
        bankName: _bankName,
        bankAccountNumber: _bankAccountNumber,
        bankCardNumber: _bankCardNumber,
        bankShebaNumber: _bankShebaNumber,
        ...publicSeller
      } = seller;
      return {
        seller: publicSeller,
        rating: calculateSellerScore(
          seller.sellerMetrics || createDefaultSellerMetrics(),
        ),
      };
    })
    .sort(
      (a, b) =>
        Number(b.rating.rankingEligible) - Number(a.rating.rankingEligible) ||
        b.rating.finalScore - a.rating.finalScore,
    );
}

export async function getJsonMatchingRequestsForSeller(
  sellerId: number,
  limit = 5,
) {
  const data = await getOptiBidData();
  const seller = getUserOrThrow(data, sellerId, "seller");
  const categories = new Set(seller.categories || []);
  if (categories.size === 0) return [];
  const excluded = new Set(
    data.sellerRequestActions
      .filter((item) => item.sellerId === sellerId)
      .map((item) => item.requestId),
  );
  return data.requests
    .filter(
      (item) =>
        item.status === "open" &&
        categories.has(item.category) &&
        !excluded.has(item.id),
    )
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
    .slice(0, Math.max(1, Math.min(5, limit)));
}

export async function rejectJsonSellerRequest(
  sellerId: number,
  requestId: number,
) {
  const data = await getOptiBidData();
  if (
    !data.sellerRequestActions.some(
      (item) => item.sellerId === sellerId && item.requestId === requestId,
    )
  ) {
    data.sellerRequestActions.push({
      sellerId,
      requestId,
      action: "rejected",
      createdAt: new Date().toISOString(),
    });
    await writeOptiBidData(data);
  }
}

const offerSpecLabels: Record<keyof OfferProductSpecs, string> = {
  brand: "برند",
  exactModel: "مدل دقیق",
  serialOrConfig: "کد مدل/کانفیگ",
  cpu: "پردازنده",
  ram: "رم",
  storage: "حافظه ذخیره‌سازی",
  gpu: "کارت گرافیک",
  display: "نمایشگر",
  manufactureYear: "سال ساخت",
  productCondition: "وضعیت کالا",
  warrantyStatus: "وضعیت گارانتی",
  warrantyMonths: "مدت گارانتی",
  partsHealth: "سلامت کلی قطعات",
  cpuHealth: "سلامت CPU",
  motherboardHealth: "سلامت مادربرد",
  displayHealth: "سلامت نمایشگر",
  storageHealth: "سلامت SSD/HDD",
  ramHealth: "سلامت RAM",
  gpuHealth: "سلامت GPU",
  keyboardTouchpadHealth: "سلامت کیبورد/تاچ‌پد",
  bodyHingeHealth: "سلامت بدنه/لولا",
  batteryHealthPercent: "سلامت باتری",
  appearanceGrade: "گرید ظاهری",
  repairHistory: "سابقه تعمیر",
  usageLevel: "میزان کارکرد",
  accessoriesStatus: "لوازم جانبی",
  chargerStatus: "شارژر/آداپتور",
  originalPackaging: "جعبه اصلی",
  purchaseInvoiceAvailable: "فاکتور/اصالت",
  testDeadlineDays: "مهلت تست",
  returnPolicy: "شرایط مرجوعی",
  notes: "توضیحات تکمیلی",
};

function normalizeOfferProductSpecs(
  input: Partial<OfferProductSpecs> | undefined | null,
): OfferProductSpecs {
  const source = input || {};
  const text = (key: keyof OfferProductSpecs, max = 120) =>
    String(source[key] || "")
      .trim()
      .slice(0, max);
  return {
    brand: text("brand"),
    exactModel: text("exactModel"),
    serialOrConfig: text("serialOrConfig"),
    cpu: text("cpu"),
    ram: text("ram"),
    storage: text("storage"),
    gpu: text("gpu"),
    display: text("display"),
    manufactureYear: text("manufactureYear", 4).replace(/\D/g, "").slice(0, 4),
    productCondition: text("productCondition"),
    warrantyStatus: text("warrantyStatus"),
    warrantyMonths: text("warrantyMonths", 3).replace(/\D/g, "").slice(0, 3),
    partsHealth: text("partsHealth"),
    cpuHealth: text("cpuHealth"),
    motherboardHealth: text("motherboardHealth"),
    displayHealth: text("displayHealth"),
    storageHealth: text("storageHealth"),
    ramHealth: text("ramHealth"),
    gpuHealth: text("gpuHealth"),
    keyboardTouchpadHealth: text("keyboardTouchpadHealth"),
    bodyHingeHealth: text("bodyHingeHealth"),
    batteryHealthPercent: text("batteryHealthPercent", 3)
      .replace(/\D/g, "")
      .slice(0, 3),
    appearanceGrade: text("appearanceGrade"),
    repairHistory: text("repairHistory"),
    usageLevel: text("usageLevel"),
    accessoriesStatus: text("accessoriesStatus"),
    chargerStatus: text("chargerStatus"),
    originalPackaging: text("originalPackaging"),
    purchaseInvoiceAvailable: text("purchaseInvoiceAvailable"),
    testDeadlineDays: text("testDeadlineDays", 3)
      .replace(/\D/g, "")
      .slice(0, 3),
    returnPolicy: text("returnPolicy"),
    notes: text("notes", 1000),
  };
}

function validateOfferProductSpecs(specs: OfferProductSpecs) {
  const required: Array<keyof OfferProductSpecs> = [
    "brand",
    "exactModel",
    "cpu",
    "ram",
    "storage",
    "manufactureYear",
    "productCondition",
    "warrantyStatus",
    "partsHealth",
    "cpuHealth",
    "motherboardHealth",
    "displayHealth",
    "storageHealth",
    "ramHealth",
    "keyboardTouchpadHealth",
    "bodyHingeHealth",
    "appearanceGrade",
    "repairHistory",
    "usageLevel",
    "accessoriesStatus",
    "chargerStatus",
    "returnPolicy",
  ];
  return required
    .filter((key) => !specs[key] || specs[key] === "unknown")
    .map((key) => offerSpecLabels[key]);
}

export function publicOfferSpecLabels() {
  return offerSpecLabels;
}

export async function createJsonSellerOffer(input: {
  sellerId: number;
  requestId: number;
  amount: string;
  deliveryDays: number;
  message?: string;
  productSpecs?: Partial<OfferProductSpecs>;
  productImages?: ProductImageAttachment[];
}) {
  const data = await getOptiBidData();
  const seller = getUserOrThrow(data, input.sellerId, "seller");
  const request = data.requests.find(
    (item) => item.id === input.requestId && item.status === "open",
  );
  if (!request) throw new Error("Open request not found");
  if (!(seller.categories || []).includes(request.category))
    throw new Error("Seller category does not match request category");
  const existingOffer = data.offers.find(
    (offer) => offer.sellerId === seller.id && offer.requestId === request.id,
  );
  const productSpecs = normalizeOfferProductSpecs(input.productSpecs);
  const missingSpecs = validateOfferProductSpecs(productSpecs);
  if (missingSpecs.length > 0) {
    throw new Error(`Product specs incomplete: ${missingSpecs.join("، ")}`);
  }
  const productImages = input.productImages
    ? normalizeProductImageAttachments(input.productImages)
    : undefined;

  if (existingOffer) {
    if (existingOffer.status !== "pending")
      throw new Error("Offer cannot be edited after selection");
    existingOffer.amount = String(money(input.amount));
    existingOffer.deliveryDays = Math.max(
      1,
      Math.floor(input.deliveryDays || 1),
    );
    existingOffer.message = input.message?.trim() || "";
    existingOffer.productSpecs = productSpecs;
    if (productImages) existingOffer.productImages = productImages;
    await writeOptiBidData(data);
    return existingOffer;
  }

  const offer: JsonOffer = {
    id: nextNumericId(data.offers),
    requestId: request.id,
    sellerId: seller.id,
    sellerName: seller.fullName,
    amount: String(money(input.amount)),
    deliveryDays: Math.max(1, Math.floor(input.deliveryDays || 1)),
    message: input.message?.trim() || "",
    productSpecs,
    productImages: productImages || [],
    status: "pending",
    createdAt: new Date().toISOString(),
  };
  data.offers.unshift(offer);
  request.offersCount += 1;
  data.sellerRequestActions.push({
    sellerId: seller.id,
    requestId: request.id,
    action: "offered",
    createdAt: new Date().toISOString(),
  });
  addNotification(data, {
    userId: request.buyerId,
    type: "offer",
    title: "پیشنهاد قیمت جدید دریافت شد",
    body: `${seller.fullName} برای درخواست «${request.title}» مبلغ ${Number(offer.amount).toLocaleString("fa-IR")} تومان پیشنهاد داد.`,
    href: "/buyer/dashboard",
  });
  await writeOptiBidData(data);
  return offer;
}

export async function selectJsonOffer(input: {
  buyerId: number;
  offerId: number;
  shippingAddress?: string;
  useAlternateAddress?: boolean;
  buyerConfirmedProductSpecs?: boolean;
}) {
  const data = await getOptiBidData();
  const buyer = getUserOrThrow(data, input.buyerId, "buyer");
  const offer = data.offers.find(
    (item) => item.id === input.offerId && item.status === "pending",
  );
  if (!offer) throw new Error("Pending offer not found");
  if (!offer.productSpecs)
    throw new Error("Product specs are required before selection");
  if (!input.buyerConfirmedProductSpecs)
    throw new Error("Product specs confirmation required");
  const request = data.requests.find(
    (item) =>
      item.id === offer.requestId &&
      item.status === "open" &&
      item.buyerId === buyer.id,
  );
  if (!request) throw new Error("Request not available for buyer");
  const seller = getUserOrThrow(data, offer.sellerId, "seller");

  const amount = money(offer.amount);
  const fee = Math.round(amount * (data.settings.commissionRate / 100));
  const address = input.useAlternateAddress
    ? (input.shippingAddress || "").trim()
    : buyer.defaultAddress || "";
  if (!address) throw new Error("Shipping address is required");

  offer.status = "accepted";
  for (const other of data.offers.filter(
    (item) => item.requestId === request.id && item.id !== offer.id,
  ))
    other.status = "rejected";
  request.status = "selected";

  const order: JsonOrder = {
    id: nextStringId("ORD"),
    requestId: request.id,
    offerId: offer.id,
    buyerId: buyer.id,
    sellerId: seller.id,
    buyerName: buyer.fullName,
    sellerName: seller.fullName,
    title: request.title,
    description: request.description,
    category: request.category,
    quantity: request.quantity,
    requestImages: request.productImages || [],
    productImages: offer.productImages || [],
    totalAmount: String(amount),
    platformFee: String(fee),
    sellerAmount: String(amount - fee),
    status: "pending_payment",
    shippingAddress: address,
    useAlternateAddress: Boolean(input.useAlternateAddress),
    productSpecs: offer.productSpecs,
    productSpecsConfirmedAt: new Date().toISOString(),
    buyerArchived: false,
    sellerArchived: false,
    createdAt: new Date().toISOString(),
  };
  data.orders.unshift(order);
  addNotification(data, {
    userId: buyer.id,
    type: "payment",
    title: "سفارش آماده پرداخت است",
    body: `پیشنهاد ${seller.fullName} برای «${request.title}» انتخاب شد. پرداخت امانی را تکمیل کنید.`,
    href: "/buyer/dashboard",
  });
  addNotification(data, {
    userId: seller.id,
    type: "order",
    title: "پیشنهاد شما انتخاب شد",
    body: `خریدار پیشنهاد شما را انتخاب کرد؛ پس از پرداخت خریدار، سفارش برای ارسال آماده می‌شود.`,
    href: "/seller/dashboard",
  });
  await writeOptiBidData(data);
  return order;
}

export async function createJsonWithdrawalRequest(
  userId: number,
  amount: number,
) {
  const data = await getOptiBidData();
  const user = getUserOrThrow(data, userId);
  const value = Math.max(0, Math.floor(amount));

  if (!value) throw new Error("Valid withdrawal amount required");
  if (user.walletBalance < value)
    throw new Error("Insufficient wallet balance");
  if (
    !user.bankAccountHolder ||
    !user.bankName ||
    !user.bankAccountNumber ||
    !user.bankCardNumber ||
    !user.bankShebaNumber
  ) {
    throw new Error("Bank details are incomplete");
  }

  user.walletBalance -= value;
  const withdrawal: JsonWithdrawalRequest = {
    id: nextStringId("WDR"),
    userId: user.id,
    userName: user.fullName,
    role: user.role === "seller" ? "seller" : "buyer",
    amount: value,
    status: "pending",
    bankAccountHolder: user.bankAccountHolder,
    bankName: user.bankName,
    bankAccountNumber: user.bankAccountNumber,
    bankCardNumber: user.bankCardNumber,
    bankShebaNumber: user.bankShebaNumber,
    createdAt: new Date().toISOString(),
  };
  data.withdrawals.unshift(withdrawal);
  addWalletTransaction(data, {
    userId: user.id,
    type: "withdrawal_hold",
    amount: -value,
    balanceAfter: user.walletBalance,
    description: `رزرو مبلغ برای درخواست برداشت ${withdrawal.id}`,
    withdrawalId: withdrawal.id,
  });
  addNotification(data, {
    userId: user.id,
    type: "wallet",
    title: "درخواست برداشت ثبت شد",
    body: `درخواست برداشت ${value.toLocaleString("fa-IR")} تومان در انتظار تایید ادمین است.`,
    href: `/${user.role}/dashboard`,
  });
  await writeOptiBidData(data);
  return withdrawal;
}

export async function resolveJsonWithdrawal(input: {
  withdrawalId: string;
  status: "approved" | "rejected";
  adminNote?: string;
}) {
  const data = await getOptiBidData();
  const withdrawal = data.withdrawals.find(
    (item) => item.id === input.withdrawalId && item.status === "pending",
  );
  if (!withdrawal) throw new Error("Pending withdrawal not found");
  const user = getUserOrThrow(data, withdrawal.userId);

  withdrawal.status = input.status;
  withdrawal.resolvedAt = new Date().toISOString();
  withdrawal.adminNote = input.adminNote?.trim() || "";

  if (input.status === "rejected") {
    user.walletBalance += withdrawal.amount;
    addWalletTransaction(data, {
      userId: user.id,
      type: "withdrawal_refund",
      amount: withdrawal.amount,
      balanceAfter: user.walletBalance,
      description: `بازگشت مبلغ درخواست برداشت ردشده ${withdrawal.id}`,
      withdrawalId: withdrawal.id,
    });
    addNotification(data, {
      userId: user.id,
      type: "wallet",
      title: "درخواست برداشت رد شد",
      body: `${withdrawal.amount.toLocaleString("fa-IR")} تومان به کیف پول شما بازگردانده شد.${withdrawal.adminNote ? ` توضیح: ${withdrawal.adminNote}` : ""}`,
      href: `/${user.role}/dashboard`,
    });
  } else {
    user.bankDetailsVerified = true;
    addWalletTransaction(data, {
      userId: user.id,
      type: "withdrawal_completed",
      amount: 0,
      balanceAfter: user.walletBalance,
      description: `تسویه بانکی درخواست برداشت ${withdrawal.id}`,
      withdrawalId: withdrawal.id,
    });
    addNotification(data, {
      userId: user.id,
      type: "wallet",
      title: "برداشت تایید و تسویه شد",
      body: `${withdrawal.amount.toLocaleString("fa-IR")} تومان به شبای ثبت‌شده شما ارسال شد.`,
      href: `/${user.role}/dashboard`,
    });
  }

  await writeOptiBidData(data);
  return withdrawal;
}

export async function topUpJsonWallet(userId: number, amount: number) {
  const data = await getOptiBidData();
  const user = getUserOrThrow(data, userId);
  const value = Math.max(0, Math.floor(amount));
  if (!value) throw new Error("Valid topup amount required");
  user.walletBalance += value;
  addWalletTransaction(data, {
    userId,
    type: "topup",
    amount: value,
    balanceAfter: user.walletBalance,
    description: "افزایش موجودی کیف پول",
  });
  addNotification(data, {
    userId,
    type: "wallet",
    title: "کیف پول شارژ شد",
    body: `${value.toLocaleString("fa-IR")} تومان به کیف پول شما افزوده شد.`,
    href: `/${user.role}/dashboard`,
  });
  await writeOptiBidData(data);
  return user;
}

export async function payJsonOrder(input: {
  buyerId: number;
  orderId: string;
  paymentMethod: PaymentMethod;
  gatewayAuthority?: string;
  gatewayRefId?: string;
}) {
  const data = await getOptiBidData();
  const buyer = getUserOrThrow(data, input.buyerId, "buyer");
  const order = data.orders.find(
    (item) =>
      item.id === input.orderId &&
      item.buyerId === buyer.id &&
      item.status === "pending_payment",
  );
  if (!order) throw new Error("Pending payment order not found");
  const amount = money(order.totalAmount);

  if (input.paymentMethod === "wallet") {
    if (buyer.walletBalance < amount)
      throw new Error("Insufficient wallet balance");
    buyer.walletBalance -= amount;
    addWalletTransaction(data, {
      userId: buyer.id,
      type: "escrow_hold",
      amount: -amount,
      balanceAfter: buyer.walletBalance,
      description: `بلوکه شدن وجه امانی سفارش ${order.id}`,
      orderId: order.id,
    });
  } else {
    // In production this transition happens only after a verified payment gateway callback.
    addWalletTransaction(data, {
      userId: buyer.id,
      type: "gateway_payment",
      amount: -amount,
      balanceAfter: buyer.walletBalance,
      description:
        input.paymentMethod === "zarinpal"
          ? `پرداخت اینترنتی زرین‌پال سفارش ${order.id}`
          : `پرداخت اینترنتی سفارش ${order.id}`,
      orderId: order.id,
    });
  }

  order.status = "paid";
  order.paymentMethod = input.paymentMethod;
  order.gatewayAuthority = input.gatewayAuthority || order.gatewayAuthority;
  order.gatewayRefId = input.gatewayRefId || order.gatewayRefId;
  order.paymentAt = new Date().toISOString();
  const escrow: JsonEscrowTransaction = {
    id: nextStringId("ESC"),
    orderId: order.id,
    buyerId: buyer.id,
    sellerId: order.sellerId,
    amount,
    platformFee: money(order.platformFee),
    sellerAmount: money(order.sellerAmount),
    status: "held",
    createdAt: new Date().toISOString(),
  };
  data.transactions.unshift(escrow);
  const request = data.requests.find((item) => item.id === order.requestId);
  if (request) request.status = "paid";
  addNotification(data, {
    userId: order.sellerId,
    type: "payment",
    title: "وجه سفارش امانی شد",
    body: `خریدار مبلغ سفارش «${order.title}» را پرداخت کرد. اکنون کالا را به آدرس ثبت‌شده ارسال کنید.`,
    href: "/seller/dashboard",
  });
  addNotification(data, {
    userId: buyer.id,
    type: "payment",
    title: "پرداخت امانی موفق",
    body: "وجه نزد OptiBid امانت است؛ فروشنده پس از ارسال، کد رهگیری ثبت می‌کند.",
    href: "/buyer/dashboard",
  });
  await writeOptiBidData(data);
  return order;
}

export async function shipJsonOrder(input: {
  sellerId: number;
  orderId: string;
  trackingCode: string;
}) {
  const data = await getOptiBidData();
  const seller = getUserOrThrow(data, input.sellerId, "seller");
  const order = data.orders.find(
    (item) =>
      item.id === input.orderId &&
      item.sellerId === seller.id &&
      item.status === "paid",
  );
  if (!order) throw new Error("Order is not ready for shipment");
  if (!input.trackingCode.trim()) throw new Error("Tracking code is required");

  order.status = "shipped";
  order.trackingCode = input.trackingCode.trim();
  order.shippedAt = new Date().toISOString();
  const request = data.requests.find((item) => item.id === order.requestId);
  if (request) request.status = "shipped";
  const metrics = seller.sellerMetrics || createDefaultSellerMetrics();
  seller.sellerMetrics = {
    ...metrics,
    shippedOrders90d: metrics.shippedOrders90d + 1,
    onTimeShipments90d: metrics.onTimeShipments90d + 1,
    trackedShipments90d: metrics.trackedShipments90d + 1,
    validTrackedShipments90d: metrics.validTrackedShipments90d + 1,
  };
  addNotification(data, {
    userId: order.buyerId,
    type: "shipment",
    title: "کالا توسط فروشنده ارسال شد",
    body: `سفارش «${order.title}» ارسال شد. کد رهگیری: ${order.trackingCode}`,
    href: "/buyer/dashboard",
  });
  addMessage(data, {
    senderId: seller.id,
    receiverId: order.buyerId,
    orderId: order.id,
    content: `کالای شما ارسال شد. کد رهگیری: ${order.trackingCode}`,
  });
  await writeOptiBidData(data);
  return order;
}

export async function confirmJsonOrderReceived(input: {
  buyerId: number;
  orderId: string;
}) {
  const data = await getOptiBidData();
  const buyer = getUserOrThrow(data, input.buyerId, "buyer");
  const order = data.orders.find(
    (item) =>
      item.id === input.orderId &&
      item.buyerId === buyer.id &&
      item.status === "shipped",
  );
  if (!order) throw new Error("Shipped order not found");
  const seller = getUserOrThrow(data, order.sellerId, "seller");
  const escrow = data.transactions.find(
    (item) => item.orderId === order.id && item.status === "held",
  );
  if (!escrow) throw new Error("Escrow transaction not found");

  order.status = "completed";
  order.deliveredAt = new Date().toISOString();
  escrow.status = "released";
  escrow.releasedAt = new Date().toISOString();
  seller.walletBalance += money(order.sellerAmount);
  addPlatformTransaction(data, {
    type: "commission_credit",
    amount: money(order.platformFee),
    description: `دریافت کمیسیون ${data.settings.commissionRate}% از سفارش ${order.id}`,
    orderId: order.id,
  });
  const request = data.requests.find((item) => item.id === order.requestId);
  if (request) request.status = "completed";
  const metrics = seller.sellerMetrics || createDefaultSellerMetrics();
  seller.sellerMetrics = {
    ...metrics,
    completedOrders90d: metrics.completedOrders90d + 1,
    completedOrdersLifetime: metrics.completedOrdersLifetime + 1,
    activeInLast30Days: true,
  };
  addWalletTransaction(data, {
    userId: seller.id,
    type: "escrow_release",
    amount: money(order.sellerAmount),
    balanceAfter: seller.walletBalance,
    description: `واریز وجه پس از تایید دریافت خریدار؛ سفارش ${order.id}`,
    orderId: order.id,
  });
  addNotification(data, {
    userId: seller.id,
    type: "delivery",
    title: "وجه سفارش آزاد شد",
    body: `${money(order.sellerAmount).toLocaleString("fa-IR")} تومان پس از کسر کمیسیون به کیف پول شما واریز شد.`,
    href: "/seller/dashboard",
  });
  addNotification(data, {
    userId: buyer.id,
    type: "delivery",
    title: "دریافت کالا تایید شد",
    body: "معامله تکمیل شد و وجه پس از کسر کمیسیون به فروشنده واریز گردید.",
    href: "/buyer/dashboard",
  });
  await writeOptiBidData(data);
  return order;
}

export async function cancelJsonOrder(input: {
  buyerId: number;
  orderId: string;
}) {
  const data = await getOptiBidData();
  const order = data.orders.find(
    (item) =>
      item.id === input.orderId &&
      item.buyerId === input.buyerId &&
      item.status === "pending_payment",
  );
  if (!order) throw new Error("Only pending payment order can be cancelled");

  order.status = "cancelled";
  order.cancelledAt = new Date().toISOString();
  const request = data.requests.find((item) => item.id === order.requestId);
  const offer = data.offers.find((item) => item.id === order.offerId);
  if (request) request.status = "open";
  if (offer) offer.status = "pending";
  addNotification(data, {
    userId: order.sellerId,
    type: "order",
    title: "خریدار سفارش را لغو کرد",
    body: `سفارش «${order.title}» پیش از پرداخت لغو شد.`,
    href: "/seller/dashboard",
  });
  await writeOptiBidData(data);
  return order;
}

export async function archiveJsonOrder(input: {
  userId: number;
  orderId: string;
  role: "buyer" | "seller";
}) {
  const data = await getOptiBidData();
  const order = data.orders.find(
    (item) =>
      item.id === input.orderId && item[`${input.role}Id`] === input.userId,
  );
  if (!order || !["completed", "cancelled", "returned"].includes(order.status))
    throw new Error(
      "Only completed, cancelled or returned orders can be archived",
    );
  if (input.role === "buyer") order.buyerArchived = true;
  else order.sellerArchived = true;
  await writeOptiBidData(data);
  return order;
}

export async function sendJsonMessage(input: {
  senderId: number;
  receiverId: number;
  content: string;
  orderId?: string;
}) {
  const data = await getOptiBidData();
  const sender = getUserOrThrow(data, input.senderId);
  const receiver = getUserOrThrow(data, input.receiverId);
  if (!input.content.trim()) throw new Error("Message cannot be empty");
  addMessage(data, {
    senderId: sender.id,
    receiverId: receiver.id,
    content: input.content.trim(),
    orderId: input.orderId,
  });
  addNotification(data, {
    userId: receiver.id,
    type: "message",
    title: "پیام جدید",
    body: `${sender.fullName}: ${input.content.trim().slice(0, 80)}`,
    href: `/${receiver.role}/dashboard`,
  });
  await writeOptiBidData(data);
}

export async function getJsonBuyerDashboard(buyerId: number) {
  const data = await getOptiBidData();
  const buyer = getUserOrThrow(data, buyerId, "buyer");
  const requests = data.requests.filter((item) => item.buyerId === buyer.id);
  const enrichedRequests = requests.map((request) => ({
    ...request,
    aiPriceEstimate: request.valuationFactors
      ? estimateFairUsedProductPrice({
          title: request.title,
          category: request.category,
          budget: request.budget,
          quantity: String(request.quantity),
          factors: request.valuationFactors,
        })
      : request.aiPriceEstimate,
  }));
  const requestIds = new Set(enrichedRequests.map((item) => item.id));
  const offers = data.offers.filter((item) => requestIds.has(item.requestId));
  const sellerById = new Map(
    data.users
      .filter((item) => item.role === "seller")
      .map((item) => {
        const { password: _password, ...safeSeller } = item;
        return [item.id, safeSeller];
      }),
  );
  const orders = data.orders.filter((item) => item.buyerId === buyer.id);
  const { password: _buyerPassword, ...safeBuyer } = buyer;
  return {
    buyer: safeBuyer,
    requests: enrichedRequests,
    offers: offers.map((offer) => ({
      ...offer,
      request: enrichedRequests.find((item) => item.id === offer.requestId),
      seller: sellerById.get(offer.sellerId),
    })),
    orders,
    transactions: data.walletTransactions.filter(
      (item) => item.userId === buyer.id,
    ),
    withdrawals: data.withdrawals.filter((item) => item.userId === buyer.id),
    notifications: data.notifications.filter(
      (item) => item.userId === buyer.id,
    ),
    messages: data.messages.filter(
      (item) => item.senderId === buyer.id || item.receiverId === buyer.id,
    ),
    reviews: data.reviews.filter(
      (item) => item.reviewerId === buyer.id || item.revieweeId === buyer.id,
    ),
  };
}

export async function getJsonSellerDashboard(sellerId: number) {
  const data = await getOptiBidData();
  const seller = getUserOrThrow(data, sellerId, "seller");
  const { password: _sellerPassword, ...safeSeller } = seller;
  return {
    seller: safeSeller,
    matchingRequests: await getJsonMatchingRequestsForSeller(sellerId, 5),
    orders: data.orders.filter((item) => item.sellerId === sellerId),
    offers: data.offers.filter((item) => item.sellerId === sellerId),
    transactions: data.walletTransactions.filter(
      (item) => item.userId === sellerId,
    ),
    withdrawals: data.withdrawals.filter((item) => item.userId === sellerId),
    notifications: data.notifications.filter(
      (item) => item.userId === sellerId,
    ),
    messages: data.messages.filter(
      (item) => item.senderId === sellerId || item.receiverId === sellerId,
    ),
    reviews: data.reviews.filter(
      (item) => item.reviewerId === sellerId || item.revieweeId === sellerId,
    ),
  };
}

export async function createJsonPasswordReset(email: string) {
  const data = await getOptiBidData();
  const normalizedEmail = email.trim().toLowerCase();
  const user = data.users.find(
    (item) => item.email.toLowerCase() === normalizedEmail,
  );

  // پاسخ درخواست فراموشی رمز نباید وجود یا عدم وجود ایمیل را افشا کند.
  if (!user) return null;

  const now = Date.now();
  data.passwordResets = data.passwordResets.filter(
    (item) =>
      new Date(item.expiresAt).getTime() > now &&
      !item.usedAt &&
      item.userId !== user.id,
  );

  const token = randomBytes(32).toString("hex");
  data.passwordResets.push({
    id: nextStringId("RST"),
    userId: user.id,
    tokenHash: createHash("sha256").update(token).digest("hex"),
    createdAt: new Date(now).toISOString(),
    expiresAt: new Date(now + 30 * 60 * 1000).toISOString(),
  });
  await writeOptiBidData(data);
  return { token, user };
}

export async function resetJsonPassword(token: string, newPassword: string) {
  const data = await getOptiBidData();
  const tokenHash = createHash("sha256").update(token).digest("hex");
  const reset = data.passwordResets.find(
    (item) =>
      item.tokenHash === tokenHash &&
      !item.usedAt &&
      new Date(item.expiresAt).getTime() > Date.now(),
  );
  if (!reset) throw new Error("Reset token is invalid or expired");
  const user = data.users.find((item) => item.id === reset.userId);
  if (!user) throw new Error("Reset user not found");

  user.password = hashPassword(newPassword);
  reset.usedAt = new Date().toISOString();
  await writeOptiBidData(data);
  return user;
}

export async function createJsonReview(input: {
  orderId: string;
  reviewerId: number;
  overall: number;
  scores: Record<string, number>;
  comment?: string;
}) {
  const data = await getOptiBidData();
  const order = data.orders.find(
    (item) => item.id === input.orderId && item.status === "completed",
  );
  if (!order) throw new Error("Completed order not found");
  const reviewerRole =
    order.buyerId === input.reviewerId
      ? "buyer"
      : order.sellerId === input.reviewerId
        ? "seller"
        : null;
  if (!reviewerRole) throw new Error("Reviewer is not part of order");
  if (
    data.reviews.some(
      (item) =>
        item.orderId === order.id && item.reviewerId === input.reviewerId,
    )
  ) {
    throw new Error("Review already submitted");
  }
  const revieweeId = reviewerRole === "buyer" ? order.sellerId : order.buyerId;
  const normalize = (value: number) =>
    Math.max(1, Math.min(5, Math.round(value)));
  const rawScores = Object.entries(input.scores || {});
  if (rawScores.length === 0 || Number(input.overall) < 1) {
    throw new Error("Rating scores are required");
  }
  const safeScores = Object.fromEntries(
    rawScores.map(([key, value]) => {
      const numericValue = Number(value);
      if (
        !Number.isFinite(numericValue) ||
        numericValue < 1 ||
        numericValue > 5
      ) {
        throw new Error("Rating scores must be between 1 and 5");
      }
      return [key, normalize(numericValue)];
    }),
  );
  const review: JsonReview = {
    id: nextNumericId(data.reviews),
    orderId: order.id,
    reviewerId: input.reviewerId,
    revieweeId,
    reviewerRole,
    overall: normalize(input.overall),
    scores: safeScores,
    comment: typeof input.comment === "string" ? input.comment : "",
    createdAt: new Date().toISOString(),
  };
  data.reviews.unshift(review);

  if (reviewerRole === "buyer") {
    const seller = getUserOrThrow(data, order.sellerId, "seller");
    const metrics = seller.sellerMetrics || createDefaultSellerMetrics();
    const reviewsCount = metrics.reviewsCount90d + 1;
    seller.sellerMetrics = {
      ...metrics,
      reviewsCount90d: reviewsCount,
      ratingAverage90d:
        (metrics.ratingAverage90d * metrics.reviewsCount90d + review.overall) /
        reviewsCount,
    };
  }

  addNotification(data, {
    userId: revieweeId,
    type: "order",
    title: "امتیاز جدید معامله ثبت شد",
    body: `برای سفارش «${order.title}» امتیاز ${review.overall} از ۵ ثبت شد.`,
    href: reviewerRole === "buyer" ? "/seller/dashboard" : "/buyer/dashboard",
  });
  await writeOptiBidData(data);
  return review;
}

export async function getJsonBuyerRankings() {
  const data = await getOptiBidData();
  return data.users
    .filter((user) => user.role === "buyer" && user.isActive)
    .map((buyer) => {
      const reviews = data.reviews.filter(
        (review) =>
          review.revieweeId === buyer.id && review.reviewerRole === "seller",
      );
      const completedOrders = data.orders.filter(
        (order) => order.buyerId === buyer.id && order.status === "completed",
      ).length;
      const prior = 4.2;
      const priorWeight = 5;
      const total = reviews.reduce((sum, review) => sum + review.overall, 0);
      const rating =
        (total + prior * priorWeight) / (reviews.length + priorWeight);
      return {
        buyer: (({
          password: _password,
          bankAccountHolder: _holder,
          bankName: _bank,
          bankAccountNumber: _account,
          bankCardNumber: _card,
          bankShebaNumber: _sheba,
          defaultAddress: _address,
          postalCode: _postalCode,
          ...safe
        }) => safe)(buyer),
        rating: Math.round(rating * 10) / 10,
        reviewsCount: reviews.length,
        completedOrders,
        rankingEligible: reviews.length >= 3 && completedOrders >= 3,
      };
    })
    .sort(
      (a, b) =>
        Number(b.rankingEligible) - Number(a.rankingEligible) ||
        b.rating - a.rating ||
        b.completedOrders - a.completedOrders,
    );
}

function zarinpalEndpoints(sandbox: boolean) {
  return {
    requestEndpoint: sandbox
      ? "https://sandbox.zarinpal.com/pg/v4/payment/request.json"
      : "https://api.zarinpal.com/pg/v4/payment/request.json",
    verifyEndpoint: sandbox
      ? "https://sandbox.zarinpal.com/pg/v4/payment/verify.json"
      : "https://api.zarinpal.com/pg/v4/payment/verify.json",
    startPayBaseUrl: sandbox
      ? "https://sandbox.zarinpal.com/pg/StartPay"
      : "https://www.zarinpal.com/pg/StartPay",
  };
}

function normalizeBaseUrl(value?: string) {
  return (
    value ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    "https://optibid.fazilat-ma.workers.dev"
  ).replace(/\/+$/, "");
}

function buildZarinpalPrerequisites(
  settings: OptiBidJsonData["settings"],
): ZarinpalPrerequisites {
  const zarinpalSandbox =
    typeof process.env.ZARINPAL_SANDBOX === "string"
      ? process.env.ZARINPAL_SANDBOX !== "false"
      : settings.zarinpalSandbox;
  const zarinpalMerchantId =
    process.env.ZARINPAL_MERCHANT_ID || settings.zarinpalMerchantId || "";
  const zarinpalCallbackBaseUrl = normalizeBaseUrl(
    settings.zarinpalCallbackBaseUrl,
  );
  const endpoints = zarinpalEndpoints(zarinpalSandbox);
  const missingItems: string[] = [];
  if (!settings.zarinpalEnabled)
    missingItems.push("فعال‌سازی درگاه زرین‌پال در پنل ادمین");
  if (!zarinpalMerchantId.trim()) missingItems.push("Merchant ID زرین‌پال");
  if (!zarinpalCallbackBaseUrl.startsWith("https://"))
    missingItems.push("آدرس HTTPS سایت/Callback");
  return {
    zarinpalEnabled: settings.zarinpalEnabled,
    zarinpalSandbox,
    zarinpalMerchantId,
    zarinpalCallbackBaseUrl,
    zarinpalDescription:
      settings.zarinpalDescription || "پرداخت امانی سفارش OptiBid",
    hasMerchantId: Boolean(zarinpalMerchantId.trim()),
    callbackUrl: `${zarinpalCallbackBaseUrl}/api/payments/zarinpal/callback`,
    ...endpoints,
    ready: missingItems.length === 0,
    missingItems,
  };
}

export async function prepareJsonZarinpalPayment(input: {
  buyerId: number;
  orderId: string;
  origin?: string;
}) {
  const data = await getOptiBidData();
  const buyer = getUserOrThrow(data, input.buyerId, "buyer");
  const order = data.orders.find(
    (item) =>
      item.id === input.orderId &&
      item.buyerId === buyer.id &&
      item.status === "pending_payment",
  );
  if (!order) throw new Error("Pending payment order not found");
  const prerequisites = buildZarinpalPrerequisites({
    ...data.settings,
    zarinpalCallbackBaseUrl:
      data.settings.zarinpalCallbackBaseUrl || input.origin || "",
  });
  if (!prerequisites.ready) {
    throw new Error(
      `Zarinpal is not ready: ${prerequisites.missingItems.join("، ")}`,
    );
  }
  return {
    buyer: { id: buyer.id, fullName: buyer.fullName, email: buyer.email },
    order,
    amount: money(order.totalAmount),
    prerequisites,
  };
}

export async function createJsonZarinpalPaymentAttempt(input: {
  orderId: string;
  buyerId: number;
  amount: number;
  authority: string;
  callbackUrl: string;
  mode: "sandbox" | "production";
  fee?: number;
  code?: number;
  message?: string;
}) {
  const data = await getOptiBidData();
  data.zarinpalPayments = (data.zarinpalPayments || []).filter(
    (item) => !(item.orderId === input.orderId && item.status === "pending"),
  );
  const now = new Date().toISOString();
  const payment: JsonZarinpalPayment = {
    id: nextStringId("ZRP"),
    orderId: input.orderId,
    buyerId: input.buyerId,
    amount: input.amount,
    authority: input.authority,
    callbackUrl: input.callbackUrl,
    mode: input.mode,
    status: "pending",
    fee: input.fee,
    code: input.code,
    message: input.message,
    createdAt: now,
    updatedAt: now,
  };
  data.zarinpalPayments.unshift(payment);
  addNotification(data, {
    userId: input.buyerId,
    type: "payment",
    title: "انتقال به درگاه زرین‌پال",
    body: `درخواست پرداخت زرین‌پال برای سفارش ${input.orderId} ایجاد شد.`,
    href: "/buyer/dashboard",
  });
  await writeOptiBidData(data);
  return payment;
}

export async function getJsonZarinpalPaymentAttempt(authority: string) {
  const data = await getOptiBidData();
  const payment = data.zarinpalPayments.find(
    (item) => item.authority === authority,
  );
  if (!payment) throw new Error("Zarinpal payment not found");
  return payment;
}

export async function failJsonZarinpalPayment(input: {
  authority: string;
  status: "failed" | "cancelled";
  message?: string;
  code?: number;
}) {
  const data = await getOptiBidData();
  const payment = data.zarinpalPayments.find(
    (item) => item.authority === input.authority,
  );
  if (!payment) throw new Error("Zarinpal payment not found");
  payment.status = input.status;
  payment.message = input.message || payment.message;
  payment.code = input.code ?? payment.code;
  payment.updatedAt = new Date().toISOString();
  addNotification(data, {
    userId: payment.buyerId,
    type: "payment",
    title:
      input.status === "cancelled"
        ? "پرداخت زرین‌پال لغو شد"
        : "پرداخت زرین‌پال ناموفق بود",
    body: `پرداخت سفارش ${payment.orderId} تکمیل نشد.${payment.message ? ` ${payment.message}` : ""}`,
    href: "/buyer/dashboard",
  });
  await writeOptiBidData(data);
  return payment;
}

export async function completeJsonZarinpalPayment(input: {
  authority: string;
  refId: string;
  cardPan?: string;
  fee?: number;
  code?: number;
  message?: string;
}) {
  const data = await getOptiBidData();
  const payment = data.zarinpalPayments.find(
    (item) => item.authority === input.authority,
  );
  if (!payment) throw new Error("Zarinpal payment not found");
  const buyer = getUserOrThrow(data, payment.buyerId, "buyer");
  const order = data.orders.find(
    (item) => item.id === payment.orderId && item.buyerId === buyer.id,
  );
  if (!order) throw new Error("Zarinpal order not found");
  if (money(order.totalAmount) !== payment.amount)
    throw new Error("Zarinpal amount mismatch");

  payment.status = "verified";
  payment.refId = input.refId;
  payment.cardPan = input.cardPan;
  payment.fee = input.fee ?? payment.fee;
  payment.code = input.code ?? payment.code;
  payment.message = input.message || payment.message;
  payment.updatedAt = new Date().toISOString();

  if (order.status === "pending_payment") {
    const amount = money(order.totalAmount);
    addWalletTransaction(data, {
      userId: buyer.id,
      type: "gateway_payment",
      amount: -amount,
      balanceAfter: buyer.walletBalance,
      description: `پرداخت اینترنتی زرین‌پال سفارش ${order.id} - کد رهگیری ${input.refId}`,
      orderId: order.id,
    });
    order.status = "paid";
    order.paymentMethod = "zarinpal";
    order.gatewayAuthority = input.authority;
    order.gatewayRefId = input.refId;
    order.paymentAt = new Date().toISOString();
    const escrow: JsonEscrowTransaction = {
      id: nextStringId("ESC"),
      orderId: order.id,
      buyerId: buyer.id,
      sellerId: order.sellerId,
      amount,
      platformFee: money(order.platformFee),
      sellerAmount: money(order.sellerAmount),
      status: "held",
      createdAt: new Date().toISOString(),
    };
    data.transactions.unshift(escrow);
    const request = data.requests.find((item) => item.id === order.requestId);
    if (request) request.status = "paid";
    addNotification(data, {
      userId: order.sellerId,
      type: "payment",
      title: "وجه سفارش از زرین‌پال امانی شد",
      body: `خریدار مبلغ سفارش «${order.title}» را از زرین‌پال پرداخت کرد. اکنون کالا را ارسال کنید.`,
      href: "/seller/dashboard",
    });
    addNotification(data, {
      userId: buyer.id,
      type: "payment",
      title: "پرداخت زرین‌پال موفق بود",
      body: `پرداخت سفارش «${order.title}» با کد رهگیری ${input.refId} تایید شد و وجه نزد OptiBid امانت است.`,
      href: "/buyer/dashboard",
    });
  }

  await writeOptiBidData(data);
  return { order, payment };
}

export async function getJsonZarinpalPrerequisites() {
  const data = await getOptiBidData();
  return buildZarinpalPrerequisites(data.settings);
}

export async function updateJsonPlatformFinanceSettings(updates: {
  commissionRate?: number;
  adminAccountHolder?: string;
  adminBankName?: string;
  adminSheba?: string;
  adminCardNumber?: string;
  zarinpalEnabled?: boolean;
  zarinpalSandbox?: boolean;
  zarinpalMerchantId?: string;
  zarinpalCallbackBaseUrl?: string;
  zarinpalDescription?: string;
}) {
  const data = await getOptiBidData();
  if (typeof updates.commissionRate === "number") {
    data.settings.commissionRate = Math.max(
      0,
      Math.min(30, updates.commissionRate),
    );
  }
  if (typeof updates.adminAccountHolder === "string")
    data.settings.adminAccountHolder = updates.adminAccountHolder.trim();
  if (typeof updates.adminBankName === "string")
    data.settings.adminBankName = updates.adminBankName.trim();
  if (typeof updates.adminSheba === "string")
    data.settings.adminSheba = updates.adminSheba.trim();
  if (typeof updates.adminCardNumber === "string")
    data.settings.adminCardNumber = updates.adminCardNumber.trim();
  if (typeof updates.zarinpalEnabled === "boolean")
    data.settings.zarinpalEnabled = updates.zarinpalEnabled;
  if (typeof updates.zarinpalSandbox === "boolean")
    data.settings.zarinpalSandbox = updates.zarinpalSandbox;
  if (typeof updates.zarinpalMerchantId === "string")
    data.settings.zarinpalMerchantId = updates.zarinpalMerchantId.trim();
  if (typeof updates.zarinpalCallbackBaseUrl === "string")
    data.settings.zarinpalCallbackBaseUrl = normalizeBaseUrl(
      updates.zarinpalCallbackBaseUrl,
    );
  if (typeof updates.zarinpalDescription === "string")
    data.settings.zarinpalDescription =
      updates.zarinpalDescription.trim() || "پرداخت امانی سفارش OptiBid";
  await writeOptiBidData(data);
  return data.settings;
}

export async function getJsonPlatformFinance() {
  const data = await getOptiBidData();
  return {
    settings: data.settings,
    platformTransactions: data.platformTransactions,
    escrowTransactions: data.transactions,
    withdrawals: data.withdrawals,
    zarinpalPayments: data.zarinpalPayments || [],
    zarinpalPrerequisites: buildZarinpalPrerequisites(data.settings),
  };
}

export async function getJsonHomepageStats() {
  const data = await getOptiBidData();
  const completedOrders = data.orders.filter(isSuccessfulOrder);
  const failedOrders = data.orders.filter((order) =>
    isFailedOrder(order, data.transactions),
  );
  const finalOrdersCount = completedOrders.length + failedOrders.length;

  return {
    requestsCount: data.requests.filter(isPublicRequest).length,
    sellersCount: data.users.filter(
      (user) => user.role === "seller" && user.isActive,
    ).length,
    secureTransactionsCount: data.transactions.length,
    totalVolume: completedOrders.reduce(
      (sum, order) => sum + money(order.totalAmount),
      0,
    ),
    successRate:
      finalOrdersCount === 0
        ? 0
        : Math.round((completedOrders.length / finalOrdersCount) * 100),
    failedOrdersCount: failedOrders.length,
    completedOrdersCount: completedOrders.length,
  };
}

export async function getJsonAdminStats() {
  const data = await getOptiBidData();
  const completedOrders = data.orders.filter(isSuccessfulOrder);
  const heldEscrow = data.transactions.filter(
    (transaction) => transaction.status === "held",
  );
  const totalCommission = data.platformTransactions
    .filter((transaction) => transaction.type === "commission_credit")
    .reduce((sum, transaction) => sum + transaction.amount, 0);
  return {
    totalVolume: completedOrders.reduce(
      (sum, order) => sum + money(order.totalAmount),
      0,
    ),
    totalCommission,
    platformWalletBalance: data.settings.platformWalletBalance,
    escrowHeld: heldEscrow.reduce(
      (sum, transaction) => sum + transaction.amount,
      0,
    ),
    openRequests: data.requests.filter((request) => request.status === "open")
      .length,
  };
}

export async function getJsonRequests() {
  const data = await getOptiBidData();
  return data.requests
    .filter(isPublicRequest)
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
}

function percentageChange(current: number, previous: number) {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
}

function average(values: number[]) {
  return values.length === 0
    ? 0
    : values.reduce((sum, value) => sum + value, 0) / values.length;
}

function ema(values: number[], period: number) {
  if (values.length < period) return [] as number[];
  const multiplier = 2 / (period + 1);
  const result: number[] = [];
  let previous = average(values.slice(0, period));
  result.push(previous);
  for (let index = period; index < values.length; index += 1) {
    previous = (values[index] - previous) * multiplier + previous;
    result.push(previous);
  }
  return result;
}

function calculateRsi(values: number[], period = 14) {
  if (values.length < period + 1) return null;
  const slice = values.slice(-period - 1);
  let gains = 0;
  let losses = 0;
  for (let index = 1; index < slice.length; index += 1) {
    const change = slice[index] - slice[index - 1];
    if (change >= 0) gains += change;
    else losses += Math.abs(change);
  }
  const avgGain = gains / period;
  const avgLoss = losses / period;
  if (avgLoss === 0 && avgGain === 0) return 50;
  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return Math.round((100 - 100 / (1 + rs)) * 10) / 10;
}

function calculateMacd(values: number[]) {
  if (values.length < 35) return null;
  const ema12 = ema(values, 12);
  const ema26 = ema(values, 26);
  const offset = ema12.length - ema26.length;
  const macdLine = ema26.map((value, index) => ema12[index + offset] - value);
  const signalLine = ema(macdLine, 9);
  if (signalLine.length === 0) return null;
  const macd = macdLine[macdLine.length - 1];
  const signal = signalLine[signalLine.length - 1];
  return {
    macd: Math.round(macd * 10) / 10,
    signal: Math.round(signal * 10) / 10,
    histogram: Math.round((macd - signal) * 10) / 10,
  };
}

function calculateRsiSeries(values: number[], period = 14) {
  return values.map((_, index) => {
    if (index < period) return null;
    return calculateRsi(values.slice(0, index + 1), period);
  });
}

function calculateMacdSeries(values: number[]) {
  return values.map((_, index) => calculateMacd(values.slice(0, index + 1)));
}

function calculateSmaSeries(
  values: number[],
  period: number,
): Array<number | null> {
  return values.map((_, index) => {
    if (index < period - 1) return null;
    return (
      Math.round(average(values.slice(index - period + 1, index + 1)) * 10) / 10
    );
  });
}

function calculateEmaSeries(
  values: number[],
  period: number,
): Array<number | null> {
  const result: Array<number | null> = values.map(() => null);
  if (values.length < period) return result;
  const multiplier = 2 / (period + 1);
  let previous = average(values.slice(0, period));
  result[period - 1] = Math.round(previous * 10) / 10;
  for (let index = period; index < values.length; index += 1) {
    previous = (values[index] - previous) * multiplier + previous;
    result[index] = Math.round(previous * 10) / 10;
  }
  return result;
}

function standardDeviation(values: number[]) {
  if (values.length === 0) return 0;
  const avg = average(values);
  const variance = average(values.map((value) => (value - avg) ** 2));
  return Math.sqrt(variance);
}

function calculateBollingerSeries(
  values: number[],
  period = 20,
  multiplier = 2,
) {
  return values.map((_, index) => {
    if (index < period - 1) return { upper: null, middle: null, lower: null };
    const window = values.slice(index - period + 1, index + 1);
    const middle = average(window);
    const deviation = standardDeviation(window) * multiplier;
    return {
      upper: Math.round((middle + deviation) * 10) / 10,
      middle: Math.round(middle * 10) / 10,
      lower: Math.round(Math.max(0, middle - deviation) * 10) / 10,
    };
  });
}

function calculateStochRsiSeries(
  rsiSeries: Array<number | null>,
  period = 14,
  smoothK = 3,
  smoothD = 3,
) {
  const rawK: Array<number | null> = rsiSeries.map((rsi, index) => {
    if (rsi === null || index < period - 1) return null;
    const window = rsiSeries
      .slice(index - period + 1, index + 1)
      .filter((value): value is number => value !== null);
    if (window.length < period) return null;
    const lowest = Math.min(...window);
    const highest = Math.max(...window);
    if (highest === lowest) return 50;
    return Math.round(((rsi - lowest) / (highest - lowest)) * 1000) / 10;
  });

  const k = rawK.map((_, index) => {
    const window = rawK
      .slice(Math.max(0, index - smoothK + 1), index + 1)
      .filter((value): value is number => value !== null);
    return window.length < smoothK
      ? null
      : Math.round(average(window) * 10) / 10;
  });

  const d = k.map((_, index) => {
    const window = k
      .slice(Math.max(0, index - smoothD + 1), index + 1)
      .filter((value): value is number => value !== null);
    return window.length < smoothD
      ? null
      : Math.round(average(window) * 10) / 10;
  });

  return { k, d };
}

function calculateRocSeries(
  values: number[],
  period = 12,
): Array<number | null> {
  return values.map((value, index) => {
    if (index < period || values[index - period] === 0) return null;
    return (
      Math.round(
        ((value - values[index - period]) / values[index - period]) * 1000,
      ) / 10
    );
  });
}

function calculateMomentumSeries(
  values: number[],
  period = 10,
): Array<number | null> {
  return values.map((value, index) =>
    index < period
      ? null
      : Math.round((value - values[index - period]) * 10) / 10,
  );
}

function calculateAtrSeries(
  values: number[],
  period = 14,
): Array<number | null> {
  const trueRanges = values.map((value, index) =>
    index === 0 ? 0 : Math.abs(value - values[index - 1]),
  );
  return trueRanges.map((_, index) => {
    if (index < period) return null;
    return (
      Math.round(
        average(trueRanges.slice(index - period + 1, index + 1)) * 10,
      ) / 10
    );
  });
}

function buildDailyChartPoints(points: Array<{ at: string; value: number }>) {
  const buckets = new Map<
    string,
    { at: string; priceSum: number; priceCount: number; demand: number }
  >();
  for (const point of points) {
    if (!point.value) continue;
    const date = new Date(point.at);
    const key = Number.isFinite(date.getTime())
      ? date.toISOString().slice(0, 10)
      : point.at.slice(0, 10);
    const current = buckets.get(key) || {
      at: `${key}T00:00:00.000Z`,
      priceSum: 0,
      priceCount: 0,
      demand: 0,
    };
    current.priceSum += point.value;
    current.priceCount += 1;
    current.demand += 1;
    buckets.set(key, current);
  }

  const rows = [...buckets.values()]
    .sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime())
    .map((item) => ({
      at: item.at,
      label: new Date(item.at).toLocaleDateString("fa-IR", {
        month: "short",
        day: "numeric",
      }),
      price: Math.round(item.priceSum / Math.max(1, item.priceCount)),
      demand: item.demand,
    }));

  const prices = rows.map((item) => item.price);
  const rsiSeries = calculateRsiSeries(prices);
  const macdSeries = calculateMacdSeries(prices);
  const sma7Series = calculateSmaSeries(prices, 7);
  const sma20Series = calculateSmaSeries(prices, 20);
  const ema12Series = calculateEmaSeries(prices, 12);
  const ema26Series = calculateEmaSeries(prices, 26);
  const bollingerSeries = calculateBollingerSeries(prices, 20, 2);
  const stochRsi = calculateStochRsiSeries(rsiSeries, 14, 3, 3);
  const rocSeries = calculateRocSeries(prices, 12);
  const momentumSeries = calculateMomentumSeries(prices, 10);
  const atrSeries = calculateAtrSeries(prices, 14);

  return rows.map((row, index) => ({
    ...row,
    sma7: sma7Series[index],
    sma20: sma20Series[index],
    ema12: ema12Series[index],
    ema26: ema26Series[index],
    bollingerUpper: bollingerSeries[index]?.upper ?? null,
    bollingerMiddle: bollingerSeries[index]?.middle ?? null,
    bollingerLower: bollingerSeries[index]?.lower ?? null,
    rsi: rsiSeries[index],
    stochRsiK: stochRsi.k[index],
    stochRsiD: stochRsi.d[index],
    macd: macdSeries[index]?.macd ?? null,
    macdSignal: macdSeries[index]?.signal ?? null,
    macdHistogram: macdSeries[index]?.histogram ?? null,
    roc: rocSeries[index],
    momentum: momentumSeries[index],
    atr: atrSeries[index],
  }));
}

function technicalSignal(
  rsi: number | null,
  macd: ReturnType<typeof calculateMacd>,
) {
  if (rsi === null && !macd) return "داده ناکافی";
  if (rsi !== null && rsi >= 70 && macd && macd.histogram > 0)
    return "تقاضا/قیمت داغ — احتمال اشباع خرید";
  if (rsi !== null && rsi <= 30 && macd && macd.histogram < 0)
    return "ضعیف — احتمال افت کوتاه‌مدت";
  if (macd && macd.histogram > 0) return "مومنتوم مثبت";
  if (macd && macd.histogram < 0) return "مومنتوم منفی";
  if (rsi !== null && rsi > 55) return "تمایل صعودی";
  if (rsi !== null && rsi < 45) return "تمایل نزولی";
  return "خنثی";
}

function predictionLabel(score: number) {
  if (score >= 35) return "افزایش محتمل";
  if (score <= -20) return "کاهش محتمل";
  return "ثبات نسبی";
}

export async function getJsonAdminReports() {
  const data = await getOptiBidData();
  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;
  const recentCutoff = now - 30 * day;
  const previousCutoff = now - 60 * day;
  const requestById = new Map(
    data.requests.map((request) => [request.id, request]),
  );

  type ProductAccumulator = {
    product: string;
    category: string;
    requestsCount: number;
    openRequests: number;
    offersCount: number;
    acceptedOffers: number;
    completedOrders: number;
    failedOrders: number;
    totalSalesAmount: number;
    totalRequestedBudget: number;
    recentDemand: number;
    previousDemand: number;
    recentPrices: number[];
    previousPrices: number[];
    pricePoints: Array<{ at: string; value: number }>;
    lastActivityAt: string;
  };

  const products = new Map<string, ProductAccumulator>();
  const getProduct = (rawTitle: string, category = "سایر") => {
    const product = rawTitle.trim().replace(/\s+/g, " ") || "کالای بدون عنوان";
    const existing = products.get(product);
    if (existing) {
      if (!existing.category || existing.category === "سایر")
        existing.category = category || "سایر";
      return existing;
    }
    const created: ProductAccumulator = {
      product,
      category: category || "سایر",
      requestsCount: 0,
      openRequests: 0,
      offersCount: 0,
      acceptedOffers: 0,
      completedOrders: 0,
      failedOrders: 0,
      totalSalesAmount: 0,
      totalRequestedBudget: 0,
      recentDemand: 0,
      previousDemand: 0,
      recentPrices: [],
      previousPrices: [],
      pricePoints: [],
      lastActivityAt: "",
    };
    products.set(product, created);
    return created;
  };

  const addDemand = (item: ProductAccumulator, at?: string) => {
    const time = at ? new Date(at).getTime() : 0;
    if (time >= recentCutoff) item.recentDemand += 1;
    else if (time >= previousCutoff) item.previousDemand += 1;
    if (
      at &&
      (!item.lastActivityAt ||
        new Date(at).getTime() > new Date(item.lastActivityAt).getTime())
    ) {
      item.lastActivityAt = at;
    }
  };

  const addPrice = (item: ProductAccumulator, value: number, at?: string) => {
    if (!value) return;
    const timestamp = at || new Date().toISOString();
    item.pricePoints.push({ at: timestamp, value });
    const time = new Date(timestamp).getTime();
    if (time >= recentCutoff) item.recentPrices.push(value);
    else if (time >= previousCutoff) item.previousPrices.push(value);
  };

  for (const request of data.requests) {
    const item = getProduct(request.title, request.category);
    item.requestsCount += 1;
    if (request.status === "open") item.openRequests += 1;
    item.totalRequestedBudget += money(request.budget);
    addDemand(item, request.createdAt);
    addPrice(item, money(request.budget), request.createdAt);
  }

  for (const offer of data.offers) {
    const request = requestById.get(offer.requestId);
    const item = getProduct(
      request?.title || `درخواست ${offer.requestId}`,
      request?.category || "سایر",
    );
    item.offersCount += 1;
    if (offer.status === "accepted") item.acceptedOffers += 1;
    addPrice(item, money(offer.amount), offer.createdAt);
  }

  for (const order of data.orders) {
    const item = getProduct(order.title, order.category);
    if (isSuccessfulOrder(order)) {
      item.completedOrders += 1;
      item.totalSalesAmount += money(order.totalAmount);
    }
    if (isFailedOrder(order, data.transactions)) item.failedOrders += 1;
    addDemand(item, order.createdAt);
    addPrice(
      item,
      money(order.totalAmount),
      order.paymentAt || order.createdAt,
    );
  }

  const baseProductReports = [...products.values()]
    .map((item) => {
      const sortedPointObjects = item.pricePoints.sort(
        (a, b) => new Date(a.at).getTime() - new Date(b.at).getTime(),
      );
      const sortedPrices = sortedPointObjects.map((point) => point.value);
      const chartPoints = buildDailyChartPoints(sortedPointObjects);
      const rsi = calculateRsi(sortedPrices);
      const macd = calculateMacd(sortedPrices);
      const demandTrendPercent = percentageChange(
        item.recentDemand,
        item.previousDemand,
      );
      const recentAveragePrice = average(item.recentPrices);
      const previousAveragePrice = average(item.previousPrices);
      const priceTrendPercent = previousAveragePrice
        ? percentageChange(recentAveragePrice, previousAveragePrice)
        : recentAveragePrice > 0
          ? 100
          : 0;
      const demandScore =
        demandTrendPercent +
        item.recentDemand * 12 +
        item.completedOrders * 8 +
        item.offersCount * 2;
      const priceScore =
        priceTrendPercent + (macd?.histogram || 0) / 1000 + (rsi || 50) - 50;
      return {
        product: item.product,
        category: item.category,
        requestsCount: item.requestsCount,
        openRequests: item.openRequests,
        offersCount: item.offersCount,
        acceptedOffers: item.acceptedOffers,
        completedOrders: item.completedOrders,
        failedOrders: item.failedOrders,
        totalSalesAmount: item.totalSalesAmount,
        averageRequestedBudget: Math.round(
          item.totalRequestedBudget / Math.max(1, item.requestsCount),
        ),
        averageSaleAmount: Math.round(
          item.totalSalesAmount / Math.max(1, item.completedOrders),
        ),
        recentDemand: item.recentDemand,
        previousDemand: item.previousDemand,
        demandTrendPercent,
        priceTrendPercent,
        rsi,
        macd,
        technicalSignal: technicalSignal(rsi, macd),
        aiDemandForecast: predictionLabel(demandScore),
        aiPriceForecast: predictionLabel(priceScore),
        aiConfidence: Math.max(
          20,
          Math.min(
            95,
            Math.round(
              25 +
                sortedPrices.length * 4 +
                item.requestsCount * 3 +
                item.completedOrders * 5,
            ),
          ),
        ),
        dataPoints: sortedPrices.length,
        chartPoints,
        chartDistribution: [
          { label: "درخواست فعال", value: item.openRequests },
          { label: "پیشنهاد", value: item.offersCount },
          { label: "فروش موفق", value: item.completedOrders },
          { label: "ناموفق/مرجوع", value: item.failedOrders },
        ],
        lastActivityAt: item.lastActivityAt,
      };
    })
    .sort(
      (a, b) =>
        b.requestsCount - a.requestsCount ||
        b.totalSalesAmount - a.totalSalesAmount,
    );

  const productReports = await Promise.all(
    baseProductReports.map(async (report) => {
      const external = await getExternalMarketSeriesForProduct(
        report.product,
        report.category,
      );
      if (!external) {
        return {
          ...report,
          externalSource: null,
          externalChartPoints: [],
          externalRsi: null,
          externalMacd: null,
          externalTechnicalSignal: "داده بیرونی در دسترس نیست",
        };
      }

      const externalValues = external.points.map((point) => point.value);
      const externalRsi = calculateRsi(externalValues);
      const externalMacd = calculateMacd(externalValues);
      const externalChartPoints = buildDailyChartPoints(external.points);
      return {
        ...report,
        externalSource: {
          sourceName: external.sourceName,
          sourceTitle: external.sourceTitle,
          sourceUrl: external.sourceUrl,
          sourceSlug: external.sourceSlug,
          matchReason: external.matchReason,
          isProxy: external.isProxy,
          currency: external.currency,
          unit: external.unit,
          fetchedAt: external.fetchedAt,
          currentPrice: external.currentPrice,
          pointsCount: external.points.length,
        },
        externalChartPoints,
        externalRsi,
        externalMacd,
        externalTechnicalSignal: technicalSignal(externalRsi, externalMacd),
      };
    }),
  );

  const buyerReports = data.users
    .filter((user) => user.role === "buyer")
    .map((buyer) => {
      const requests = data.requests.filter(
        (request) => request.buyerId === buyer.id,
      );
      const orders = data.orders.filter((order) => order.buyerId === buyer.id);
      const completedOrders = orders.filter(isSuccessfulOrder);
      const failedOrders = orders.filter((order) =>
        isFailedOrder(order, data.transactions),
      );
      const finalOrdersCount = completedOrders.length + failedOrders.length;
      const totalPurchaseAmount = completedOrders.reduce(
        (sum, order) => sum + money(order.totalAmount),
        0,
      );
      return {
        id: buyer.id,
        name: buyer.fullName,
        email: buyer.email,
        requestsCount: requests.length,
        activeRequests: requests.filter((request) => request.status === "open")
          .length,
        completedPurchases: completedOrders.length,
        failedPurchases: failedOrders.length,
        totalPurchaseAmount,
        averagePurchaseAmount: Math.round(
          totalPurchaseAmount / Math.max(1, completedOrders.length),
        ),
        successRate:
          finalOrdersCount === 0
            ? 0
            : Math.round((completedOrders.length / finalOrdersCount) * 100),
        reviewsGiven: data.reviews.filter(
          (review) => review.reviewerId === buyer.id,
        ).length,
        reviewsReceived: data.reviews.filter(
          (review) => review.revieweeId === buyer.id,
        ).length,
      };
    })
    .sort(
      (a, b) =>
        b.totalPurchaseAmount - a.totalPurchaseAmount ||
        b.completedPurchases - a.completedPurchases,
    );

  const sellerReports = data.users
    .filter((user) => user.role === "seller")
    .map((seller) => {
      const offers = data.offers.filter(
        (offer) => offer.sellerId === seller.id,
      );
      const orders = data.orders.filter(
        (order) => order.sellerId === seller.id,
      );
      const completedOrders = orders.filter(isSuccessfulOrder);
      const failedOrders = orders.filter((order) =>
        isFailedOrder(order, data.transactions),
      );
      const totalSalesAmount = completedOrders.reduce(
        (sum, order) => sum + money(order.totalAmount),
        0,
      );
      const netSellerRevenue = completedOrders.reduce(
        (sum, order) => sum + money(order.sellerAmount),
        0,
      );
      const score = calculateSellerScore(
        seller.sellerMetrics || createDefaultSellerMetrics(),
      );
      return {
        id: seller.id,
        name: seller.fullName,
        email: seller.email,
        categories: seller.categories || [],
        offersCount: offers.length,
        acceptedOffers: offers.filter((offer) => offer.status === "accepted")
          .length,
        completedSales: completedOrders.length,
        failedSales: failedOrders.length,
        totalSalesAmount,
        netSellerRevenue,
        averageSaleAmount: Math.round(
          totalSalesAmount / Math.max(1, completedOrders.length),
        ),
        ratingScore: score.finalScore,
        ratingLabel: score.label,
      };
    })
    .sort(
      (a, b) =>
        b.totalSalesAmount - a.totalSalesAmount ||
        b.completedSales - a.completedSales,
    );

  return {
    generatedAt: new Date().toISOString(),
    summary: {
      productsCount: productReports.length,
      buyersCount: buyerReports.length,
      sellersCount: sellerReports.length,
      totalRequests: data.requests.length,
      activeRequests: data.requests.filter(isPublicRequest).length,
      completedOrders: data.orders.filter(isSuccessfulOrder).length,
      failedOrders: data.orders.filter((order) =>
        isFailedOrder(order, data.transactions),
      ).length,
    },
    productReports,
    buyerReports,
    sellerReports,
    analytics: {
      growingItems: [...productReports]
        .sort(
          (a, b) =>
            b.demandTrendPercent - a.demandTrendPercent ||
            b.recentDemand - a.recentDemand,
        )
        .slice(0, 8),
      mostRequestedItems: [...productReports]
        .sort((a, b) => b.requestsCount - a.requestsCount)
        .slice(0, 8),
      highestRevenueItems: [...productReports]
        .sort((a, b) => b.totalSalesAmount - a.totalSalesAmount)
        .slice(0, 8),
      technicalItems: productReports,
    },
  };
}

export function getJsonStorageInfo() {
  return { dataFile };
}

/**
 * اطلاعات ذخیره‌سازی برای نمایش در داشبورد/وضعیت سیستم:
 * در Workers مقدار "cloudflare-kv" و در Node مقدار "json-file" برمی‌گرداند.
 */
export async function getStorageInfo() {
  const usingKv = await getKvNamespace();
  return {
    mode: usingKv ? "cloudflare-kv" : "json-file",
    kvKey: usingKv ? KV_DATA_KEY : null,
    dataFile: usingKv ? null : dataFile,
  };
}
