# Contenido administrado con Google Sheets

LABSEMCO usa una estructura híbrida: el diseño permanece en los archivos de la página y Google Sheets administra el contenido. Si una hoja no está disponible, la página conserva el contenido local de respaldo.

## Estado actual

- `Contenido`, `Carrusel`, `Investigación`, `Proyectos`, `Equipo`, `Divulgación`, `Enlaces` y `Diseño` están conectados a la hoja compartida.
- Las direcciones CSV se encuentran en `sheets-config.js` y usan el identificador `gid` propio de cada pestaña.
- La página conserva el contenido local de respaldo si Google Sheets no está disponible.
- Si se crea otra pestaña o se reemplaza la hoja, debe verificarse su nuevo identificador `gid` antes de cambiar la configuración.

## Pestañas

- `Contenido`: textos únicos de las seis páginas. Conserva los valores de `ID` y edita `CONTENIDO` o `ACTIVO`.
- `Carrusel`: cada fila crea una diapositiva nueva en la portada.
- `Investigación`: cada fila crea una línea de investigación.
- `Proyectos`: cada fila crea una tarjeta de proyecto. `CATEGORIA` y `SUBCATEGORIA` organizan el directorio; `COLABORADORES` muestra quién participa. Escribe el vínculo del repositorio en `ENLACE`; `TEXTO_ENLACE` es opcional.
- `Equipo`: cada fila crea una persona en el directorio y su ficha individual. `GRUPO` controla su sección y acepta `doctor`, `miembros`, `estudiantes`, `maestria`, `doctorados`, `investigadores asociados`, `visitantes`, `instituciones colaboradoras` o cualquier categoría nueva.
- `Divulgación`: cada fila crea un evento o actividad. Usa `TIPO`, `TITULO`, `FECHA`, `LUGAR`, `DESCRIPCION`, `ENLACE` y, opcionalmente, `TEXTO_ENLACE`.
- `Enlaces`: cada fila crea un enlace dentro de la sección indicada.
- `Diseño`: controla cinco tamaños tipográficos globales. Edita únicamente los números de `TAMAÑO_PX`; la columna `RANGO_SEGURO` indica los valores permitidos.
- `Guía`: instrucciones breves; no se publica.

En las pestañas repetibles, `ACTIVO=SI` muestra la fila, `ACTIVO=NO` la oculta y `ORDEN` controla su posición. Cada fila debe tener un `ID` único.

Conserva sin cambios la primera fila de encabezados. Agrega personas, proyectos y demás registros a partir de la fila 2.

En `Equipo`, conserva un `ID` único y estable porque forma el enlace de la ficha (`persona.html?id=ID`). El sitio espera estas 15 columnas: `ID`, `GRUPO`, `INICIALES`, `NOMBRE`, `ROL`, `AREA`, `ACTIVO`, `ORDEN`, `NIVEL_ROL`, `TEMA_INVESTIGACION`, `TITULO_INVESTIGACION`, `RESUMEN`, `CORREO`, `PUBLICACIONES` y `GOOGLE_SCHOLAR`. Los últimos siete campos completan el perfil; cuando falta información, la ficha muestra **Información por agregar**. `ROL` y `AREA` siguen funcionando como respaldo de `NIVEL_ROL` y `TEMA_INVESTIGACION`. La categoría `doctor` representa al líder del laboratorio; `lider del proyecto` y `lider del laboratorio` también se muestran como **Doctor**. `Licenciatura` se agrupa dentro de **Estudiantes**.

En `Proyectos`, `ENLACE` acepta direcciones completas como `https://github.com/organizacion/proyecto`. Si `TEXTO_ENLACE` queda vacío, la web mostrará **Ver repositorio ↗**. Cuando `ENLACE` está vacío, la tarjeta se muestra sin botón. Si `SUBCATEGORIA` o `COLABORADORES` quedan vacíos, la tarjeta sigue funcionando.

En `Diseño`, `TITULO_PRINCIPAL`, `TITULO_SECCION`, `SUBTITULO`, `TEXTO_NORMAL` y `TEXTO_PEQUENO` se expresan en píxeles. No cambies la columna `CLAVE`. Los límites se validan también en el navegador para proteger el diseño en computadora y teléfono.

## Publicar las pestañas

1. Importa `labsemco-contenido-google-sheets.xlsx` en Google Sheets.
2. Abre **Archivo → Compartir → Publicar en la web**.
3. Elige una pestaña y selecciona **Valores separados por comas (.csv)**.
4. Copia el vínculo publicado.
5. Repite los pasos para `Contenido`, `Carrusel`, `Investigación`, `Proyectos`, `Equipo`, `Divulgación`, `Enlaces` y `Diseño`.
6. Pega cada vínculo en su lugar correspondiente dentro de `sheets-config.js`.
7. Abre el sitio mediante un servidor local y confirma en la consola del navegador que no aparezca el aviso `Faltan columnas`.

Ejemplo:

```js
window.LABSEMCO_SHEETS = {
  contenido: 'URL CSV DE CONTENIDO',
  carrusel: 'URL CSV DE CARRUSEL',
  investigacion: 'URL CSV DE INVESTIGACIÓN',
  proyectos: 'URL CSV DE PROYECTOS',
  equipo: 'URL CSV DE EQUIPO',
  divulgacion: 'URL CSV DE DIVULGACIÓN',
  enlaces: 'URL CSV DE ENLACES',
  diseno: 'URL CSV DE DISEÑO',
};
```

Una dirección vacía desactiva solamente esa colección y conserva las tarjetas incluidas en los archivos HTML. Google puede tardar algunos minutos en reflejar una edición publicada.

## Agregar contenido

Para agregar una persona, proyecto, línea de investigación, diapositiva o enlace, añade una fila al final de su pestaña. No es necesario modificar `script.js` ni los archivos HTML.
