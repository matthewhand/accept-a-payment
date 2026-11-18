import {API_URL} from './Config';

export async function fetchPublishableKey(): Promise<string | null> {
  try {
    const response = await fetch(`${API_URL}/config`);
    if (!response.ok) {
      return null;
    }

    const {publishableKey} = await response.json();
    return typeof publishableKey === 'string' && publishableKey
      ? publishableKey
      : null;
  } catch {
    return null;
  }
}
