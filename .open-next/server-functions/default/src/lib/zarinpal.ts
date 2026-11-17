export type ZarinpalRequestInput = {
  merchantId: string;
  amount: number;
  callbackUrl: string;
  description: string;
  sandbox: boolean;
  metadata?: {
    mobile?: string;
    email?: string;
    orderId?: string;
  };
};

export type ZarinpalVerifyInput = {
  merchantId: string;
  amount: number;
  authority: string;
  sandbox: boolean;
};

export function zarinpalEndpoints(sandbox: boolean) {
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

function readableZarinpalError(payload: any) {
  return (
    payload?.errors?.message ||
    payload?.data?.message ||
    payload?.message ||
    "پاسخ نامعتبر از زرین‌پال دریافت شد."
  );
}

export async function requestZarinpalPayment(input: ZarinpalRequestInput) {
  const endpoints = zarinpalEndpoints(input.sandbox);
  const response = await fetch(endpoints.requestEndpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      merchant_id: input.merchantId,
      amount: input.amount,
      callback_url: input.callbackUrl,
      description: input.description,
      metadata: {
        mobile: input.metadata?.mobile || undefined,
        email: input.metadata?.email || undefined,
        order_id: input.metadata?.orderId || undefined,
      },
    }),
  });
  const payload = await response.json().catch(() => ({}));
  const code = Number(payload?.data?.code || 0);
  const authority = String(payload?.data?.authority || "");

  if (!response.ok || code !== 100 || !authority) {
    throw new Error(`ZARINPAL_REQUEST_FAILED:${code}:${readableZarinpalError(payload)}`);
  }

  return {
    authority,
    code,
    fee: Number(payload?.data?.fee || 0),
    feeType: payload?.data?.fee_type,
    message: payload?.data?.message || "درخواست پرداخت ایجاد شد.",
    redirectUrl: `${endpoints.startPayBaseUrl}/${authority}`,
    raw: payload,
  };
}

export async function verifyZarinpalPayment(input: ZarinpalVerifyInput) {
  const endpoints = zarinpalEndpoints(input.sandbox);
  const response = await fetch(endpoints.verifyEndpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      merchant_id: input.merchantId,
      amount: input.amount,
      authority: input.authority,
    }),
  });
  const payload = await response.json().catch(() => ({}));
  const code = Number(payload?.data?.code || 0);

  if (!response.ok || ![100, 101].includes(code)) {
    throw new Error(`ZARINPAL_VERIFY_FAILED:${code}:${readableZarinpalError(payload)}`);
  }

  return {
    code,
    refId: String(payload?.data?.ref_id || ""),
    cardPan: payload?.data?.card_pan ? String(payload.data.card_pan) : "",
    cardHash: payload?.data?.card_hash ? String(payload.data.card_hash) : "",
    fee: Number(payload?.data?.fee || 0),
    message: payload?.data?.message || "پرداخت تایید شد.",
    raw: payload,
  };
}
