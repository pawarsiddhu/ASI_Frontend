/**
 * Guided stories — short tours where the map moves step by step.
 *
 * Each step starts from a CLEAN map (all filters reset) and applies its own
 * filters / layers, then focuses a site by title, an area by bounds, or a
 * dynamic target. Text is a DRAFT for the demo, not ASI-verified.
 *
 * Step shape:
 *   { title, text | text(ctx), filters?, layers?, bounds?, site?, focus? }
 *     site:  a BHS title → selected + map flies there
 *     focus: 'farthest-object' → the antiquity found farthest from its museum
 */

const MAHARASHTRA = [[72.4, 15.6], [80.9, 22.1]];
const INDIA = [[68, 7], [97.5, 35.5]];
const GANGA_PLAIN = [[76, 22], [89, 28.5]];

export const STORIES = [
  {
    id: 'caves',
    title: 'Carved from rock: the caves of Maharashtra',
    blurb: 'A thousand years of halls and shrines cut straight into the cliffs.',
    steps: [
      {
        title: 'Hills made for carving',
        text: 'The basalt hills of the western Deccan made Maharashtra a centre of rock-cut architecture. For about a thousand years, monks and later Hindu and Jain patrons cut prayer halls, monasteries and temples directly into the rock.',
        filters: { category: 'B03', state: 'Maharashtra' },
        bounds: MAHARASHTRA,
      },
      {
        title: 'Karla: on the trade routes',
        text: "Karla's great prayer hall, cut around the turn of the Common Era, sits on a pass between the coast and the Deccan plateau. Inscriptions record gifts from traders who used these routes.",
        filters: { category: 'B03', state: 'Maharashtra' },
        site: 'Karla Chaitya',
      },
      {
        title: 'Kanheri: a monastery in the city',
        text: 'Inside present-day Mumbai, Kanheri grew into a large Buddhist settlement of more than a hundred caves, used over many centuries.',
        filters: { category: 'B03', state: 'Maharashtra' },
        site: 'Kanheri Caves',
      },
      {
        title: 'Ajanta: painted walls',
        text: 'Ajanta was cut in two phases, centuries apart. Its later caves, from around the 5th century CE, are famous for paintings telling stories of the Buddha’s lives.',
        filters: { category: 'B03', state: 'Maharashtra' },
        site: 'Ajanta Caves',
      },
      {
        title: 'Elephanta: Shiva in the harbour',
        text: 'By the 6th century, Hindu patrons were carving too. Elephanta, on an island off Mumbai, is dedicated mainly to Shiva.',
        filters: { category: 'B03', state: 'Maharashtra' },
        site: 'Elephanta Caves',
      },
      {
        title: 'Ellora: three faiths, one cliff',
        text: 'Ellora brings Buddhist, Hindu and Jain caves together along one escarpment. Its Kailasa temple was carved from the top down out of a single mass of rock.',
        filters: { category: 'B03', state: 'Maharashtra' },
        site: 'Ellora Caves',
      },
    ],
  },
  {
    id: 'buddhist',
    title: 'Following Buddhist sites through time',
    blurb: 'From Mauryan stupas to the great monastic universities.',
    steps: [
      {
        title: 'Buddhist sites in the register',
        text: 'Every Buddhist site in the register, coloured by period. Most early ones cluster in the Ganga plains and central India; later ones spread along trade routes.',
        filters: { affiliations: ['C01'] },
        layers: { showAnt: false },
        bounds: INDIA,
      },
      {
        title: 'Bairat: the Mauryan beginnings',
        text: 'Under the Mauryan emperor Ashoka (3rd century BCE), Buddhism gained royal support. Bairat in Rajasthan has a monastery and a circular shrine from this time.',
        filters: { affiliations: ['C01'] },
        layers: { showAnt: false },
        site: 'Bairat Buddhist monastery',
      },
      {
        title: 'Sanchi: the Great Stupa',
        text: 'Sanchi’s Great Stupa was first built in Ashoka’s time and enlarged over the next centuries. Its stone gateways are covered in carved stories.',
        filters: { affiliations: ['C01'] },
        layers: { showAnt: false },
        site: 'Great Stupa, Sanchi',
      },
      {
        title: 'Sarnath: the first sermon',
        text: 'Sarnath is where the Buddha is believed to have first taught. The Dhamek Stupa standing today largely dates to the Gupta period.',
        filters: { affiliations: ['C01'] },
        layers: { showAnt: false },
        site: 'Dhamek Stupa, Sarnath',
      },
      {
        title: 'Nalanda and Vikramashila: the universities',
        text: 'From around the 5th century, great monastic universities grew up in Bihar, drawing students from across Asia. Vikramashila was founded later under the Pala kings.',
        filters: { affiliations: ['C01'] },
        layers: { showAnt: false },
        site: 'Nalanda Mahavihara',
      },
      {
        title: 'Now watch it move',
        text: 'Press ▶ on the time slider below to watch Buddhist sites appear century by century. You can do this with any filter.',
        filters: { affiliations: ['C01'] },
        layers: { showAnt: false },
        bounds: GANGA_PLAIN,
      },
    ],
  },
  {
    id: 'dispersal',
    title: 'Where objects end up',
    blurb: 'Findspots, museums and the distances in between.',
    demoNote: 'Uses invented demo objects.',
    steps: [
      {
        title: 'Where they were found',
        text: 'Each small dot is the place an antiquity was found. Objects whose findspot was never recorded can’t be shown here at all — a common gap in old collections.',
        layers: { showBhs: false, antMode: 'found' },
        bounds: INDIA,
      },
      {
        title: 'Where they are kept now',
        text: 'The same objects grouped by the museum holding them today. Bubble size is the number of objects. A few large museums hold material from all over the country.',
        layers: { showBhs: false, antMode: 'held' },
        bounds: INDIA,
      },
      {
        title: 'The journeys',
        text: 'Lines join each findspot to its museum. Short lines mean objects stayed close to home; long ones crossed the country. This view helps researchers study how collections were formed.',
        layers: { showBhs: false, antMode: 'found', dispersal: true },
        bounds: INDIA,
      },
      {
        title: 'The longest journey',
        text: (ctx) => (ctx
          ? `${ctx.title} was found ${ctx.km} from ${ctx.museum}, where it is kept today.`
          : 'No object with a known findspot matches.'),
        layers: { showBhs: false, antMode: 'found', dispersal: true },
        focus: 'farthest-object',
      },
    ],
  },
];
