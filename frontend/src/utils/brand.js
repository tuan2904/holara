// Preserve legacy plan identifiers in requests; only change their display names.
export function displayPlanName(name) {
  return String(name || '').replace(/holora[ _]?(free|plus)/gi, (_, tier) =>
    `MeDecode ${tier[0].toUpperCase()}${tier.slice(1).toLowerCase()}`);
}
