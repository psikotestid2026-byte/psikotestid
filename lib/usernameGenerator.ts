/**
 * Username / default password generation for employees without an email address.
 * Pure functions so the rules are unit tested.
 *
 * Rules:
 *  - A first name that is unique (within the batch and the database) becomes the username.
 *  - A shared first name uses `firstname.secondname` for every holder.
 *  - Any remaining clash gets a numeric suffix.
 *  - Default password: Capitalized first name + year, e.g. "Aziz2026" (easy to remember).
 */

export function slugifyNamePart(text: string): string {
  return String(text || '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

function nameParts(fullName: string): string[] {
  return String(fullName || '')
    .split(/\s+/)
    .map(slugifyNamePart)
    .filter(Boolean);
}

export function buildDefaultPassword(fullName: string, year: number = new Date().getFullYear()): string {
  const first = nameParts(fullName)[0] || 'peserta';
  return `${first.charAt(0).toUpperCase()}${first.slice(1)}${year}`;
}

/**
 * @param fullNames names in import order
 * @param takenUsernames usernames that already exist in the database (lowercase)
 */
export function generateUsernames(fullNames: string[], takenUsernames: Iterable<string> = []): string[] {
  const taken = new Set<string>(Array.from(takenUsernames, (u) => u.toLowerCase()));

  const firstNameCounts = new Map<string, number>();
  for (const name of fullNames) {
    const first = nameParts(name)[0];
    if (first) firstNameCounts.set(first, (firstNameCounts.get(first) || 0) + 1);
  }

  const result: string[] = [];
  for (const name of fullNames) {
    const parts = nameParts(name);
    const first = parts[0] || 'peserta';
    const shared = (firstNameCounts.get(first) || 0) > 1 || taken.has(first);

    const base = shared && parts.length > 1 ? `${first}.${parts[1]}` : first;
    let candidate = base;
    let suffix = 1;
    while (taken.has(candidate)) {
      candidate = `${base}${suffix}`;
      suffix += 1;
    }
    taken.add(candidate);
    result.push(candidate);
  }
  return result;
}

export function syntheticParticipantEmail(username: string): string {
  return `${username}@peserta.psikotest.id`;
}
