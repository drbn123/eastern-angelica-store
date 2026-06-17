import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Track your order",
  description: "Find and track your KUZKO order.",
};

export default function TrackLayout({ children }: { children: React.ReactNode }) {
  return children;
}
