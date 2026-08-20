export const shopifyResourceFixtures = {
  product: {
    resourceType: "product",
    id: "gid://shopify/Product/100000000001",
    title: "Fixture Product",
    handle: "fixture-product",
    image: "https://cdn.shopify.com/s/files/fixture/product.png"
  },
  collection: {
    resourceType: "collection",
    id: "gid://shopify/Collection/200000000002",
    title: "Fixture Collection",
    handle: "fixture-collection",
    image: "https://cdn.shopify.com/s/files/fixture/collection.png"
  },
  variant: {
    resourceType: "variant",
    id: "gid://shopify/ProductVariant/300000000003",
    title: "Fixture Variant",
    handle: "fixture-variant",
    image: "https://cdn.shopify.com/s/files/fixture/variant.png"
  },
  unresolved: {
    resourceType: "product",
    id: "gid://shopify/Product/100000000099",
    title: "Unavailable fixture product",
    handle: "unavailable-fixture-product"
  }
} as const;

export const invalidShopifyResourceFixtures = {
  bareNumericId: {
    resourceType: "product",
    id: "100000000001"
  },
  wrongTypeGid: {
    resourceType: "product",
    id: "gid://shopify/Collection/200000000002"
  },
  arbitraryObject: {
    resourceType: "product",
    id: "gid://shopify/Product/100000000001",
    apiResponse: { inventory: 10, accessToken: "fixture-token-must-not-persist" }
  }
} as const;
