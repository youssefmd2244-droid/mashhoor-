import { getSetting, setSetting, saveItem } from './store';
import type { Customer } from './types';

const PROFILE_KEY = 'customer.myProfile';

// The logged-in *visitor's* own saved profile (name/phone/address), kept on
// this device so they never have to re-type it for future orders.
export async function getMyProfile(): Promise<Customer | null> {
  return getSetting<Customer | null>(PROFILE_KEY, null);
}

export async function saveMyProfile(data: { name: string; phone: string; address: string }): Promise<Customer> {
  const existing = await getMyProfile();
  const customer: Customer = {
    id: existing?.id ?? crypto.randomUUID(),
    name: data.name,
    phone: data.phone,
    address: data.address,
    createdAt: existing?.createdAt ?? new Date().toISOString(),
  };
  await setSetting(PROFILE_KEY, customer);
  // Also keep a record in the admin's customers list so the restaurant can
  // see everyone who has registered.
  await saveItem('customers', customer);
  return customer;
}
