# SEO y búsqueda con IA — 20 de septiembre de 2026

Implementado: contenido HTML legible sin JavaScript; título, descripción y H1 sobre detailing de zapatos a mano en Maracaibo; servicios de calzado, gorras, bolsos/carteras; preguntas y respuestas visibles; canonical/OG/Twitter; LocalBusiness + WebSite + Service coherentes con contenido; robots.txt y sitemap; logo con dimensiones y fuentes locales. No se promete posición, indexación ni citas de IA. No hay testimonios, precios, horario o certificaciones inventadas. No FAQPage para prometer rich results.

Fuente de servicios: consulta de SOLO LECTURA al ERP, negocio detailshoes, 30 insumos y 18 equipos activos, catálogo de servicios vacío. Compras justifican propuesta de cuidado; no demuestran capacitación de restauración ni recepción física. Se omiten restauración, custom, lujo especializado y precios de planes históricos. RESHOEVN8R figura como producto utilizado, sin alianza oficial. Logo obtenido de su web oficial. Dirección confirmada por el usuario; WhatsApp temporal de Carwash confirmado en detailprocar.com. Detailing manual confirmado por el usuario.

Alcance: la página continúa PRIVADA en Sites. El login impide indexación pública aunque robots permita rastreo. Para lanzamiento: acordar audiencia pública/dominio, confirmar horario y operación, sustituir WhatsApp temporal, actualizar canonical/sitemap al dominio definitivo, verificar propiedad en Google Search Console/Bing, solicitar indexación y medir CWV con datos reales. No se modificó audiencia ni DNS ni se envió WhatsApp.

Guía aplicada: https://developers.google.com/search/docs/appearance/ai-features — mismas bases SEO, acceso rastreable, contenido útil en texto, datos estructurados fieles; no requisitos especiales ni garantías de aparición.
Fuentes de productos: https://reshoevn8r.com/pages/faq y https://reshoevn8r.com/collections/featured-products/products/shoe-oxidation-yellowing-removal-re8-sole-revive

## Segunda pasada — 20 de septiembre de 2026 (SEO + búsqueda con IA)

Dominio canónico fijado en `https://detailproshoes.com` (elección del usuario; el dominio está registrado y hoy resuelve a parking de Namecheap, 162.255.119.192). Canonical, OG/Twitter, JSON-LD, robots y sitemap apuntan ahí.

Datos estructurados reescritos como un solo `@graph` coherente con el contenido visible:
- `LocalBusiness` + `ShoeStore`, con `logo` como `ImageObject`, `alternateName`, `knowsAbout`, `hasOfferCatalog` y `potentialAction` de WhatsApp.
- `openingHoursSpecification` Mo–Sa 08:00–17:00, confirmado por el usuario y publicado también como texto visible en la sección de contacto.
- `WebPage` enlazado a `WebSite` y al negocio.
- Tres `Service` con descripción y subservicios reales tomados del texto de la página.
- `FAQPage` generado a partir de las 8 preguntas ya visibles, sin añadir ninguna nueva. Se usa para que los buscadores y los sistemas de IA lean las respuestas tal como están publicadas; no se promete ningún rich result.

`robots.txt` declara acceso explícito a Googlebot, Google-Extended, Bingbot, GPTBot, OAI-SearchBot, ChatGPT-User, ClaudeBot, Claude-SearchBot, PerplexityBot, Perplexity-User, Applebot y Applebot-Extended. `sitemap.xml` con `lastmod`.

`llms.txt` añadido con los datos verificados y una sección de aclaraciones (detallado manual, sin precios publicados, limpieza ≠ restauración, RESHOEVN8R sin afiliación, sin testimonios ni calificaciones) para reducir afirmaciones inventadas en respuestas generadas. Nota: `llms.txt` no lo usa Google Search; es un archivo de cortesía, no un requisito.

No se añadió `geo` porque el Centro Comercial Terraza 77 no aparece en OpenStreetMap y no se inventan coordenadas; queda pendiente del enlace de Google Maps del local.

Pendiente de lanzamiento: apuntar el DNS de detailproshoes.com al hosting, verificar propiedad en Google Search Console y Bing Webmaster Tools, sustituir el WhatsApp temporal de Carwash, añadir `geo` y perfil de Google Business, y reducir el peso del modelo 3D antes de medir Core Web Vitals reales.

## Correcciones de QA — 20 de septiembre de 2026

Auditoría con navegador en 360/390/768/1024/1440. Resultado previo: 1 alto, 5 medios, 5 bajos, sin bugs que rompieran la página. Aplicado:

- **Modelo 3D de 7,83 MB a 1,13 MB.** El GLB traía cinco texturas JPEG (7,1 MB) para las tres variantes de color de `KHR_materials_variants`, aunque el sitio siempre aplicó una sola. Se reconstruyó con la variante usada, texturas a 1024 px y la extensión eliminada. La geometría no se tocó y el héroe se ve igual (comparación de capturas a 390 px).
- **Foto del local de 2,0 MB (PNG) a 95 KB (WebP), 50 KB en móvil,** y fuera de la ruta crítica: el fondo se pide por `IntersectionObserver` cuando la sección de contacto se acerca. Antes se descargaba a los 43 ms, antes que el modelo.
- **Bucle de render detenido con el héroe fuera de pantalla** (`IntersectionObserver`). Antes seguía dibujando 116 veces por segundo mientras se leía el pie de página; medido ahora en 0.
- **`prefers-reduced-motion`**: el zapato seguía el scroll sin interpolación, en vez de aparecer ya limpio contradiciendo el indicador "01 — ANTES · 0%".
- **Divisor sin guarda en el cálculo de scroll**: sin soporte de `svh` el contenedor colapsaba y el indicador imprimía "NaN%". Ahora `Math.max(1, …)`.
- **`.model-tag` quedaba debajo del canvas en móvil** (se leía "L / 001"): las capas del héroe pasan a `z-index:3`.
- **Título del héroe** a `clamp(56px,13.2vw,105px)`: con las fuentes bloqueadas en 360 px medía 490 px y se recortaba; ahora 326 px sin desbordamiento.
- **Mensaje de estado del visor 3D fuera del contenedor `role="img"`**, con `role="status"`, para que los lectores de pantalla anuncien los fallos de carga.
- **`summary` de las preguntas a 30 px de alto** (WCAG 2.2 pide 24 mínimo; medían 23).
- **`three` en su propio chunk** (`vite.config.js`): el JS de entrada baja de 580 kB a 5,65 kB. El aviso de tamaño de Vite sigue apareciendo por el chunk de three, que es su peso real.

Dirección del schema y de `llms.txt` sincronizadas con el texto visible ("Av. 3F con calle 77 (5 de Julio)"). Se quitó `currenciesAccepted` (dato inventado) y la entrada "Créditos 3D" que se había colado en el `FAQPage`: quedan las 7 preguntas reales.

Verificación tras los cambios: `npm run build` en verde, cero errores de consola en 390 y 1440, progreso 0→100 %, foto del local servida solo tras el scroll y en la variante que corresponde a cada ancho.
