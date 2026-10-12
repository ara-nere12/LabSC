# Sitio web de LABSEMCO

Sitio estático del Laboratorio de Semántica Computacional del Centro de Investigación en Ciencias de la UAEM.

- Repositorio: <https://github.com/ara-nere12/LabSC>
- Sitio publicado: <https://ara-nere12.github.io/LabSC/>
- Contenido editable: Google Sheets conectado mediante `sheets-config.js`

## Antes de modificar algo

Primero decide si el cambio corresponde a Google Sheets o al código.

| Cambio | Dónde se realiza |
| --- | --- |
| Textos principales ya registrados | Pestaña `Contenido` |
| Fotografías de portada | Pestaña `Imágenes` |
| Diapositivas de Inicio | Pestaña `Carrusel` |
| Líneas de investigación | Pestaña `Investigación` |
| Proyectos, categorías y enlaces | Pestaña `Proyectos` |
| Integrantes y perfiles personales | Pestaña `Equipo` |
| Eventos y actividades | Pestaña `Divulgación` |
| Enlaces de contacto | Pestaña `Enlaces` |
| Tamaños generales de texto | Pestaña `Diseño` |
| Menú, colores, distribución o comportamiento | HTML, CSS o JavaScript |
| Página o tipo de sección completamente nuevo | HTML, CSS, JavaScript y, si aplica, Google Sheets |
| Archivo de una fotografía nueva | Carpeta `assets/` y después Google Sheets |

No edites el código para un cambio que ya pueda realizarse desde la hoja. No agregues una fila esperando que cree una sección nueva en cualquier pestaña: solamente las colecciones dinámicas crean elementos automáticamente.

## Estructura del proyecto

- `index.html`: portada y carrusel.
- `nosotros.html`: información e identidad del laboratorio.
- `investigacion.html`: líneas de investigación.
- `proyectos.html`: proyectos, categorías y subcategorías.
- `divulgacion.html`: eventos y actividades.
- `equipo.html`: directorio organizado por categorías.
- `persona.html`: ficha dinámica reutilizada para todos los integrantes.
- `contacto.html`: ubicación y enlaces institucionales.
- `404.html`: página mostrada cuando una dirección no existe.
- `assets/`: logotipo, fotografías generales y carpeta `personas/`.
- `styles.css`: colores, tamaños, degradados, distribución y adaptación para teléfonos.
- `script.js`: carga Google Sheets y construye las secciones dinámicas.
- `sheets-config.js`: direcciones CSV de las pestañas de Google Sheets.
- `sitemap.xml`: listado de páginas para buscadores.
- `robots.txt`: reglas para buscadores.
- `GOOGLE_SHEETS.md`: guía adicional de publicación y conexión de la hoja.
- `GUIA_GITHUB.md`: guía básica de GitHub.

Los archivos `.xlsx` son respaldos o plantillas. La página publicada consulta Google Sheets, no esos archivos locales.

## Cómo funciona Google Sheets

Cada pestaña se publica como CSV. `sheets-config.js` guarda su dirección y `script.js` descarga los datos cuando se abre una página.

Si Google Sheets no responde, el sitio conserva el contenido escrito en los HTML. Por eso los HTML no deben quedar vacíos: funcionan como respaldo.

Las columnas importantes son:

### Contenido

`ID`, `PAGINA`, `ELEMENTO`, `CONTENIDO`, `ACTIVO`

- `ID` debe coincidir exactamente con un atributo `id` existente en el HTML.
- `ELEMENTO` normalmente contiene `texto`, `enlace`, `imagen`, `alt` o `visibilidad`.
- Agregar un ID inexistente no crea una sección. Primero hay que crear el elemento en el HTML.

### Carrusel

`ID`, `ETIQUETA`, `TITULO`, `DESCRIPCION`, `TEXTO_BOTON`, `ENLACE`, `IMAGEN`, `ALT`, `ACTIVO`, `ORDEN`

Cada fila activa crea una diapositiva. La ruta de imagen debe existir en GitHub o ser una dirección web válida.

### Investigación

`ID`, `CATEGORIA`, `TITULO`, `DESCRIPCION`, `PUNTO_1`, `PUNTO_2`, `PUNTO_3`, `ANCLA`, `ACTIVO`, `ORDEN`

Cada fila activa crea una línea de investigación. `ANCLA` permite enlaces como `investigacion.html#cerebro`.

### Proyectos

