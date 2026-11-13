# Heritage Map: demo script (about 10 minutes)

**Before you start**
- Run with `VITE_USE_MOCKS=true` and open `http://localhost:5173`. Use localhost, not the VM, because "Near me" only works on localhost or https.
- Use a laptop screen at least 1366 px wide. For the phone part, open Chrome DevTools and pick a phone size.
- Open the browser console (F12). A `result.map is not a function` error there comes from old code, not the map.

---

## 1. A visitor finds the map (1 min)
1. Open the **landing page** (`/`) while logged out.
2. Scroll to **03 · Explore the register**. Point out the new dark **"See the register on the map"** banner.
3. Click it. You land on `/explore`. **No login needed.**

> Talking point: "Anyone, whether a student, researcher or tourist, can use this. A researcher can be anyone."

## 2. Find something (1 min)
1. In the search box, type **`sanchi`** and pick **Great Stupa, Sanchi**. The map flies there and the story card opens.
2. Clear the box, type **`tamil nadu`** and pick the **State** row. The map zooms to the state.

## 3. The story card (2 min)
With Sanchi open:
1. **Photo** at the top. Use the arrows to see the gallery.
2. **Summary in plain English**, with the label *Draft — pending ASI verification*.
   > "This text is our draft. ASI supplies the verified version before go-live."
3. **When / What / Where / Protected**: the four facts a visitor wants.
4. **In time**: the strip shows where Sanchi sits across Indian history.
5. **Found at this site** and **Nearby sites**: click one to jump to it.
6. **Technical details** (collapsed): codes and coordinates for researchers.
7. Now search **`nataraja`** and open the **Bronze Nataraja** object. Show **Its journey: Made → Found → Now** and the dotted line on the map from findspot to museum. Point out the photo label *Representative image — not this object*.

## 4. Smart search: ask in plain English (2 min)
Type each one and press **Enter**. Before pressing Enter, show the yellow row with its chips: that's the system showing how it understood the question.
- `buddhist caves in maharashtra`
- `mughal tombs`
- `temples between 600 and 900`
- `everything within 30 km of hampi`
- `gupta sculptures before 500 CE in UP xyzzy`. **Don't press Enter.** Point at *"Didn't understand: xyzzy"*.

> "There's no AI here. It matches our own vocabulary of periods, dynasties, places and categories, so it can't invent answers. Every result comes from the database. If AI is approved later, it plugs in behind the same box."

## 5. Guided stories (2 min)
Click **Stories**, pick **"Carved from rock: the caves of Maharashtra"**, and click **Next** through the steps (or use the → arrow key).
Then show **"Where objects end up"** to the last step, *The longest journey*.

> "Stories turn the register into something the public can explore and learn from, and they're easy to add: each one is a few lines of content."

## 6. Research tools (1 min)
- **Time slider**: drag it, or press ▶ to watch sites appear century by century.
- **Draw box / Draw radius**: drag on the map to select an area.
- **Colour by**: switch between Period, Category and Affiliation.
- **CSV / GeoJSON**: downloads exactly what's on screen. GeoJSON opens in QGIS.
- **Copy link**: the URL reopens this exact view.

## 7. Safety: what the public can't see (1 min)
1. Log in as **`admin1` / `password123`** and open **Map Explorer** in the sidebar.
2. The counts go up (**64 sites / 150 objects** vs **55 / 85** public): staff also see drafts and records still in review.
3. Open any site, then **Technical details**. Point out the lock-icon fields (coordinate source, accession number). The public never receives these.
4. Toggle **Public view preview** to show what a visitor would see.

> "Exact locations of unprotected sites are blurred to about 5 km for the public. This happens on the server, not just on screen."

## 8. Phone (30 sec)
Phone size in DevTools → `/explore` → tap **Filters** → tap **Stories**.

---

## If your PM asks…

| Question | Answer |
|---|---|
| Is this real data? | No. The 40 famous monuments use approximate real locations; everything else is invented to show the features. The structure is final, so real data drops in. |
| Can it handle all of NMMA's data? | The map engine (MapLibre) handles hundreds of thousands of points. At that scale, filtering moves to the database (PostGIS). That's planned. |
| Why does the background map look plain or blank? | It's a free demo map. Production needs a Survey of India–compliant one (Bhuvan or Mappls) for correct borders. |
| Who writes the summaries? | We drafted them for the demo. ASI must supply or approve the final text. |
| Is it AI? | No. It's rule-based on purpose: safe, free and needs no approval. AI can be added later. |
