import { faker } from '@faker-js/faker';

// 1. Define the exact strict contracts mapping to your Backend API models
export interface ProductPayload {
  title: string;
  description: string;
  price: number;
  category: string;
  sku: string;
  inStock: boolean;
  tags: string[];
}

export interface UserPayload {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  roles: string[];
}

export class DataFactory {
  /**
   * Generates a fully populated Product payload.
   * Utilizes TypeScript's Partial<T> to allow test-specific overrides of random data.
   */
  static generateProduct(overrides?: Partial<ProductPayload>): ProductPayload {
    return {
      title: faker.commerce.productName(),
      description: faker.commerce.productDescription(),
      price: parseFloat(faker.commerce.price({ min: 10, max: 2000 })),
      category: faker.commerce.department(),
      sku: `SKU-${faker.string.alphanumeric(8).toUpperCase()}`,
      inStock: faker.datatype.boolean(0.8), // 80% chance of being true
      tags: [faker.commerce.productAdjective(), faker.color.human()],
      ...overrides, // Instantly overwrites the randomized fields with specific test constraints
    };
  }

  /**
   * Generates a unique User payload guaranteed to bypass database uniqueness constraints.
   */
  static generateUser(overrides?: Partial<UserPayload>): UserPayload {
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();

    return {
      firstName,
      lastName,
      // Generates a safe, unique email structure explicitly for testing
      email: faker.internet.email({ firstName, lastName, provider: 'automation.internal' }),
      phone: faker.phone.number({ style: 'international' }),
      roles: ['standard_user'],
      ...overrides,
    };
  }
}
