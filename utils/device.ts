/** True on iPhone, iPad, iPod, and iPadOS (MacIntel + touch). */
export function isIOS(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  return (
    /iPad|iPhone|iPod/.test(ua) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
}

export function isAndroid(): boolean {
  if (typeof navigator === "undefined") return false;
  return /Android/i.test(navigator.userAgent);
}

/** Phones and tablets where touch + front camera is the primary input. */
export function isMobileOrTablet(): boolean {
  if (typeof window === "undefined") return false;
  if (isIOS() || isAndroid()) return true;
  return window.matchMedia("(max-width: 1024px) and (pointer: coarse)").matches;
}

/** iOS Safari blocks getUserMedia unless triggered by a direct user tap. */
export function requiresCameraUserGesture(): boolean {
  return isMobileOrTablet();
}

export function supportsDocumentFullscreen(): boolean {
  if (typeof document === "undefined") return false;
  return (
    typeof document.documentElement.requestFullscreen === "function" &&
    !isIOS()
  );
}

export function isSecureCameraContext(): boolean {
  if (typeof window === "undefined") return false;
  return window.isSecureContext;
}

export function deviceLabel(): string {
  if (isIOS()) return "iPhone / iPad";
  if (isAndroid()) return "Android";
  return "Computer";
}
