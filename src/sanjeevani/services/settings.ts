/**
 * User-supplied OpenRouter API key handling.
 *
 * The original repo committed a hardcoded key. On Enter there is no `.env`
 * support and we must not commit secrets, so the key is stored in
 * localStorage (entered via the Settings nav item) and read here at call time.
 */

export const OPENROUTER_KEY_STORAGE = "sanjeevani_openrouter_key";

export function getOpenRouterKey(): string {
  try {
    return localStorage.getItem(OPENROUTER_KEY_STORAGE)?.trim() ?? "";
  } catch {
    return "";
  }
}

export function setOpenRouterKey(key: string): void {
  try {
    if (key.trim()) {
      localStorage.setItem(OPENROUTER_KEY_STORAGE, key.trim());
    } else {
      localStorage.removeItem(OPENROUTER_KEY_STORAGE);
    }
  } catch {
    /* ignore */
  }
}

/** Thrown when an AI call is attempted without a configured key. */
export class MissingApiKeyError extends Error {
  constructor() {
    super(
      "Add your OpenRouter API key in Settings before running AI actions.",
    );
    this.name = "MissingApiKeyError";
  }
}
