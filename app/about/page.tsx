import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About",
  description: "About our brand and mission.",
};

export default function AboutPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-24">
      <h1 className="font-display text-4xl mb-8">About</h1>
      <div className="space-y-4 text-lg text-brand-muted leading-relaxed">
        <p>
          We believe skincare should be simple, effective, and backed by science.
          Our formulations focus on barrier repair and deep hydration.
        </p>
        <p>
          This is a learning build exploring headless Shopify architecture with
          Next.js, inspired by moumoujus.com.
        </p>
      </div>
    </div>
  );
}
