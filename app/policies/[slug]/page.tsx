import { notFound } from "next/navigation";
import type { Metadata } from "next";

const policies: Record<string, { title: string; paragraphs: string[] }> = {
  faq: {
    title: "FAQ",
    paragraphs: [
      "How long does shipping take? Orders typically arrive within 5-7 business days worldwide.",
      "What is your return policy? We offer a 30-day money-back guarantee on all products.",
      "Are your products cruelty-free? Yes, all our products are cruelty-free and vegan.",
    ],
  },
  shipping: {
    title: "Shipping Policy",
    paragraphs: [
      "We offer free worldwide shipping on all orders. Orders are processed within 1-2 business days.",
    ],
  },
  refund: {
    title: "Refund Policy",
    paragraphs: [
      "If you're not satisfied, contact us within 30 days for a full refund.",
    ],
  },
  privacy: {
    title: "Privacy Policy",
    paragraphs: [
      "We collect minimal data necessary to process your orders. We never sell your personal information.",
    ],
  },
  terms: {
    title: "Terms of Service",
    paragraphs: [
      "By using this site, you agree to our terms of service. This is a demo store for educational purposes.",
    ],
  },
};

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const policy = policies[slug];
  if (!policy) return { title: "Not Found" };
  return { title: policy.title };
}

export async function generateStaticParams() {
  return Object.keys(policies).map((slug) => ({ slug }));
}

export default async function PolicyPage({ params }: Props) {
  const { slug } = await params;
  const policy = policies[slug];
  if (!policy) notFound();

  return (
    <div className="max-w-3xl mx-auto px-6 py-24">
      <h1 className="font-display text-4xl mb-8">{policy.title}</h1>
      <div className="space-y-4 text-lg text-brand-muted leading-relaxed">
        {policy.paragraphs.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </div>
    </div>
  );
}