Columnas principales:

`ID`, `CATEGORIA`, `TITULO`, `DESCRIPCION`, `ETIQUETAS`, `ACTIVO`, `ORDEN`, `ENLACE`, `TEXTO_ENLACE`

Columnas opcionales admitidas por el código:

`SUBCATEGORIA`, `COLABORADORES`

Cada fila activa crea un proyecto. Si se desean subcategorías o colaboradores, agrega esas columnas a la hoja con los nombres exactos.

### Equipo y perfiles

`ID`, `GRUPO`, `INICIALES`, `NOMBRE`, `ROL`, `AREA`, `ACTIVO`, `ORDEN`, `NIVEL_ROL`, `TEMA_INVESTIGACION`, `TITULO_INVESTIGACION`, `RESUMEN`, `CORREO`, `PUBLICACIONES`, `GOOGLE_SCHOLAR`, `FOTO`

- `ID` debe ser único, corto y sin espacios. También forma la dirección `persona.html?id=ID`.
- `GRUPO` controla la sección del directorio.
- `FOTO` acepta una ruta como `assets/personas/Bruno.JPG`.
- Los datos extendidos aparecen únicamente en la ficha personal.

Grupos reconocidos automáticamente:

- `doctor`, `lider` o `lider del laboratorio` → Líder del laboratorio.
- `miembros`.
- `estudiantes` o `licenciatura`.
- `maestria`.
- `doctorados`.
- `investigadores asociados`.
- `visitantes`.
- `instituciones colaboradoras`.

Un valor nuevo en `GRUPO` crea una categoría adicional. Para cambiar los nombres predeterminados hay que editar `formatTeamGroup`, `canonicalTeamGroup` y `defaultTeamGroups` en `script.js`.

### Divulgación

`ID`, `TIPO`, `TITULO`, `FECHA`, `LUGAR`, `DESCRIPCION`, `ENLACE`, `TEXTO_ENLACE`, `ACTIVO`, `ORDEN`

Cada fila activa crea un evento.

### Enlaces

`ID`, `SECCION`, `TEXTO`, `URL`, `ACTIVO`, `ORDEN`

Actualmente el sitio muestra automáticamente los enlaces cuya sección sea `contacto`.

### Diseño

`CLAVE`, `TAMAÑO_PX`, `USO`, `RANGO_SEGURO`

Claves reconocidas:

- `titulo_principal`: 36 a 160 px.
- `titulo_seccion`: 28 a 120 px.
- `subtitulo`: 18 a 72 px.
- `texto_normal`: 12 a 36 px.
- `texto_pequeno`: 9 a 28 px.

Los valores fuera de esos rangos se ajustan automáticamente al límite seguro.

### Imágenes

`ID`, `PAGINA`, `USO`, `IMAGEN`, `ALT`, `ACTIVO`

Esta pestaña controla las portadas ya registradas. Una fila nueva no crea una portada adicional sin agregar también su destino en `pageImageTargets`, dentro de `script.js`.

## Flujo seguro para modificar el código

1. Abre la carpeta completa del proyecto.
2. Revisa `git status` antes de comenzar.
3. Si aparecen cambios que no reconoces, no los borres ni reemplaces.
4. Modifica solamente los archivos necesarios.
5. Prueba todas las páginas afectadas en computadora y teléfono.
6. Revisa `git diff` antes de crear el commit.
7. Sube únicamente cuando la revisión esté completa.

Comandos de revisión:

```powershell
git status
git diff
git diff --check
```

Si el repositorio está limpio, actualízalo antes de trabajar:

```powershell
git pull --ff-only origin main
```

No uses `git reset --hard` para corregir errores: puede eliminar trabajo sin guardar.

## Probar el sitio localmente

No abras los HTML directamente si necesitas comprobar Google Sheets. Algunos navegadores bloquean las solicitudes externas desde archivos locales.

Con Python instalado:

```powershell
python -m http.server 8000
```

Después visita:

`http://localhost:8000/`

También se puede usar la extensión **Live Server** de Visual Studio Code. Revisa la consola del navegador con `F12`; no debe mostrar errores de carga, rutas ni JavaScript.

## Modificaciones comunes en el código

### Cambiar un texto ya conectado

Hazlo en `Contenido`. El ID de la fila debe coincidir con el HTML:

```html
<h2 id="resumen_titulo">Texto de respaldo</h2>
```

