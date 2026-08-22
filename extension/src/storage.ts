/// <reference types="chrome" />

function hasExtensionStorage(): boolean {
  return typeof chrome !== "undefined" && Boolean(chrome.storage?.local);
}

export async function readLocalValue<T>(key: string): Promise<T | null> {
  if (hasExtensionStorage()) {
    const values = await chrome.storage.local.get(key);
    return (values[key] as T | undefined) ?? null;
  }

  const raw = window.localStorage.getItem(key);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export async function writeLocalValue<T>(key: string, value: T): Promise<void> {
  if (hasExtensionStorage()) {
    await chrome.storage.local.set({ [key]: value });
    return;
  }

  window.localStorage.setItem(key, JSON.stringify(value));
}

export async function removeLocalValue(key: string): Promise<void> {
  if (hasExtensionStorage()) {
    await chrome.storage.local.remove(key);
    return;
  }

  window.localStorage.removeItem(key);
}

export function getExtensionAssetUrl(path: string): string {
  if (typeof chrome !== "undefined" && chrome.runtime?.getURL) {
    return chrome.runtime.getURL(path.replace(/^\//, ""));
  }

  return path.startsWith("/") ? path : `/${path}`;
}
