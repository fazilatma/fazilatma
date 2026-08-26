import { notFound } from "next/navigation";
import { getOptiBidData } from "@/lib/json-store";
import OfferFormClient from "./OfferFormClient";

export const dynamic = "force-dynamic";

export default async function SellerOfferPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await getOptiBidData();
  const request = data.requests.find((item) => item.id === Number(id));
  if (!request) notFound();

  const offers = data.offers
    .filter((offer) => offer.requestId === request.id)
    .map((offer) => ({
      id: offer.id,
      requestId: offer.requestId,
      sellerId: offer.sellerId,
      sellerName: offer.sellerName,
      amount: offer.amount,
      deliveryDays: offer.deliveryDays,
      message: offer.message,
      status: offer.status,
      productSpecs: offer.productSpecs,
      productImages: offer.productImages || [],
    }));

  return <OfferFormClient request={request} existingOffers={offers} />;
}
