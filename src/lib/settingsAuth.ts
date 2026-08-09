import { getSetting, setSetting } from './store';

const LOGIN_PASSWORD_KEY = 'settings.loginPassword';
const DEFAULT_LOGIN_PASSWORD = '20042007';

// Master password required to CHANGE the login password above.
// This one is fixed and is not itself changeable from the UI (a safety net
// so the settings panel can never be permanently locked out).
export const MASTER_PASSWORD = 'Yo2004';

export async function getLoginPassword(): Promise<string> {
  return getSetting(LOGIN_PASSWORD_KEY, DEFAULT_LOGIN_PASSWORD);
}

export async function checkLoginPassword(input: string): Promise<boolean> {
  const current = await getLoginPassword();
  return input === current;
}

export async function changeLoginPassword(masterPassword: string, newPassword: string): Promise<boolean> {
  if (masterPassword !== MASTER_PASSWORD) return false;
  if (!newPassword || newPassword.length < 4) return false;
  await setSetting(LOGIN_PASSWORD_KEY, newPassword);
  return true;
}
