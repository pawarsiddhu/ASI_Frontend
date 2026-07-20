import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Landmark, FileText, ShieldCheck, ClipboardCheck,
  ArrowRight, ArrowUpRight, ChevronDown, ChevronLeft, ChevronRight,
  Calendar, ExternalLink, Scale, Layers, Fingerprint,
} from 'lucide-react';

import { HERO, REGISTER_PHOTOS } from './monumentAssets';
import styles from './LandingPage.module.css';

/* ---------- Content — verified from official NMMA and ASI sources ---------- */

const CATEGORIES = [
  {
    n: '01',
    title: 'Sculptures and bronzes',
    body: 'Stone, bronze, and terracotta imagery spanning every major period — from Mauryan yakshas to Chola metal casting to Vijayanagara temple statuary.',
  },
  {
    n: '02',
    title: 'Coins and seals',
    body: 'Numismatic and sigillographic material from punch-marked issues of the early republics through Kushana gold, Gupta coinage, medieval sultanate strikes and Mughal mints; alongside Harappan seals and Buddhist sealings.',
  },
  {
    n: '03',
    title: 'Manuscripts and inscriptions',
    body: 'Texts on palm-leaf, birch bark, copper plate and stone — donative records, land grants, commemorative panels, temple foundation inscriptions, and literary manuscripts in Sanskrit, Prakrit, Tamil, Persian and regional scripts.',
  },
  {
    n: '04',
    title: 'Temples and shrines',
    body: 'Free-standing and rock-cut architecture across traditions — Buddhist chaityas and viharas, Nagara and Dravida temple types, Kalinga, Chalukya and Hoysala regional schools, and later Vijayanagara complexes.',
  },
  {
    n: '05',
    title: 'Forts, palaces and civic works',
    body: 'Hill forts, water forts and walled cities; royal residences from imperial capitals to regional courts; stepwells, ghats, watch-towers, caravanserais and colonial-era administrative buildings.',
  },
  {
    n: '06',
    title: 'Terracotta, ceramics and daily objects',
    body: 'Fired-clay figurines, moulded architectural plaques, ritual and household pottery, glazed wares, lamps, incense burners and everyday utilitarian objects that record the texture of ordinary life.',
  },
];

const EVENTS = [
  {
    date: 'Dec 2, 2024',
    title: 'Regional training-cum-workshop programme',
    location: 'Chandigarh Circle, North Region',
    tag: 'Hybrid',
  },
  {
    date: 'Feb 18, 2026',
    title: 'Documentation manual refresher for museum curators',
    location: 'Delhi Circle',
    tag: 'On-site',
  },
  {
    date: 'Mar 4, 2026',
    title: 'Digitisation drive — Ancient India volumes 12 through 17',
    location: 'Regional online sessions',
    tag: 'Online',
  },
];

const SECTION_IDS = ['mission', 'registers', 'safeguard', 'archive', 'outreach'];

/* ============================== Hooks =============================== */

/** IntersectionObserver-backed tracker for which section is currently in view. */
function useActiveSection(ids) {
  const [active, setActive] = useState(ids[0]);
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        // Prefer the entry closest to the top of the viewport.
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: '-30% 0px -55% 0px', threshold: 0 }
    );
    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [ids]);
  return active;
}

/** Adds a `visible` class on the target element when it enters the viewport. */
function useRevealOnScroll() {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add(styles.visible);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: '0px 0px -60px 0px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return ref;
}

