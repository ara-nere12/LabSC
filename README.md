# Sitio web de LABSEMCO

Sitio estático del Laboratorio de Semántica Computacional del Centro de Investigación en Ciencias de la UAEM.

## Estructura

- `index.html`: portada.
- `nosotros.html`: presentación del laboratorio.
- `investigacion.html`: líneas de investigación.
- `proyectos.html`: proyectos e impacto.
- `equipo.html`: directorio organizado automáticamente mediante las categorías editables de la hoja.
- `persona.html`: ficha dinámica reutilizada para todos los integrantes.
- `contacto.html`: ubicación y contacto institucional.
- `assets/`: imágenes usadas por el sitio.
- `styles.css` y `script.js`: estilos y comportamiento compartidos.
- `sheets-config.js`: direcciones CSV publicadas desde Google Sheets.
- `labsemco-contenido-google-sheets.xlsx`: plantilla maestra de contenido.
- `GOOGLE_SHEETS.md`: procedimiento para publicar y conectar cada pestaña.

La página antigua `comunidad.html` y la carpeta de fotografías originales no forman parte del sitio de producción. Se conservaron fuera de esta carpeta.

Las fotografías principales usan un degradado horizontal común: 40% del color de la sección y 60% de imagen. El logotipo conserva su apariencia original.

## Probar localmente

No abras los HTML directamente si deseas probar Google Sheets, porque el navegador puede limitar las solicitudes externas. Inicia un servidor web local en esta carpeta y visita `http://localhost:8000/`.

Con Python:

```text
python -m http.server 8000
```

## Contenido administrado

El sitio funciona aun cuando Google Sheets no responde. Cada página conserva contenido local y lo sustituye únicamente cuando la colección correspondiente está publicada y configurada.

Las seis colecciones están conectadas a la hoja compartida de Google Sheets. Si cambia la hoja de origen o alguna pestaña, actualiza su dirección CSV en `sheets-config.js`.

## Publicación

La configuración SEO usa como dirección base:

`https://cinc.uaem.mx/semantica-computacional/`

Si el sitio se publica en otra ubicación, actualiza las etiquetas `canonical`, `og:url`, `og:image`, además de `sitemap.xml` y `robots.txt`.

Antes de publicar:

1. Verifica las siete páginas y `404.html` en computadora y teléfono.
2. Confirma que no haya errores en la consola del navegador.
3. Comprueba las direcciones CSV configuradas.
4. Revisa que los nombres, cargos, proyectos y datos de contacto sigan vigentes.
5. Ejecuta una revisión de enlaces y accesibilidad.

## Fuentes institucionales

- Sitio de LABSEMCO: https://cinc.uaem.mx/semantica-computacional/
- Centro de Investigación en Ciencias: https://cinc.uaem.mx/
- Universidad Autónoma del Estado de Morelos: https://www.uaem.mx/
