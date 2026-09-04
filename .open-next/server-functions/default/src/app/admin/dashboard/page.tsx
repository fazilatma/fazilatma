import AdminDashboardClient from "./AdminDashboardClient";
import {
  getJsonAdminReports,
  getJsonAdminStats,
  getJsonAdminUsers,
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
  let adminUsers: Awaited<ReturnType<typeof getJsonAdminUsers>> = {
    summary: {
      buyersCount: 0,
      sellersCount: 0,
      activeUsersCount: 0,
      pendingKycCount: 0,
      blockedUsersCount: 0,
      socialUsersCount: 0,
    },
    users: [],
  };
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
    [realStats, sellerRankings, kycUsers, adminUsers, adminReports] =
      await Promise.all([
        getJsonAdminStats(),
        getJsonSellerRankings(),
        getJsonKycUsers(),
        getJsonAdminUsers(),
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
      initialManagedUsers={adminUsers}
      adminReports={adminReports}
    />
  );
}
