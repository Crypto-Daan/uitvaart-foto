# Uitvaartfoto.nl — merksite

Statische website voor Uitvaartfoto.nl: acrylblokken en foto op plexiglas als
waardige herinnering aan een overledene. Gebouwd volgens hoofdstuk 11 van het
businessplan — rustig, snel, mobiel-first, zonder frameworks of tracking.

## Pagina's

| Bestand | Inhoud |
|---|---|
| `index.html` | Home — één belofte, drie producten, rustige hero |
| `acrylblokken.html` | Lijn A: drie maten + maatwerk, prijstabel |
| `plexiglas.html` | Lijn B: glans/mat, ezel, ophangsysteem, aula-set |
| `bestellen.html` | Bestelflow in 4 stappen met foto-upload en resolutiecontrole |
| `werkwijze.html` | 4 stappen, foto-eisen, levertijden, herdrukbeleid |
| `ondernemers.html` | B2B: monsterdoos, commissie/zaakcode, fotografen, crematoria |
| `veelgestelde-vragen.html` | FAQ + verzending, apart en volledig |
| `privacy.html` | AVG: 90 dagen bewaartermijn, geen AI-training, geen UGC-gezichten |
| `contact.html` | Telefoon, e-mail, bel-me-terug-formulier |

Verder: `styles.css` (huisstijl), `site.js` (bestelwizard + formulieren),
`favicon.svg`, `robots.txt`, `sitemap.xml`, `404.html`.

## Lokaal bekijken

Statische bestanden — elke webserver werkt:

```bash
python3 -m http.server 8000
# open http://localhost:8000
```

## Vóór livegang invullen

- Echt 06-nummer (nu overal placeholder `06 - 0000 0000` / `tel:+31600000000`)
- KvK- en btw-nummer (nu "KvK volgt")
- Formulieren en bestelflow werken nu via `mailto:` naar hallo@uitvaartfoto.nl;
  koppel voor productie een echte checkout (iDEAL) en formulier-backend
- `sitemap.xml` en canonical-URL's controleren op de definitieve hosting

## Uitgangspunten (uit het businessplan)

- Toon: kort, concreet, warm zonder zoet. Geen uitroeptekens, geen countdown-timers.
- Assortiment bewust smal: drie blokmaten + maatwerk, plexiglas glans/mat, ezel ja/nee.
- Geen foto's van overledenen op de site; geen tracking- of advertentiecookies.
- Foto-check door een mens vóór druk; bestanden 90 dagen bewaren, daarna wissen.
