# Contenido administrado con Google Sheets

LABSEMCO usa una estructura híbrida: el diseño permanece en los archivos de la página y Google Sheets administra el contenido. Si una hoja no está disponible, la página conserva el contenido local de respaldo.

## Pestañas

- `Contenido`: textos únicos de las seis páginas. Conserva los valores de `ID` y edita `CONTENIDO` o `ACTIVO`.
- `Carrusel`: cada fila crea una diapositiva nueva en la portada.
- `Investigación`: cada fila crea una línea de investigación.
- `Proyectos`: cada fila crea una tarjeta de proyecto.
- `Equipo`: cada fila crea una persona. Usa `GRUPO=colaboradores` o `GRUPO=estudiantes`.
- `Enlaces`: cada fila crea un enlace dentro de la sección indicada.
- `Guía`: instrucciones breves; no se publica.

En las pestañas repetibles, `ACTIVO=SI` muestra la fila, `ACTIVO=NO` la oculta y `ORDEN` controla su posición. Cada fila debe tener un `ID` único.

## Publicar las pestañas

1. Importa `labsemco-contenido-google-sheets.xlsx` en Google Sheets.
2. Abre **Archivo → Compartir → Publicar en la web**.
3. Elige una pestaña y selecciona **Valores separados por comas (.csv)**.
4. Copia el vínculo publicado.
5. Repite los pasos para `Contenido`, `Carrusel`, `Investigación`, `Proyectos`, `Equipo` y `Enlaces`.
6. Pega cada vínculo en su lugar correspondiente dentro de `sheets-config.js`.

Ejemplo:

```js
window.LABSEMCO_SHEETS = {
  contenido: 'URL CSV DE CONTENIDO',
  carrusel: 'URL CSV DE CARRUSEL',
  investigacion: 'URL CSV DE INVESTIGACIÓN',
  proyectos: 'URL CSV DE PROYECTOS',
  equipo: 'URL CSV DE EQUIPO',
  enlaces: 'URL CSV DE ENLACES',
};
```

Una dirección vacía desactiva solamente esa colección y conserva las tarjetas incluidas en los archivos HTML. Google puede tardar algunos minutos en reflejar una edición publicada.

## Agregar contenido

Para agregar una persona, proyecto, línea de investigación, diapositiva o enlace, añade una fila al final de su pestaña. No es necesario modificar `script.js` ni los archivos HTML.
