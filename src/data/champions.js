// League champions by season, shown on the History page (newest first there).
// Team names are plain text: past champions aren't necessarily teams in the
// current season's database. Add the next season's champion to the end.
// Photos live in public/champions/ as WebP (not public/history/: a folder
// named like a page breaks that page in production).
// Photos are cropped to 16:9. `focus` (optional, CSS object-position) picks
// which part of a taller photo stays visible; the default is the middle.
// `fullPhoto` is the larger, uncropped version shown when a photo is tapped;
// it only loads then, so the page stays light.
export const CHAMPIONS = [
  { season: 1, team: 'GLQ', photo: '/champions/season-1.webp', fullPhoto: '/champions/season-1-full.webp' },
  {
    season: 2,
    team: 'Jacque Jons',
    photo: '/champions/season-2.webp',
    fullPhoto: '/champions/season-2-full.webp',
  },
  {
    season: 3,
    team: 'Jacque Jons',
    photo: '/champions/season-3.webp',
    fullPhoto: '/champions/season-3-full.webp',
    focus: 'center 80%',
  },
]
