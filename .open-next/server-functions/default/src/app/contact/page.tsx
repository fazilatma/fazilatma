import ContactClient from "./ContactClient";
import { getLiveContent } from "@/lib/live-content";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function ContactPage() {
  const liveContent = await getLiveContent();

  return <ContactClient initialContent={liveContent} />;
}
