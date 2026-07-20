/**
 * Landing photo registry — trimmed to essentials.
 *
 * Files expected under /public/monuments/. Missing files fall back to a
 * warm gradient with a Landmark icon — layout stays intact either way.
 *
 * Photo sourcing: Wikimedia Commons (CC BY-SA). Attribution is baked into
 * the landing footer.
 */

const path = (filename) => `/monuments/${filename}`;

export const HERO = {
  src: path('taj-mahal-hero.jpg'),
  alt: 'The Taj Mahal at dawn, viewed across the reflecting pool',
};

/** One photograph anchors each of the two national registers. */
export const REGISTER_PHOTOS = {
  bhs: {
    src: path('built-heritage-example.jpg'),
    alt: 'Kailasa Temple, Ellora — rock-cut architecture, 8th century',
  },
  antiquity: {
    src: path('antiquity-example.jpg'),
    alt: 'Chola bronze Nataraja — cast metal antiquity, 11th century',
  },
};
