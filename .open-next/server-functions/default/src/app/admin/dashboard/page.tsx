import AdminDashboardClient from "./AdminDashboardClient";
import {
  getJsonAdminReports,
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
  let adminReports: Awaited<ReturnType<typeof getJsonAdminReports>> = {
    generatedAt: new Date().toISOString(),
    summary: {
      productsCount: 0,
      buyersCount: 0,
      sellersCount: 0,
      totalRequests: 0,
      activeRequests: 0,
      completedOrders: 0,
      failedOrders: 0,
    },
    productReports: [],
    buyerReports: [],
    sellerReports: [],
    analytics: {
      growingItems: [],
      mostRequestedItems: [],
      highestRevenueItems: [],
      technicalItems: [],
    },
  };
  try {
    [realStats, sellerRankings, kycUsers, adminReports] = await Promise.all([
      getJsonAdminStats(),
      getJsonSellerRankings(),
      getJsonKycUsers(),
      getJsonAdminReports(),
    ]);
  } catch (error) {
    console.error("JSON admin stats/rankings/KYC error:", error);
  }

  return (
    <AdminDashboardClient
      realStats={realStats}
      sellerRankings={sellerRankings}
      initialKycUsers={kycUsers}
      adminReports={adminReports}
    />
  );
}
