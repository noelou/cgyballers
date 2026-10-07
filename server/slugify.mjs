// Turns a name into an id-friendly slug: "River Kings" -> "river-kings".
// Used for new team and player ids.
export function slugify(str) {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}
