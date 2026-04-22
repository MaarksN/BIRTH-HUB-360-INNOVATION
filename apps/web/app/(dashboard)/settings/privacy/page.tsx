import { getProductCapabilities } from "../../../../lib/product-capabilities";

export default async function PrivacySettingsPage() {
  const capabilities = getProductCapabilities();

  if (!capabilities.privacyAdvancedEnabled) {
    const { default: PrivacySelfServicePageClient } = await import("./privacy-self-service-page");
    return <PrivacySelfServicePageClient />;
  }

  const { default: PrivacySettingsPageClient } = await import("./privacy-settings-page");
  return <PrivacySettingsPageClient />;
}

