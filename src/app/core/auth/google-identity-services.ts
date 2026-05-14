/**
 * Google Identity Services (GIS) must call `google.accounts.id.initialize` at most once
 * per page load for a given client ID. Multiple Angular entry points (sign-in page, login
 * modal) register credential handlers on a stack so the topmost UI receives the JWT.
 */

declare let google: any;

const credentialHandlerStack: Array<(response: { credential?: string }) => void> = [];

let gsiInitialized = false;
let gsiClientIdUsed = '';

export function registerGoogleCredentialHandler(
  handler: (response: { credential?: string }) => void
): void {
  credentialHandlerStack.push(handler);
}

export function unregisterGoogleCredentialHandler(
  handler: (response: { credential?: string }) => void
): void {
  for (let i = credentialHandlerStack.length - 1; i >= 0; i--) {
    if (credentialHandlerStack[i] === handler) {
      credentialHandlerStack.splice(i, 1);
      return;
    }
  }
}

function dispatchCredential(response: { credential?: string }): void {
  const top = credentialHandlerStack[credentialHandlerStack.length - 1];
  top?.(response);
}

/**
 * @returns true when GIS is available and initialize succeeded (or was already done for this client ID).
 */
export function ensureGoogleIdentityServicesInitialized(clientId: string): boolean {
  const trimmed = (clientId || '').trim();
  if (!trimmed || typeof google === 'undefined' || !google?.accounts?.id) {
    return false;
  }
  if (gsiInitialized && gsiClientIdUsed === trimmed) {
    return true;
  }
  try {
    google.accounts.id.initialize({
      client_id: trimmed,
      callback: (response: { credential?: string }) => dispatchCredential(response),
      auto_select: false,
      cancel_on_tap_outside: true,
    });
    gsiInitialized = true;
    gsiClientIdUsed = trimmed;
    return true;
  } catch {
    return false;
  }
}

/**
 * GIS expects button width in pixels (not CSS strings like "100%").
 */
export function resolveGoogleButtonWidthPx(
  container: HTMLElement | null,
  min = 240,
  max = 400
): number {
  const raw = container?.offsetWidth;
  const w = typeof raw === 'number' && raw > 0 ? raw : 320;
  return Math.min(max, Math.max(min, Math.floor(w)));
}

export function renderGoogleSignInButton(
  container: HTMLElement | null,
  overrides: Partial<{ theme: string; size: string; text: string; type: string }> = {}
): boolean {
  if (!container || typeof google === 'undefined' || !google?.accounts?.id) {
    return false;
  }
  container.innerHTML = '';
  const widthPx = resolveGoogleButtonWidthPx(container);
  try {
    google.accounts.id.renderButton(container, {
      theme: overrides.theme ?? 'outline',
      size: overrides.size ?? 'large',
      text: overrides.text ?? 'signin_with',
      width: widthPx,
      type: overrides.type ?? 'standard',
    });
    return true;
  } catch {
    return false;
  }
}
