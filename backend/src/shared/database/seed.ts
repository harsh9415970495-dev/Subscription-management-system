import * as argon2 from 'argon2';
import postgres from 'postgres';
import { CONFIG } from '../config';

async function seed() {
  console.log('[Seed] Connecting to database:', CONFIG.databaseUrlDirect);
  const sql = postgres(CONFIG.databaseUrlDirect, { max: 1 });

  try {
    const adminPasswordHash = await argon2.hash('Admin123!@#', { type: argon2.argon2id });
    const staffPasswordHash = await argon2.hash('Staff123!@#', { type: argon2.argon2id });
    const customerPasswordHash = await argon2.hash('Customer123!@#', { type: argon2.argon2id });

    // 1. Seed Administrator
    await sql`
      INSERT INTO identity.users (email, password_hash, role, status)
      VALUES ('admin@brightloop.local', ${adminPasswordHash}, 'ADMIN', 'ACTIVE')
      ON CONFLICT (email) DO NOTHING;
    `;
    console.log('[Seed] Admin user seeded: admin@brightloop.local');

    // 2. Seed Staff
    await sql`
      INSERT INTO identity.users (email, password_hash, role, status)
      VALUES 
        ('staff1@brightloop.local', ${staffPasswordHash}, 'STAFF', 'ACTIVE'),
        ('staff2@brightloop.local', ${staffPasswordHash}, 'STAFF', 'ACTIVE')
      ON CONFLICT (email) DO NOTHING;
    `;
    console.log('[Seed] Staff users seeded (staff1, staff2)');

    // 3. Seed 5 Customers
    const sampleCustomers = [
      {
        name: 'John Doe',
        companyName: 'Acme Corporation',
        phone: '+91 98765 00001',
        billingAddress: JSON.stringify({ street: '100 Outer Ring Rd', city: 'Bengaluru', state: 'Karnataka', postalCode: '560103', country: 'IN' }),
        taxId: '29ABCDE1234F1Z5',
        email: 'john@acme.com',
      },
      {
        name: 'Sarah Connor',
        companyName: 'Cyberdyne Systems',
        phone: '+91 98765 00002',
        billingAddress: JSON.stringify({ street: '45 Tech Hub', city: 'Pune', state: 'Maharashtra', postalCode: '411057', country: 'IN' }),
        taxId: '27AABCC5678H1Z1',
        email: 'sarah@cyberdyne.com',
      },
      {
        name: 'Tony Stark',
        companyName: 'Stark Labs India',
        phone: '+91 98765 00003',
        billingAddress: JSON.stringify({ street: '77 Cyber Towers', city: 'Hyderabad', state: 'Telangana', postalCode: '500081', country: 'IN' }),
        taxId: '36AAACE9999M1Z9',
        email: 'tony@starklabs.com',
      },
      {
        name: 'Bruce Wayne',
        companyName: 'Wayne Industries',
        phone: '+91 98765 00004',
        billingAddress: JSON.stringify({ street: '12 Connaught Place', city: 'New Delhi', state: 'Delhi', postalCode: '110001', country: 'IN' }),
        taxId: '07AAACW1111Q1ZP',
        email: 'bruce@wayne.com',
      },
      {
        name: 'Hank Scorpio',
        companyName: 'Globex Corporation',
        phone: '+91 98765 00005',
        billingAddress: JSON.stringify({ street: '22 BKC Complex', city: 'Mumbai', state: 'Maharashtra', postalCode: '400051', country: 'IN' }),
        taxId: '27AAACG2222K1ZL',
        email: 'hank@globex.com',
      },
    ];

    for (const c of sampleCustomers) {
      // Check customer user
      const existingUser = await sql`
        SELECT id FROM identity.users WHERE email = ${c.email};
      `;

      if (existingUser.length === 0) {
        const [customer] = await sql`
          INSERT INTO customers.customers (name, company_name, phone, billing_address, tax_id)
          VALUES (${c.name}, ${c.companyName}, ${c.phone}, ${c.billingAddress}::jsonb, ${c.taxId})
          RETURNING id;
        `;

        const [newUser] = await sql`
          INSERT INTO identity.users (email, password_hash, role, status, customer_id)
          VALUES (${c.email}, ${customerPasswordHash}, 'CUSTOMER', 'ACTIVE', ${customer.id})
          RETURNING id;
        `;

        await sql`
          UPDATE customers.customers SET user_id = ${newUser.id} WHERE id = ${customer.id};
        `;
      }
    }

    console.log('[Seed] 5 Customers and associated user accounts seeded.');
    console.log('[Seed] Seeding completed cleanly.');
  } catch (err) {
    console.warn('[Seed] Notice during seed (e.g. database not running or already seeded):', (err as Error).message);
  } finally {
    await sql.end();
  }
}

seed();
