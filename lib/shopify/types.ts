export type Money = {
  amount: string;
  currencyCode: string;
};

export type Image = {
  url: string;
  altText: string | null;
  width: number;
  height: number;
};

export type ProductVariant = {
  id: string;
  title: string;
  availableForSale: boolean;
  price: Money;
  image: Image | null;
};

export type Product = {
  id: string;
  handle: string;
  title: string;
  description: string;
  descriptionHtml: string;
  featuredImage: Image | null;
  priceRange: {
    minVariantPrice: Money;
    maxVariantPrice: Money;
  };
  variants: {
    edges: Array<{ node: ProductVariant }>;
  };
  images: {
    edges: Array<{ node: Image }>;
  };
};

export type CartLineItem = {
  id: string;
  quantity: number;
  merchandise: {
    id: string;
    title: string;
    product: {
      title: string;
      handle: string;
      featuredImage: Image | null;
    };
    price: Money;
    image: Image | null;
  };
};

export type Cart = {
  id: string;
  checkoutUrl: string;
  totalQuantity: number;
  cost: {
    totalAmount: Money;
    subtotalAmount: Money;
  };
  lines: {
    edges: Array<{ node: CartLineItem }>;
  };
};
