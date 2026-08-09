import { getSetting, setSetting } from './store';

export interface ComplaintNumber {
  id: string;
  labelAr: string; // e.g. "خط الشكاوي"
  labelEn: string;
  phone: string; // digits only, with country code, e.g. 201094555299
  whatsapp: boolean; // also show a WhatsApp button, not just call
}

const KEY = 'settings.complaintNumbers';
const DEFAULT: ComplaintNumber[] = [];

export async function getComplaintNumbers(): Promise<ComplaintNumber[]> {
  return getSetting<ComplaintNumber[]>(KEY, DEFAULT);
}

export async function setComplaintNumbers(v: ComplaintNumber[]): Promise<void> {
  await setSetting(KEY, v);
}
