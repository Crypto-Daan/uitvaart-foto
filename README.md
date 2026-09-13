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

## SuperGallery-prototype: productpagina met 3D-configurator

In `supergallery/` staat een losstaand prototype van een SuperGallery-productpagina
(Poolside Backgammon van Slim Aarons) waarin de gekozen configuratie fotorealistisch
in 3D te draaien is.

| Bestand | Inhoud |
|---|---|
| `supergallery/index.html` | Pagina: navigatie, 3D-viewer, configurator, "Over dit werk", kwaliteit, gerelateerde werken |
| `supergallery/app.js` | Formaten, afwerkingen, lijsten en prijsregels (basisprijs + toeslag per formaat), koppeling met de viewer |
| `supergallery/viewer.js` | 3D-viewer op three.js r128: fotopaneel (plexi + Dibond), baklijst, passe-partout-lijst, museumglas, studio-omgevingen, schaalfiguur |
| `supergallery/style.css` | Huisstijl van het prototype |
| `supergallery/vendor/three.min.js` | three.js r128 (MIT), lokaal zodat de pagina offline werkt |
| `supergallery/img/` | Productfoto, afwerkings- en lijstthumbnails, houtstroken als texturen, gerelateerde werken |

De pagina start met de 2D-foto en "Vanaf € 250,00"; de eerste keuze in de configurator
schakelt naar 3D. Weergaven: **Foto**, **3D Orbit** (slepen om te draaien, scrollen of
knijpen om te zoomen, twee vingers of Shift+slepen om te schuiven), **Vooraanzicht**,
**Lijstdikte (3D)** (zijaanzicht van het profiel en de opbouw), **Glasinspectie**
(close-up van de reflectie per afwerking), **Mijn muur** (eigen foto of camera, werk op
ware grootte, slepen en breedte instellen) en **Vergelijk formaten** (tot drie formaten
boven een bank van 220 cm, met prijs). Verder: expositie-omgevingen (studio, galerie,
woonkamer, donkere wand), schaalfiguur van 1,75 m, automatisch draaien, **Deel dit
ontwerp** (link met configuratie, met afbeelding via de deelfunctie van de telefoon),
**Afbeelding** downloaden en **Bewaar ontwerp** (lokaal opgeslagen, met welkom-terug-banner
en herinnering per e-mail als demo).

Prijzen en opties volgen de productregels van supergallery.nl (september 2026):
basis € 250, toeslag per afwerking en formaat, baklijst alleen bij plexi, lijst met
passe-partout alleen bij print (niet bij Giant). Beeld © Slim Aarons / Hulton Archive /
Getty Images — alleen voor dit prototype.

```bash
python3 -m http.server 8000
# open http://localhost:8000/supergallery/
```
