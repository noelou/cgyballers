// Sum a set of box-score lines into a single totals line.
export function sumLines(lines) {
  const t = { pts: 0, reb: 0, ast: 0, blk: 0, stl: 0, tpa: 0, tpm: 0, fta: 0, ftm: 0 }
  for (const l of lines) {
    for (const k of Object.keys(t)) t[k] += l[k] ?? 0
  }
  return t
}
