import AdminDashboardClient from "./AdminDashboardClient";
import {
  getJsonAdminStats,
  getJsonKycUsers,
  getJsonSellerRankings,
} from "@/lib/json-store";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  let realStats = {
    totalVolume: 0,
    totalCommission: 0,
    platformWalletBalance: 0,
    escrowHeld: 0,
    openRequests: 0,
  };

  let sellerRankings: Awaited<ReturnType<typeof getJsonSellerRankings>> = [];
  let kycUsers: Awaited<ReturnType<typeof getJsonKycUsers>> = [];
  try {
    [realStats, sellerRankings, kycUsers] = await Promise.all([
      getJsonAdminStats(),
      getJsonSellerRankings(),
      getJsonKycUsers(),
    ]);
  } catch (error) {
    console.error("JSON admin stats/rankings/KYC error:", error);
  }

  return (
    <AdminDashboardClient
      realStats={realStats}
      sellerRankings={sellerRankings}
      initialKycUsers={kycUsers}
    />
  );
}
