// Real/chosen name inside the apartment chat, pseudonym everywhere else
// (building, stairwell, floor scoped chats and the building feed).
export function displayNameFor(
  tenant: { name: string; pseudonym: string | null },
  scope: 'unit' | 'building' | 'stairwell' | 'floor',
): string {
  if (scope === 'unit') return tenant.name;
  return tenant.pseudonym ?? tenant.name;
}