/* ============================== Page ================================= */

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const active = useActiveSection(SECTION_IDS);

  const smoothScrollTo = useCallback((hash) => {
    const el = document.querySelector(hash);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  return (
    <div className={styles.page}>
      <SiteHeader
        scrolled={scrolled}
        active={active}
        onNavClick={smoothScrollTo}
      />

      <Hero onScrollDown={() => smoothScrollTo('#mission')} />

      <MissionStrip />
      <StatsBand />
      <TwoRegisters />
      <Safeguard />
      <ArchiveCarousel />
      <Outreach />
      <SiteFooter onNavClick={smoothScrollTo} />
    </div>
  );
}

/* ============================ Sections =============================== */

function Hero({ onScrollDown }) {
  return (
    <section className={styles.hero}>
      <MonumentImage src={HERO.src} alt={HERO.alt} className={styles.heroImg} />
      <div className={styles.heroOverlay} aria-hidden="true" />
      <div className={styles.heroInner}>
        <div className={styles.heroEyebrow}>
          National Mission on Monuments and Antiquities
        </div>
        <h1 className={styles.heroTitle}>
          The living record of<br />India's tangible heritage
        </h1>
        <p className={styles.heroLead}>
          A pan-India programme of the Archaeological Survey of India, compiling
          the two national registers on which every documented antiquity and
          monument now rests.
        </p>
        <button
          type="button"
          className={styles.scrollDown}
          onClick={onScrollDown}
        >
          <span>Read the mission</span>
          <ChevronDown size={16} className={styles.bounce} aria-hidden="true" />
        </button>
      </div>
    </section>
  );
}

function MissionStrip() {
  const ref = useRevealOnScroll();
  return (
    <section id="mission" className={styles.mission}>
      <div className={`${styles.missionInner} ${styles.reveal}`} ref={ref}>
        <SectionLabel n="01" text="The mission" />
        <p className={styles.missionLead}>
          <span className={styles.dropcap}>N</span>MMA was launched by the
          Ministry of Culture in 2007 to answer a question that had troubled
          conservators, historians and administrators alike: where, exactly, is
          the record of everything we have inherited? For decades that record
          sat scattered across state archaeology departments, museum
          catalogues, university repositories, private holdings and unpublished
          field notes. This portal is the single register that consolidates it.
        </p>
        <div className={styles.pillars}>
          <Pillar
            icon={<FileText size={20} />}
            title="Document"
            body="Every antiquity and heritage site is recorded in a uniform format that survives across circles, museums and generations."
          />
          <Pillar
            icon={<ClipboardCheck size={20} />}
            title="Verify"
            body="Each entry passes through a four-level review before it becomes part of the permanent register — from field officer to Super Admin."
          />
          <Pillar
            icon={<ShieldCheck size={20} />}
            title="Preserve"
            body="Published records are anchored to a permissioned ledger, making every entry tamper-evident and every provenance publicly verifiable."
          />
        </div>
      </div>
    </section>
  );
}

function StatsBand() {
  return (
    <section className={styles.stats}>
      <div className={styles.statsInner}>
        <Stat value="12,47,667" label="Antiquities catalogued nationally" />
        <Stat value="11,406" label="Built-heritage sites documented" />
        <Stat value="1958" label="AMASR Act — monuments and sites" />
        <Stat value="1972" label="AAT Act — antiquities and art treasures" />
      </div>
    </section>
  );
}

function TwoRegisters() {
  const ref = useRevealOnScroll();
  return (
    <section id="registers" className={styles.registers}>
      <div className={`${styles.registersInner} ${styles.reveal}`} ref={ref}>
        <SectionLabel n="02" text="The two national registers" light />
        <h2 className={styles.registersHeadline}>
          Two disciplines,<br />one mission.
        </h2>
        <p className={styles.registersLead}>
          NMMA's core output is not a report or a policy paper. It is two
          national registers — one for what stands on the ground, one for what
          museums and private collections hold. Everything else the mission
          does supports the compilation of these two lists.
        </p>

        <div className={styles.registerPair}>
          <RegisterCard
            eyebrow="Register I"
            title="National Register on Built Heritage and Sites"
            photo={REGISTER_PHOTOS.bhs}
            count="11,406"
            countLabel="sites documented"
            body="A national inventory of unprotected and lesser-known built heritage — the vast majority of India's monuments that fall outside the protection of the ASI's centrally protected list. Compiled from primary field surveys and secondary sources: state archaeology departments, gazetteers, published research."
            includes={[
              'Rock-cut and free-standing temples',
              'Buddhist chaityas, viharas and stupas',
              'Forts, palaces and civic architecture',
              'Mosques, dargahs, churches and synagogues',
              'Stepwells, ghats and water structures',
              'Colonial-era administrative buildings',
              'Memorials, cenotaphs and cemeteries',
            ]}
            act="Ancient Monuments and Archaeological Sites and Remains Act, 1958"
          />
          <RegisterCard
            eyebrow="Register II"
            title="National Register on Antiquities"
            photo={REGISTER_PHOTOS.antiquity}
            count="12,47,667"
            countLabel="antiquities catalogued"
            body="A national inventory of movable antiquities — objects held by public museums, university repositories, private collections and religious institutions. The register is the definitive legal reference against which claims of provenance and legitimacy can be checked."
            includes={[
              'Stone, bronze and terracotta sculpture',
              'Coins, seals, sealings and coin moulds',
              'Manuscripts on palm-leaf, birch and paper',
              'Inscriptions on copper plate and stone',
              'Ivory, wood and bone carvings',
              'Ritual objects, lamps and instruments',
              'Textiles, miniatures and mural fragments',
            ]}
            act="Antiquities and Art Treasures Act, 1972"
          />
        </div>
      </div>
    </section>
  );
}

function Safeguard() {
  const ref = useRevealOnScroll();
  return (
    <section id="safeguard" className={styles.safeguard}>
      <div className={`${styles.safeguardInner} ${styles.reveal}`} ref={ref}>
        <SectionLabel n="03" text="Why the register matters" />
        <figure className={styles.pullquote}>
          <div className={styles.pullquoteMark} aria-hidden="true">"</div>
          <blockquote className={styles.pullquoteText}>
            The register is a landmark step against illicit trafficking and
            against the quiet loss of undocumented heritage.
          </blockquote>
          <figcaption className={styles.pullquoteCite}>
            National Mission on Monuments and Antiquities, foundational mandate
          </figcaption>
        </figure>

        <div className={styles.safeguardBody}>
          <p>
            An antiquity that is nowhere on record can be sold anywhere without
            question, and a monument that no one has documented can be demolished
            without protest. The two registers exist so that neither can happen
            unnoticed. Documented objects and sites carry a legal standing that
            undocumented ones do not; documentation is prevention.
          </p>
        </div>

        <div className={styles.pillars}>
          <Pillar
            icon={<Landmark size={20} />}
            title="AMASR Act, 1958"
            body="Establishes legal protection for ancient monuments, archaeological sites and remains of national importance. Registration under NMMA supports the legal basis for future protection."
          />
          <Pillar
            icon={<Scale size={20} />}
            title="AAT Act, 1972"
            body="Regulates the export, sale and circulation of antiquities and art treasures. A registered antiquity is a legally traceable one; the register is the state's principal safeguard."
          />
          <Pillar
            icon={<Layers size={20} />}
            title="A uniform format"
            body="A single documentation schema across circles, museums, universities and private collections — making the record interoperable, comparable and durable across institutional boundaries."
          />
        </div>
      </div>
    </section>
  );
}

/**
 * ArchiveCarousel — auto-advancing text-driven carousel of documentation
 * categories. No images — the point is the range of what NMMA documents,
 * carried by typography. Auto-advances every 6s; pauses on hover; keyboard
 * accessible.
 */
function ArchiveCarousel() {
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const ref = useRevealOnScroll();

  useEffect(() => {
    if (paused) return;
    const t = setInterval(() => {
      setCurrent((c) => (c + 1) % CATEGORIES.length);
    }, 6000);
    return () => clearInterval(t);
  }, [paused]);

  const go = (i) =>
    setCurrent(((i % CATEGORIES.length) + CATEGORIES.length) % CATEGORIES.length);

  return (
    <section id="archive" className={styles.archive}>
      <div className={`${styles.archiveInner} ${styles.reveal}`} ref={ref}>
        <SectionLabel n="04" text="The scope of the archive" />
        <h2 className={styles.archiveHeadline}>
          The material of a civilisation.
        </h2>
        <p className={styles.archiveLead}>
          What ends up in the two registers spans metal and stone and
          palm-leaf and pigment, and stretches from the third century before
          the common era to the twentieth. A sample of what the format is
          designed to hold.
        </p>

        <div
          className={styles.carousel}
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          <div className={styles.carouselFrame}>
            {CATEGORIES.map((cat, i) => (
              <article
                key={cat.n}
                className={styles.slide}
                data-state={
                  i === current
                    ? 'current'
                    : i === (current - 1 + CATEGORIES.length) % CATEGORIES.length
                    ? 'prev'
                    : i === (current + 1) % CATEGORIES.length
                    ? 'next'
                    : 'hidden'
                }
                aria-hidden={i !== current}
              >
                <div className={styles.slideN}>{cat.n}</div>
                <h3 className={styles.slideTitle}>{cat.title}</h3>
                <p className={styles.slideBody}>{cat.body}</p>
              </article>
            ))}
          </div>

          <div className={styles.carouselControls}>
            <button
              type="button"
              onClick={() => go(current - 1)}
              className={styles.arrowBtn}
              aria-label="Previous category"
            >
              <ChevronLeft size={16} />
            </button>
            <div className={styles.dots} role="tablist" aria-label="Categories">
              {CATEGORIES.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => go(i)}
                  className={styles.dot}
                  data-active={i === current ? 'true' : undefined}
                  aria-label={`Go to category ${i + 1}`}
                  aria-selected={i === current}
                  role="tab"
                />
              ))}
            </div>
            <button
              type="button"
              onClick={() => go(current + 1)}
              className={styles.arrowBtn}
              aria-label="Next category"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

