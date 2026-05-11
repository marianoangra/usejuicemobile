import posthog from 'posthog-js';

export function trackEvent(
  name: string,
  properties?: Record<string, unknown>
) {
  if (typeof window === 'undefined') return;
  if (!posthog.__loaded) return;
  posthog.capture(name, properties);
}

export function identifyUser(
  distinctId: string,
  properties?: Record<string, unknown>
) {
  if (typeof window === 'undefined') return;
  if (!posthog.__loaded) return;
  posthog.identify(distinctId, properties);
}

export function resetUser() {
  if (typeof window === 'undefined') return;
  if (!posthog.__loaded) return;
  posthog.reset();
}
