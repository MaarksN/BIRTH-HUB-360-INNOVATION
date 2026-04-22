const supportedSessionActions = ["signin", "signout", "refresh", "mfa", "session"] as const;

export function isSupportedSessionAction(action: string | undefined): boolean {
  return supportedSessionActions.includes((action ?? "") as (typeof supportedSessionActions)[number]);
}
