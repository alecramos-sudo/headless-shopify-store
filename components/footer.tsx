import Link from "next/link";

export function Footer() {
  return (
    <footer className="bg-brand-slate text-white/70 py-16">
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-12">
        <div>
          <h3 className="font-display text-white text-lg mb-4">Headless Store</h3>
          <p className="text-sm leading-relaxed">
            A learning build exploring headless Shopify with Next.js.
          </p>
        </div>
        <div>
          <h4 className="text-white text-sm font-medium mb-4">Shop</h4>
          <ul className="space-y-2 text-sm">
            <li><Link href="/products/the-mantle" className="hover:text-white transition-colors">The Mantle</Link></li>
            <li><Link href="/products/the-mantle-mini" className="hover:text-white transition-colors">The Mantle Mini</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-white text-sm font-medium mb-4">Info</h4>
          <ul className="space-y-2 text-sm">
            <li><Link href="/about" className="hover:text-white transition-colors">About</Link></li>
            <li><Link href="/policies/faq" className="hover:text-white transition-colors">FAQ</Link></li>
            <li><Link href="/policies/shipping" className="hover:text-white transition-colors">Shipping</Link></li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