La fila usaría `resumen_titulo` como `ID`. Conserva un texto de respaldo razonable dentro del HTML.

### Conectar un texto nuevo a Google Sheets

1. Agrega un `id` único al elemento HTML.
2. Agrega una fila en `Contenido` usando exactamente ese ID.
3. Usa `texto` en `ELEMENTO` y el texto deseado en `CONTENIDO`.
4. Marca `ACTIVO` como `SI`.
5. Comprueba que el texto cambie al cargar la página publicada.

### Agregar una sección nueva a una página

1. Agrega HTML semántico, normalmente un `<section>` con encabezado.
2. Asigna IDs a los textos que deban administrarse desde Sheets.
3. Agrega las filas correspondientes en `Contenido`.
4. Crea los estilos en `styles.css`.
5. Añade comportamiento en `script.js` solamente si la sección es dinámica.
6. Revisa escritorio, tableta y teléfono.

Una fila nueva en `Contenido` por sí sola no crea el HTML.

### Crear una colección dinámica nueva

Usa como referencia `loadProjects`, `loadEvents` o `loadResearch` en `script.js`.

1. Crea una pestaña en Google Sheets con encabezados estables.
2. Publica la pestaña como CSV.
3. Añade su dirección a `sheets-config.js`.
4. Agrega un contenedor con ID en el HTML.
5. Crea una función `load...` que llame a `fetchSheet`.
6. Construye los elementos con `createElement` y `textContent`; evita insertar HTML recibido desde la hoja.
7. Agrega la función a `initializeContent`.
8. Incluye contenido local de respaldo.

### Modificar el menú

El menú está repetido en cada HTML. Si agregas, renombras o eliminas una opción, actualiza:

- `index.html`
- `nosotros.html`
- `investigacion.html`
- `proyectos.html`
- `divulgacion.html`
- `equipo.html`
- `persona.html`
- `contacto.html`
- `404.html`

En cada página debe existir una sola opción con `class="active"` y `aria-current="page"` cuando corresponda.

### Crear una página nueva

1. Copia la página existente más parecida.
2. Cambia `<title>`, descripción, dirección canonical y datos Open Graph.
3. Conserva la barra lateral, el encabezado institucional y los enlaces a estilos y scripts.
4. Agrega la opción al menú de todos los HTML.
5. Añade la página a `sitemap.xml`.
6. Si tendrá portada editable, crea su fila en `Imágenes` y registra el destino en `pageImageTargets`.
7. Si tendrá textos editables, añade IDs y filas en `Contenido`.
8. Prueba la dirección directamente y desde el menú.

### Cambiar colores, márgenes o distribución

Hazlo en `styles.css`.

- Reutiliza las variables CSS existentes antes de crear colores nuevos.
- Conserva los estilos adaptables dentro de sus consultas `@media`.
- No fijes alturas que corten textos o fotografías en teléfonos.
- Comprueba contraste, enfoque de teclado y movimiento reducido.

Las fotografías principales usan un degradado horizontal común de aproximadamente 30% de color y 70% de imagen, con encuadre centrado.

### Cambiar comportamiento

Hazlo en `script.js`.

- Conserva la validación de rutas realizada por `safeResource`.
- No uses `innerHTML` con datos provenientes de Google Sheets.
- Mantén el contenido local cuando falle una consulta.
- Si agregas un cargador nuevo, inclúyelo en `initializeContent`.
- Si cambias el carrusel, conserva controles de teclado, etiquetas accesibles y movimiento reducido.

Después de modificar JavaScript, revisa la sintaxis:

```powershell
node --check script.js
```

## Fotografías y recursos

1. Copia las fotografías generales a `assets/`.
2. Copia los retratos a `assets/personas/`.
3. Usa nombres breves y descriptivos, sin acentos ni espacios cuando sea posible.
4. Conserva exactamente la extensión y las mayúsculas del archivo.
5. Actualiza la ruta en Google Sheets y el respaldo local en el HTML cuando corresponda.
6. Escribe un texto alternativo que describa la imagen.

Ejemplo:

`assets/Alondra.JPG`

GitHub Pages distingue mayúsculas y minúsculas. `Alondra.JPG`, `alondra.JPG` y `Alondra.jpg` son rutas diferentes. Antes de publicar, confirma que cada ruta exista.

No reemplaces el logotipo con una fotografía y no elimines imágenes antiguas hasta confirmar que dejaron de usarse en HTML, CSS, JavaScript y Google Sheets.