function Outreach() {
  const ref = useRevealOnScroll();
  return (
    <section id="outreach" className={styles.outreach}>
      <div className={`${styles.outreachInner} ${styles.reveal}`} ref={ref}>
        <SectionLabel n="05" text="Outreach and capacity building" />
        <h2 className={styles.outreachHeadline}>
          Training the hands that hold the register.
        </h2>
        <p className={styles.outreachLead}>
          Regional programmes bring circle staff, museum curators, university
          researchers and independent scholars together to standardise
          documentation practice — because the register is only as strong as
          the recording tradition behind it.
        </p>
        <div className={styles.events}>
          {EVENTS.map((ev) => (
            <article key={ev.title} className={styles.event}>
              <div className={styles.eventDate}>
                <Calendar size={13} aria-hidden="true" />
                <span>{ev.date}</span>
              </div>
              <h3 className={styles.eventTitle}>{ev.title}</h3>
              <div className={styles.eventMeta}>
                <span>{ev.location}</span>
                <span className={styles.eventTag}>{ev.tag}</span>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ============================ Building blocks ============================= */

function SectionLabel({ n, text, light }) {
  return (
    <div className={styles.sectionLabel} data-light={light ? 'true' : undefined}>
      <span className={styles.sectionLabelHair} aria-hidden="true" />
      <span className={styles.sectionLabelN}>{n}</span>
      <span className={styles.sectionLabelText}>{text}</span>
    </div>
  );
}

function Pillar({ icon, title, body }) {
  return (
    <div className={styles.pillar}>
      <div className={styles.pillarIcon}>{icon}</div>
      <h3 className={styles.pillarTitle}>{title}</h3>
      <p className={styles.pillarBody}>{body}</p>
    </div>
  );
}

function Stat({ value, label }) {
  return (
    <div className={styles.stat}>
      <div className={styles.statValue}>{value}</div>
      <div className={styles.statLabel}>{label}</div>
    </div>
  );
}

function RegisterCard({ eyebrow, title, photo, count, countLabel, body, includes, act }) {
  return (
    <article className={styles.rcard}>
      <div className={styles.rcardImgWrap}>
        <MonumentImage src={photo.src} alt={photo.alt} className={styles.rcardImg} />
        <div className={styles.rcardImgOverlay} aria-hidden="true" />
      </div>
      <div className={styles.rcardBody}>
        <div className={styles.rcardEyebrow}>{eyebrow}</div>
        <h3 className={styles.rcardTitle}>{title}</h3>
        <div className={styles.rcardCount}>
          <span className={styles.rcardCountValue}>{count}</span>
          <span className={styles.rcardCountLabel}>{countLabel}</span>
        </div>
        <p className={styles.rcardBodyText}>{body}</p>
        <div className={styles.rcardIncludesTitle}>What the register holds</div>
        <ul className={styles.rcardIncludes}>
          {includes.map((it) => (
            <li key={it}>{it}</li>
          ))}
        </ul>
        <div className={styles.rcardAct}>
          <Fingerprint size={12} aria-hidden="true" />
          <span>{act}</span>
        </div>
      </div>
    </article>
  );
}

function MonumentImage({ src, alt, className }) {
  const [failed, setFailed] = useState(false);
  if (failed || !src) {
    return (
      <div className={`${className || ''} ${styles.imgFallback}`} aria-label={alt}>
        <Landmark size={48} aria-hidden="true" />
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={alt}
      className={className}
      loading="lazy"
      onError={() => setFailed(true)}
    />
  );
}

/* ============================== Chrome ================================ */

function SiteHeader({ scrolled, active, onNavClick }) {
  const items = [
    { id: 'mission', label: 'Mission' },
    { id: 'registers', label: 'Registers' },
    { id: 'safeguard', label: 'Safeguard' },
    { id: 'archive', label: 'Archive' },
    { id: 'outreach', label: 'Outreach' },
  ];
  return (
    <header
      className={styles.siteHeader}
      data-scrolled={scrolled ? 'true' : undefined}
    >
      <div className={styles.siteHeaderInner}>
        <div className={styles.brand}>
          <span className={styles.brandMark} aria-hidden="true">A</span>
          <div className={styles.brandText}>
            <div className={styles.brandLine1}>NMMA</div>
            <div className={styles.brandLine2}>Archaeological Survey of India</div>
          </div>
        </div>

        <nav className={styles.siteNav} aria-label="Landing sections">
          {items.map((it) => (
            <a
              key={it.id}
              href={`#${it.id}`}
              onClick={(e) => {
                e.preventDefault();
                onNavClick(`#${it.id}`);
              }}
              data-active={active === it.id ? 'true' : undefined}
            >
              {it.label}
            </a>
          ))}
        </nav>

        <Link to="/login" className={styles.loginBtn}>
          <span>Login</span>
          <ArrowRight size={13} />
        </Link>
      </div>
    </header>
  );
}

function SiteFooter({ onNavClick }) {
  const relatedExternal = [
    { label: 'Archaeological Survey of India', href: 'https://asi.nic.in/' },
    { label: 'Ministry of Culture', href: 'https://indiaculture.gov.in/' },
    { label: 'MyGov', href: 'https://mygov.in/' },
    { label: 'National Portal of India', href: 'https://india.gov.in/' },
  ];
  const portalInternal = [
    { label: 'Staff login', to: '/login' },
    { label: 'The mission', hash: '#mission' },
    { label: 'The two registers', hash: '#registers' },
    { label: 'Outreach and events', hash: '#outreach' },
  ];
  return (
    <footer className={styles.siteFooter}>
      <div className={styles.footerInner}>
        <div className={styles.footerBrand}>
          <div className={styles.footerBrandTitle}>
            National Mission on Monuments and Antiquities
          </div>
          <p className={styles.footerBrandBody}>
            A programme of the Archaeological Survey of India, Ministry of
            Culture, Government of India. Established under the XI Five-Year
            Plan, 2007.
          </p>
        </div>

        <div className={styles.footerCols}>
          <div className={styles.footerCol}>
            <div className={styles.footerColTitle}>Related</div>
            <ul className={styles.footerColList}>
              {relatedExternal.map((l) => (
                <li key={l.label}>
                  <a href={l.href} target="_blank" rel="noopener noreferrer">
                    <span>{l.label}</span>
                    <ExternalLink size={11} aria-hidden="true" />
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <div className={styles.footerCol}>
            <div className={styles.footerColTitle}>Portal</div>
            <ul className={styles.footerColList}>
              {portalInternal.map((l) =>
                l.to ? (
                  <li key={l.label}>
                    <Link to={l.to}>{l.label}</Link>
                  </li>
                ) : (
                  <li key={l.label}>
                    <a
                      href={l.hash}
                      onClick={(e) => {
                        e.preventDefault();
                        onNavClick(l.hash);
                      }}
                    >
                      {l.label}
                    </a>
                  </li>
                )
              )}
            </ul>
          </div>
        </div>
      </div>

      <div className={styles.footerBottom}>
        <span>© {new Date().getFullYear()} Archaeological Survey of India</span>
        <span className={styles.footerAttribution}>
          Photography via Wikimedia Commons under CC BY-SA
        </span>
      </div>
    </footer>
  );
}
