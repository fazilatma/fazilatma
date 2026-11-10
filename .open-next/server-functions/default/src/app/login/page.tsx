import type { Metadata } from "next";
import LoginFormClient from "./LoginFormClient";
import { buildSeoMetadata } from "@/lib/seo";

export const metadata: Metadata = buildSeoMetadata({
  title: "ورود به حساب | OptiBid",
  description: "ورود خریداران، فروشندگان و مدیر سامانه به پنل OptiBid.",
  path: "/login",
});

export default function LoginPage() {
  return <LoginFormClient />;
}
