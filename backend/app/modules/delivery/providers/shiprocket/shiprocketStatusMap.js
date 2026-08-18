import { providerStatusToWorkflowStatus } from "../../deliveryStatusMapping.js";

/**
 * Normalizes Shiprocket status strings or status codes into canonical WORKFLOW_STATUS
 */
export function mapShiprocketStatus(providerStatus) {
  return providerStatusToWorkflowStatus("shiprocket", providerStatus);
}