## Google Sheets: conexión y permisos

Las direcciones están en `sheets-config.js`. Si se crea otra hoja o cambia una pestaña:

1. Confirma que la hoja pueda consultarse públicamente.
2. Obtén el `gid` correcto de la pestaña.
3. Sustituye solamente la dirección de esa colección.
4. Conserva el formato CSV de Google Visualization.
5. Verifica los nombres exactos de las columnas.

Formato utilizado:

```text
https://docs.google.com/spreadsheets/d/ID_DE_LA_HOJA/gviz/tq?tqx=out:csv&gid=ID_DE_LA_PESTAÑA
```

Si falta una columna requerida, `script.js` conserva el contenido local y muestra una advertencia en la consola.

## SEO y direcciones públicas

Si cambia el dominio o la carpeta de publicación, actualiza:

- `<link rel="canonical">` en cada HTML.
- `og:url` y `og:image`.
- `sitemap.xml`.
- `robots.txt`.

La dirección institucional configurada actualmente es:

`https://cinc.uaem.mx/semantica-computacional/`

El sitio también se publica mediante GitHub Pages en:

`https://ara-nere12.github.io/LabSC/`

## Lista de comprobación antes de publicar

- La página de Inicio abre y muestra su fotografía.
- El carrusel avanza, retrocede y abre los enlaces correctos.
- Nosotros, Investigación, Proyectos, Divulgación, Equipo y Contacto cargan.
- Cada nombre del equipo abre `persona.html?id=...`.
- Las fotografías de perfil existen o aparece el marcador de respaldo.
- Los eventos, proyectos y categorías respetan `ACTIVO` y `ORDEN`.
- No hay rutas con una extensión o mayúscula incorrecta.
- La consola del navegador no muestra errores.
- El menú funciona con ratón, teclado y teléfono.
- `404.html` funciona.
- Los textos no se cortan en pantalla pequeña.
- `node --check script.js` termina sin errores.
- `git diff --check` termina sin errores.
- `git status` muestra solamente archivos relacionados con el cambio.

## Publicar en GitHub

Revisa primero los cambios:

```powershell
git status
git diff
git diff --check
```

Agrega únicamente los archivos modificados:

```powershell
git add README.md index.html styles.css script.js
```

La lista anterior es un ejemplo. No agregues archivos que no formen parte del cambio.

Crea el commit y súbelo:

```powershell
git commit -m "Describir el cambio realizado"
git push origin main
```

Después abre la pestaña **Actions** del repositorio y espera a que `pages build and deployment` aparezca en verde. Finalmente revisa el sitio publicado; un `push` correcto no garantiza que todas las rutas o fotografías sean válidas.

## Problemas frecuentes

### Una fotografía no aparece

- Comprueba que el archivo esté dentro de `assets/`.
- Revisa mayúsculas, minúsculas y extensión.
- Confirma que el archivo se haya subido a GitHub.
- Revisa la ruta en `Imágenes`, `Carrusel` o `Equipo`.

### Un cambio de Sheets no aparece

- Confirma que `ACTIVO` sea `SI`.
- Revisa encabezados y espacios adicionales.
- Confirma que la pestaña esté publicada y que su `gid` coincida con `sheets-config.js`.
- Recarga sin caché con `Ctrl+F5`.
- Abre la consola para buscar el mensaje `LABSEMCO: se conserva el contenido local`.

### Una fila nueva no crea contenido

- En `Carrusel`, `Investigación`, `Proyectos`, `Equipo` y `Divulgación`, una fila activa sí crea un elemento.
- En `Contenido` e `Imágenes`, la fila debe apuntar a un destino previamente registrado en el código.

### El sitio funciona localmente pero no en GitHub

- Busca rutas con mayúsculas diferentes.
- Evita rutas absolutas de Windows como `C:\Users\...`.
- Usa `/` en las rutas web.
- Revisa el resultado del despliegue en **Actions**.

### Google Sheets deja de responder

El sitio mostrará el contenido local de respaldo. No elimines ese contenido de los HTML ni los datos de respaldo de `script.js`.

## Fuentes institucionales

- LABSEMCO: <https://cinc.uaem.mx/semantica-computacional/>
- Centro de Investigación en Ciencias: <https://cinc.uaem.mx/>
- Universidad Autónoma del Estado de Morelos: <https://www.uaem.mx/>
