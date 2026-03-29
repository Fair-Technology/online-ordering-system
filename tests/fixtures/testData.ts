// This is the fake response for GET /api/shops
// The shape must match what your real API returns: { shops: [...] }

export const mockShops = {
  shops: [
    {
      id: 'shop-001',
      name: 'Burger Palace',
      slug: 'burger-palace',
      branding: {
        logoUrl: 'https://placehold.co/64x64?text=BP',
        primaryColor: '#FF8C32',
        secondaryColor: '#2C2C2C',
      },
    },
    {
      id: 'shop-002',
      name: 'Pizza Heaven',
      slug: 'pizza-heaven',
      branding: {
        logoUrl: 'https://placehold.co/64x64?text=PH',
        primaryColor: '#E63946',
        secondaryColor: '#1D3557',
      },
    },
  ],
};

// Shortcuts — easier to use in tests than writing mockShops.shops[0] every time
export const firstMockShop = mockShops.shops[0]; //Burger Palace
export const secondMockShop = mockShops.shops[1]; //Pizza Heaven
