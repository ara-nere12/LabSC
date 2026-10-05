const menuButton = document.querySelector('.menu-toggle');
const sidebar = document.querySelector('.sidebar');
const navigation = document.querySelector('.site-nav');
const navLinks = [...document.querySelectorAll('.site-nav a')];
const inPageNavLinks = navLinks.filter((link) => link.getAttribute('href')?.startsWith('#'));
const carouselSection = document.querySelector('.photo-carousel');
const homeHero = document.querySelector('.hero');
const sheetSources = window.LABSEMCO_SHEETS || {};

const parseCsv = (source) => {
  const rows = [];
  let row = [];
  let value = '';
  let quoted = false;

  for (let index = 0; index < source.length; index += 1) {
    const character = source[index];
    const nextCharacter = source[index + 1];
    if (character === '"' && quoted && nextCharacter === '"') {
      value += '"';
      index += 1;
    } else if (character === '"') {
      quoted = !quoted;
    } else if (character === ',' && !quoted) {
      row.push(value);
      value = '';
    } else if ((character === '\n' || character === '\r') && !quoted) {
      if (character === '\r' && nextCharacter === '\n') index += 1;
      row.push(value);
      if (row.some((cell) => cell.trim() !== '')) rows.push(row);
      row = [];
      value = '';
    } else {
      value += character;
    }
  }
  row.push(value);
  if (row.some((cell) => cell.trim() !== '')) rows.push(row);
  return rows;
};

const normalizeSheetValue = (value = '') => String(value).trim().toLocaleLowerCase('es-MX').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
const isActiveSheetRow = (value) => ['si', 'true', '1', 'yes', 'activo'].includes(normalizeSheetValue(value));
const sortSheetRows = (rows) => [...rows].sort((a, b) => (Number(a.ORDEN) || 9999) - (Number(b.ORDEN) || 9999) || String(a.ID).localeCompare(String(b.ID), 'es'));
const safeDomId = (value) => /^[A-Za-z][\w-]*$/.test(String(value).trim()) ? String(value).trim() : '';

const safeResource = (value = '') => {
  const trimmedValue = String(value).trim();
  if (/^(https?:\/\/|mailto:|tel:|\/|\.\.\/|\.\/|assets\/)/i.test(trimmedValue)) return trimmedValue;
  if (/^[\w.-]+\.html(?:#[\w-]+)?$/i.test(trimmedValue)) return trimmedValue;
  return '';
};

const createTextElement = (tag, text, className = '') => {
  const element = document.createElement(tag);
  element.textContent = text || '';
  if (className) element.className = className;
  return element;
};

const fetchSheet = async (key, requiredHeaders) => {
  const url = String(sheetSources[key] || '').trim();
  if (!url) return null;
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 8000);
  try {
    const response = await fetch(url, { cache: 'no-store', signal: controller.signal });
    if (!response.ok) throw new Error(`Google Sheets respondió con ${response.status}`);
    const parsedRows = parseCsv(await response.text());
    const rawHeaders = parsedRows.shift() || [];
    let headers = rawHeaders.map((header) => header.trim().toLocaleUpperCase('es-MX'));
    if (!requiredHeaders.every((header) => headers.includes(header))) {
      const recoveredValues = [];
      const recoveredHeaders = rawHeaders.map((cell) => {
        const normalizedCell = cell.trim().toLocaleUpperCase('es-MX');
        const expectedHeader = requiredHeaders.find((header) => normalizedCell === header || normalizedCell.startsWith(`${header} `));
        if (!expectedHeader) return normalizedCell;
        recoveredValues.push(cell.trim().slice(expectedHeader.length).trim());
        return expectedHeader;
      });
      if (requiredHeaders.every((header) => recoveredHeaders.includes(header))) {
        headers = recoveredHeaders;
        if (recoveredValues.some(Boolean)) parsedRows.unshift(recoveredValues);
      }
    }
    if (!requiredHeaders.every((header) => headers.includes(header))) throw new Error(`Faltan columnas en la hoja ${key}`);
    return parsedRows.map((values) => Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ''])));
  } catch (error) {
    console.warn(`LABSEMCO: se conserva el contenido local de ${key}.`, error);
    return null;
  } finally {
    window.clearTimeout(timeout);
  }
};

const updateElementFromSheet = (element, row) => {
  const active = isActiveSheetRow(row.ACTIVO);
  element.hidden = !active;
  if (!active) return;
  const content = row.CONTENIDO ?? '';
  const elementType = normalizeSheetValue(row.ELEMENTO);
  if (['visibilidad', 'visibility', 'contenedor', 'container'].includes(elementType)) return;
  if (['enlace', 'link', 'url', 'href'].includes(elementType) && element instanceof HTMLAnchorElement) {
    const href = safeResource(content);
    if (href) element.href = href;
    return;
  }
  if (['imagen', 'image', 'src'].includes(elementType) && element instanceof HTMLImageElement) {
    const src = safeResource(content);
    if (src) element.src = src;
    return;
  }
  if (elementType === 'alt' && element instanceof HTMLImageElement) {
    element.alt = content;
    return;
  }
  element.textContent = content;
};

const loadStaticContent = async () => {
  const rows = await fetchSheet('contenido', ['ID', 'PAGINA', 'ELEMENTO', 'CONTENIDO', 'ACTIVO']);
  if (!rows) return false;
  rows.forEach((row) => {
    const element = document.getElementById(String(row.ID).trim());
    if (element) updateElementFromSheet(element, row);
  });
  return true;
};

const loadDesign = async () => {
  const rows = await fetchSheet('diseno', ['CLAVE', 'TAMAÑO_PX']);
  if (!rows) return false;
  const designRules = {
    titulo_principal: { property: '--font-title-main', min: 36, max: 160 },
    titulo_seccion: { property: '--font-title-section', min: 28, max: 120 },
    subtitulo: { property: '--font-subtitle', min: 18, max: 72 },
    texto_normal: { property: '--font-body', min: 12, max: 36 },
    texto_pequeno: { property: '--font-small', min: 9, max: 28 },
  };
  let applied = false;
  rows.forEach((row) => {
    const rule = designRules[normalizeSheetValue(row.CLAVE)];
    const requestedSize = Number(String(row['TAMAÑO_PX'] ?? '').replace(',', '.'));
    if (!rule || !Number.isFinite(requestedSize)) return;
    const safeSize = Math.min(rule.max, Math.max(rule.min, requestedSize));
    document.documentElement.style.setProperty(rule.property, `${safeSize}px`);
    applied = true;
  });
  return applied;
};

const pageImageTargets = {
  'index.html': { id: 'inicio_portada', selector: '.hero-photo img' },
  'nosotros.html': { id: 'nosotros_portada', selector: '.detail-hero img' },
  'investigacion.html': { id: 'investigacion_portada', selector: '.detail-hero img' },
  'proyectos.html': { id: 'proyectos_portada', selector: '.detail-hero img' },
  'equipo.html': { id: 'equipo_portada', selector: '.detail-hero img' },
  'divulgacion.html': { id: 'divulgacion_portada', selector: '.detail-hero img' },
  'contacto.html': { id: 'contacto_portada', selector: '.detail-hero img' },
};

const loadPageImage = async () => {
  const pageName = window.location.pathname.split('/').pop() || 'index.html';
  const targetConfig = pageImageTargets[pageName];
  if (!targetConfig) return false;
  const image = document.querySelector(targetConfig.selector);
  if (!(image instanceof HTMLImageElement)) return false;
  const rows = await fetchSheet('imagenes', ['ID', 'PAGINA', 'USO', 'IMAGEN', 'ALT', 'ACTIVO']);
  const row = rows?.find((item) => normalizeSheetValue(item.ID) === targetConfig.id && isActiveSheetRow(item.ACTIVO));
  const source = safeResource(row?.IMAGEN);
  if (!row || !source) return false;
  const fallbackSource = image.getAttribute('src');
  const fallbackAlt = image.alt;
  image.onerror = () => {
    image.onerror = null;
    if (fallbackSource) image.src = fallbackSource;
    image.alt = fallbackAlt;
  };
  image.src = source;
  image.alt = row.ALT || fallbackAlt;
  return true;
};

const loadCarousel = async () => {
  const track = document.getElementById('carousel-list');
  const dots = document.querySelector('.carousel-dots');
  if (!track || !dots) return false;
  const rows = await fetchSheet('carrusel', ['ID', 'ETIQUETA', 'TITULO', 'DESCRIPCION', 'TEXTO_BOTON', 'ENLACE', 'IMAGEN', 'ALT', 'ACTIVO', 'ORDEN']);
  const activeRows = rows && sortSheetRows(rows.filter((row) => isActiveSheetRow(row.ACTIVO)));
  if (!activeRows?.length) return false;
  const slides = activeRows.map((row, index) => {
    const article = document.createElement('article');
    article.className = `carousel-slide${index === 0 ? ' is-active' : ''}`;
    article.setAttribute('aria-label', row.ETIQUETA || row.TITULO || `Diapositiva ${index + 1}`);
    article.setAttribute('aria-hidden', String(index !== 0));
    const anchor = document.createElement('a');
    anchor.href = safeResource(row.ENLACE) || '#';
    const image = document.createElement('img');
    image.src = safeResource(row.IMAGEN) || 'assets/ai-research.jpg';
    image.alt = row.ALT || row.TITULO || '';
    image.loading = 'lazy';
    anchor.append(image, createTextElement('span', '', 'slide-shade'));
    const copy = document.createElement('div');
    copy.className = 'slide-copy';
    copy.append(createTextElement('small', row.ETIQUETA), createTextElement('h3', row.TITULO), createTextElement('p', row.DESCRIPCION), createTextElement('b', row.TEXTO_BOTON));
    anchor.append(copy);
    article.append(anchor);
    return article;
  });
  const dotNodes = activeRows.map((row, index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.role = 'tab';
    button.className = index === 0 ? 'is-active' : '';
    button.setAttribute('aria-selected', String(index === 0));
    button.setAttribute('aria-label', `Mostrar ${row.ETIQUETA || row.TITULO || index + 1}`);
    return button;
  });
  track.replaceChildren(...slides);
  dots.replaceChildren(...dotNodes);
  return true;
};

const loadResearch = async () => {
  const container = document.getElementById('research-list');
  if (!container) return false;
  const rows = await fetchSheet('investigacion', ['ID', 'CATEGORIA', 'TITULO', 'DESCRIPCION', 'PUNTO_1', 'PUNTO_2', 'PUNTO_3', 'ANCLA', 'ACTIVO', 'ORDEN']);
  const activeRows = rows && sortSheetRows(rows.filter((row) => isActiveSheetRow(row.ACTIVO)));
  if (!activeRows?.length) return false;
  const cards = activeRows.map((row) => {
    const article = document.createElement('article');
    const anchorId = safeDomId(row.ANCLA);
    if (anchorId) article.id = anchorId;
    const list = document.createElement('ul');
    [row.PUNTO_1, row.PUNTO_2, row.PUNTO_3].filter((item) => String(item).trim()).forEach((item) => list.append(createTextElement('li', item)));
    article.append(createTextElement('span', row.CATEGORIA), createTextElement('h2', row.TITULO), createTextElement('p', row.DESCRIPCION), list);
    return article;
  });
  container.replaceChildren(...cards);
  return true;
};

const loadProjects = async () => {
  const container = document.getElementById('project-list');
  if (!container) return false;
  const rows = await fetchSheet('proyectos', ['ID', 'CATEGORIA', 'TITULO', 'DESCRIPCION', 'ETIQUETAS', 'ACTIVO', 'ORDEN']);
  const activeRows = rows && sortSheetRows(rows.filter((row) => isActiveSheetRow(row.ACTIVO)));
  if (!activeRows?.length) return false;
  const createProjectCard = (row) => {
    const article = document.createElement('article');
    article.className = 'impact-card';
    const id = safeDomId(`proyecto-${row.ID}`);
    if (id) article.id = id;
    if (row.SUBCATEGORIA) article.append(createTextElement('span', row.SUBCATEGORIA));
    article.append(createTextElement('h3', row.TITULO), createTextElement('p', row.DESCRIPCION));
    if (row.COLABORADORES) {
      const collaborators = document.createElement('p');
      collaborators.className = 'project-collaborators';
      collaborators.append(createTextElement('b', 'Colaboran'), document.createTextNode(` ${row.COLABORADORES}`));
      article.append(collaborators);
    }
    article.append(createTextElement('small', row.ETIQUETAS));
    const projectUrl = safeResource(row.ENLACE);
    if (projectUrl) {
      const link = createTextElement('a', row.TEXTO_ENLACE || 'Ver repositorio ↗', 'project-link');
      link.href = projectUrl;
      if (/^https?:\/\//i.test(projectUrl)) {
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
      }
      article.append(link);
    }
    return article;
  };
  const categories = new Map();
  activeRows.forEach((row) => {
    const category = String(row.CATEGORIA || 'Otros proyectos').trim();
    if (!categories.has(category)) categories.set(category, []);
    categories.get(category).push(row);
  });
  const categorySections = [...categories.entries()].map(([category, categoryRows]) => {
    const section = document.createElement('section');
    section.className = 'project-category';
    const heading = document.createElement('header');
    heading.append(createTextElement('p', 'Categoría'), createTextElement('h2', category));
    const subcategories = new Map();
    categoryRows.forEach((row) => {
      const subcategory = String(row.SUBCATEGORIA || '').trim();
      if (!subcategories.has(subcategory)) subcategories.set(subcategory, []);
      subcategories.get(subcategory).push(row);
    });
    const content = [...subcategories.entries()].map(([subcategory, subcategoryRows]) => {
      const block = document.createElement('div');
      block.className = 'project-subcategory';
      if (subcategory) block.append(createTextElement('h3', subcategory));
      const grid = document.createElement('div');
      grid.className = 'impact-grid';
      grid.append(...subcategoryRows.map(createProjectCard));
      block.append(grid);
      return block;
    });
    section.append(heading, ...content);
    return section;
  });
  container.className = 'project-directory';
  container.replaceChildren(...categorySections);
  return true;
};

const TEAM_HEADERS = [
  'ID',
  'GRUPO',
  'INICIALES',
  'NOMBRE',
  'ROL',
  'AREA',
  'ACTIVO',
  'ORDEN',
  'NIVEL_ROL',
  'TEMA_INVESTIGACION',
  'TITULO_INVESTIGACION',
  'RESUMEN',
  'CORREO',
  'PUBLICACIONES',
  'GOOGLE_SCHOLAR',
  'FOTO',
];

const fallbackTeam = [
  { ID: 'jorge', GRUPO: 'doctor', INICIALES: 'JH', NOMBRE: 'Dr. Jorge Hermosillo Valadez', ROL: 'Líder del Laboratorio', AREA: 'Computación y Robotica', NIVEL_ROL: 'Líder del Laboratorio', TEMA_INVESTIGACION: 'Computación y Robotica', ACTIVO: 'SI', ORDEN: '1' },
  { ID: 'gerardo', GRUPO: 'miembros', INICIALES: 'GT', NOMBRE: 'Dr. Gerardo Mauricio Toledo Acosta', ROL: 'Investigación postdoctoral', AREA: 'Matemáticas puras y aplicadas', NIVEL_ROL: 'Investigación postdoctoral', TEMA_INVESTIGACION: 'Matemáticas puras y aplicadas', ACTIVO: 'SI', ORDEN: '1' },
  { ID: 'markus', GRUPO: 'miembros', INICIALES: 'MM', NOMBRE: 'Dr. Markus Mueller', ROL: 'Investigador CInC', AREA: 'Sistemas complejos', NIVEL_ROL: 'Investigador CInC', TEMA_INVESTIGACION: 'Sistemas complejos', ACTIVO: 'SI', ORDEN: '2' },
  { ID: 'asela', GRUPO: 'miembros', INICIALES: 'AR', NOMBRE: 'Dra. Asela Reig Alamillo', ROL: 'Investigadora CINCCO', AREA: 'Lingüística cognitiva', NIVEL_ROL: 'Investigadora CINCCO', TEMA_INVESTIGACION: 'Lingüística cognitiva', ACTIVO: 'SI', ORDEN: '3' },
  { ID: 'bruno', GRUPO: 'estudiantes', INICIALES: 'BS', NOMBRE: 'Bruno Saint Martin Padilla', ROL: 'Estudiante', AREA: 'Clustering', NIVEL_ROL: 'Estudiante', TEMA_INVESTIGACION: 'Clustering', ACTIVO: 'SI', ORDEN: '1' },
  { ID: 'david', GRUPO: 'maestria', INICIALES: 'M', NOMBRE: 'David Torres Moreno', ROL: 'Maestría', AREA: 'Ciencias Cognitivas · CINCCO-UAEM', NIVEL_ROL: 'Maestría', TEMA_INVESTIGACION: 'Ciencias Cognitivas · CINCCO-UAEM', ACTIVO: 'SI', ORDEN: '1' },
  { ID: 'mark', GRUPO: 'maestria', INICIALES: 'M', NOMBRE: 'Mark Joseph Hernández Estrada', ROL: 'Maestría', AREA: 'Optimización y Cómputo Aplicado · FCAeI-UAEM', NIVEL_ROL: 'Maestría', TEMA_INVESTIGACION: 'Optimización y Cómputo Aplicado · FCAeI-UAEM', ACTIVO: 'SI', ORDEN: '2' },
  { ID: 'eliseo', GRUPO: 'estudiantes', INICIALES: 'L', NOMBRE: 'Eliseo Morales González', ROL: 'Licenciatura', AREA: 'Ciencias · IICBA-UAEM', NIVEL_ROL: 'Licenciatura', TEMA_INVESTIGACION: 'Ciencias · IICBA-UAEM', ACTIVO: 'SI', ORDEN: '3' },
  { ID: 'bolivar', GRUPO: 'estudiantes', INICIALES: 'L', NOMBRE: 'Bolívar Martínez Zaldívar', ROL: 'Licenciatura', AREA: 'Matemáticas · FC-UNAM', NIVEL_ROL: 'Licenciatura', TEMA_INVESTIGACION: 'Matemáticas · FC-UNAM', ACTIVO: 'SI', ORDEN: '4' },
];

const formatTeamGroup = (value) => {
  const normalized = normalizeSheetValue(value);
  if (['doctor', 'dr', 'lider', 'liderazgo', 'direccion', 'lider del proyecto', 'lider del laboratorio'].includes(normalized)) return 'Líder del laboratorio';
  if (['miembro', 'miembros', 'colaborador', 'colaboradores'].includes(normalized)) return 'Miembros';
  if (['estudiante', 'estudiantes', 'licenciatura', 'licenciaturas'].includes(normalized)) return 'Estudiantes';
  if (normalized === 'maestria') return 'Maestría';
  if (['doctorado', 'doctorados'].includes(normalized)) return 'Doctorados';
  if (['investigador asociado', 'investigadores asociados'].includes(normalized)) return 'Investigadores asociados';
  if (['visitante', 'visitantes'].includes(normalized)) return 'Visitantes';
  if (['institucion colaboradora', 'instituciones colaboradoras'].includes(normalized)) return 'Instituciones colaboradoras';
  const label = String(value || 'Otros integrantes').trim().replace(/[_-]+/g, ' ');
  return label.charAt(0).toLocaleUpperCase('es-MX') + label.slice(1);
};

const canonicalTeamGroup = (value) => {
  const normalized = normalizeSheetValue(value);
  if (['doctor', 'dr', 'lider', 'liderazgo', 'direccion', 'lider del proyecto', 'lider del laboratorio'].includes(normalized)) return 'doctor';
  if (['miembro', 'miembros', 'colaborador', 'colaboradores'].includes(normalized)) return 'miembros';
  if (['estudiante', 'estudiantes', 'licenciatura', 'licenciaturas'].includes(normalized)) return 'estudiantes';
  if (['doctorado', 'doctorados'].includes(normalized)) return 'doctorados';
  if (['investigador asociado', 'investigadores asociados'].includes(normalized)) return 'investigadores asociados';
  if (['visitante', 'visitantes'].includes(normalized)) return 'visitantes';
  if (['institucion colaboradora', 'instituciones colaboradoras'].includes(normalized)) return 'instituciones colaboradoras';
  return normalized || 'otros integrantes';
};

const defaultTeamGroups = [
  { key: 'doctor', label: 'Líder del laboratorio' },
  { key: 'miembros', label: 'Miembros' },
  { key: 'estudiantes', label: 'Estudiantes' },
  { key: 'maestria', label: 'Maestría' },
  { key: 'doctorados', label: 'Doctorados' },
  { key: 'investigadores asociados', label: 'Investigadores asociados' },
  { key: 'visitantes', label: 'Visitantes' },
  { key: 'instituciones colaboradoras', label: 'Instituciones colaboradoras' },
];

const createPersonRow = (row) => {
  const anchor = document.createElement('a');
  anchor.className = 'team-row';
  anchor.href = `persona.html?id=${encodeURIComponent(String(row.ID).trim())}`;
  const id = safeDomId(`equipo-${row.ID}`);
  if (id) anchor.id = id;
  const identity = document.createElement('span');
  identity.append(createTextElement('strong', row.NOMBRE), createTextElement('small', row.NIVEL_ROL || row.ROL));
  anchor.append(createTextElement('b', row.INICIALES || '—'), identity, createTextElement('p', row.TEMA_INVESTIGACION || row.AREA), createTextElement('i', '→'));
  anchor.lastElementChild.setAttribute('aria-hidden', 'true');
  return anchor;
};

const loadTeam = async () => {
  const directory = document.getElementById('team-directory');
  if (!directory) return false;
  const rows = await fetchSheet('equipo', TEAM_HEADERS);
  const availableRows = rows?.length ? rows : fallbackTeam;
  const activeRows = sortSheetRows(availableRows.filter((row) => isActiveSheetRow(row.ACTIVO)));
  if (!activeRows.length) return false;
  const groups = new Map(defaultTeamGroups.map(({ key, label }) => [key, { label, rows: [] }]));
  activeRows.forEach((row) => {
    const canonicalKey = canonicalTeamGroup(row.GRUPO);
    if (!groups.has(canonicalKey)) groups.set(canonicalKey, { label: formatTeamGroup(row.GRUPO), rows: [] });
    groups.get(canonicalKey).rows.push(row);
  });
  const priority = { doctor: 0, miembros: 1, estudiantes: 2, maestria: 3, doctorados: 4, 'investigadores asociados': 5, visitantes: 6, 'instituciones colaboradoras': 7 };
  const sections = [...groups.entries()].sort(([groupA], [groupB]) => (priority[groupA] ?? 99) - (priority[groupB] ?? 99)).map(([groupKey, group]) => {
    const section = document.createElement('div');
    section.className = 'team-list-section';
    section.id = `grupo-${groupKey.replace(/\s+/g, '-')}`;
    const header = document.createElement('header');
    const count = `${String(group.rows.length).padStart(2, '0')} ${group.rows.length === 1 ? 'integrante' : 'integrantes'}`;
    header.append(createTextElement('h2', group.label), createTextElement('span', count));
    const list = document.createElement('div');
    list.className = 'team-list';
    if (group.rows.length) {
      list.append(...group.rows.map(createPersonRow));
    } else {
      const empty = createTextElement('p', 'Información por agregar.');
      empty.className = 'team-empty';
      list.append(empty);
    }
    section.append(header, list);
    return section;
  });
  directory.replaceChildren(...sections);
  return true;
};

const loadPersonProfile = async () => {
  const profile = document.getElementById('person-profile');
  if (!profile) return false;
  const requestedId = new URLSearchParams(window.location.search).get('id')?.trim() || '';
  const sheetRows = await fetchSheet('equipo', TEAM_HEADERS);
  const availableRows = sheetRows?.length ? sheetRows : fallbackTeam;
  const person = availableRows.find((row) => isActiveSheetRow(row.ACTIVO) && normalizeSheetValue(row.ID) === normalizeSheetValue(requestedId));
  const status = document.getElementById('profile-status');
  const details = document.getElementById('person-details');
  if (!person) {
    document.getElementById('person-name').textContent = 'Perfil no encontrado';
    document.getElementById('person-level').textContent = requestedId ? 'Este integrante no está publicado o el enlace ya no es válido.' : 'Selecciona un nombre desde el directorio del equipo.';
    document.getElementById('person-initials').textContent = '?';
    if (status) status.innerHTML = '<p><a href="equipo.html">Volver al directorio del equipo →</a></p>';
    document.title = 'Perfil no encontrado · LABSEMCO';
    return false;
  }

  const values = {
    RESUMEN: person.RESUMEN,
    TEMA_INVESTIGACION: person.TEMA_INVESTIGACION || person.AREA,
    TITULO_INVESTIGACION: person.TITULO_INVESTIGACION,
    CORREO: person.CORREO,
    PUBLICACIONES: person.PUBLICACIONES,
    GOOGLE_SCHOLAR: person.GOOGLE_SCHOLAR,
  };
  document.getElementById('person-name').textContent = person.NOMBRE;
  document.getElementById('person-level').textContent = person.NIVEL_ROL || person.ROL || 'Nivel o rol por agregar';
  document.getElementById('person-group').textContent = formatTeamGroup(person.GRUPO);
  document.getElementById('person-initials').textContent = person.INICIALES || 'LS';
  const photoImage = document.getElementById('person-photo');
  const photoPlaceholder = document.getElementById('person-photo-placeholder');
  const photo = safeResource(person.FOTO);
  if (photoImage && photoPlaceholder && photo) {
    photoImage.src = photo;
    photoImage.alt = `Fotografía de ${person.NOMBRE}`;
    photoImage.hidden = false;
    photoPlaceholder.hidden = true;
    photoImage.onerror = () => {
      photoImage.hidden = true;
      photoPlaceholder.hidden = false;
    };
  } else if (photoImage && photoPlaceholder) {
    photoImage.hidden = true;
    photoImage.removeAttribute('src');
    photoPlaceholder.hidden = false;
  }
  document.getElementById('person-summary').textContent = values.RESUMEN || 'Información por agregar.';
  document.getElementById('person-topic').textContent = values.TEMA_INVESTIGACION || 'Información por agregar.';
  document.getElementById('person-research-title').textContent = values.TITULO_INVESTIGACION || 'Información por agregar.';
  document.getElementById('person-publications').textContent = values.PUBLICACIONES || 'Información por agregar.';
  const email = String(values.CORREO || '').trim();
  const emailLink = document.getElementById('person-email');
  if (emailLink && email) {
    emailLink.textContent = email.replace(/^mailto:/i, '');
    emailLink.href = /^mailto:/i.test(email) ? email : `mailto:${email}`;
  } else if (emailLink) {
    emailLink.textContent = 'Correo institucional por agregar';
    emailLink.removeAttribute('href');
  }
  const scholar = safeResource(values.GOOGLE_SCHOLAR);
  const scholarLink = document.getElementById('person-scholar');
  if (scholarLink && scholar) {
    scholarLink.href = scholar;
    scholarLink.textContent = 'Consultar Google Scholar ↗';
    scholarLink.removeAttribute('aria-disabled');
  } else if (scholarLink) {
    scholarLink.removeAttribute('href');
    scholarLink.textContent = 'Vínculo de Google Scholar por agregar';
    scholarLink.setAttribute('aria-disabled', 'true');
  }
  document.querySelectorAll('[data-profile-field]').forEach((element) => {
    element.hidden = false;
  });
  if (details) details.hidden = false;
  if (status) {
    const hasExtendedProfile = ['RESUMEN', 'TITULO_INVESTIGACION', 'CORREO', 'PUBLICACIONES', 'GOOGLE_SCHOLAR'].some((key) => String(values[key] || '').trim());
    status.hidden = hasExtendedProfile;
    status.innerHTML = '<p>Este perfil ya está conectado; la información complementaria se añadirá desde la pestaña Equipo.</p>';
  }
  document.title = `${person.NOMBRE} · LABSEMCO`;
  return true;
};

const loadEvents = async () => {
  const container = document.getElementById('events-list');
  if (!container) return false;
  const rows = await fetchSheet('divulgacion', ['ID', 'TIPO', 'TITULO', 'FECHA', 'LUGAR', 'DESCRIPCION', 'ENLACE', 'ACTIVO', 'ORDEN']);
  const activeRows = rows && sortSheetRows(rows.filter((row) => isActiveSheetRow(row.ACTIVO)));
  if (!activeRows?.length) return false;
  const events = activeRows.map((row) => {
    const article = document.createElement('article');
    article.className = 'event-card';
    const meta = createTextElement('p', [row.FECHA, row.LUGAR].filter(Boolean).join(' · '), 'event-meta');
    article.append(createTextElement('small', row.TIPO || 'Evento'), createTextElement('h3', row.TITULO), meta, createTextElement('p', row.DESCRIPCION));
    const url = safeResource(row.ENLACE);
    if (url) {
      const link = createTextElement('a', row.TEXTO_ENLACE || 'Más información ↗', 'project-link');
      link.href = url;
      if (/^https?:\/\//i.test(url)) { link.target = '_blank'; link.rel = 'noopener noreferrer'; }
      article.append(link);
    }
    return article;
  });
  container.replaceChildren(...events);
  return true;
};

const loadLinks = async () => {
  const container = document.getElementById('contact-links');
  if (!container) return false;
  const rows = await fetchSheet('enlaces', ['ID', 'SECCION', 'TEXTO', 'URL', 'ACTIVO', 'ORDEN']);
  const activeRows = rows && sortSheetRows(rows.filter((row) => isActiveSheetRow(row.ACTIVO) && normalizeSheetValue(row.SECCION) === 'contacto'));
  if (!activeRows?.length) return false;
  const links = activeRows.map((row) => {
    const anchor = createTextElement('a', row.TEXTO);
    anchor.href = safeResource(row.URL) || '#';
    if (/^https?:\/\//i.test(row.URL)) {
      anchor.target = '_blank';
      anchor.rel = 'noreferrer';
    }
    return anchor;
  });
  container.replaceChildren(...links);
  return true;
};

const initCarousel = () => {
  const carousel = document.querySelector('.carousel');
  if (!carousel) return;
  const track = carousel.querySelector('.carousel-track');
  const slides = [...carousel.querySelectorAll('.carousel-slide')];
  const dots = [...carousel.querySelectorAll('.carousel-dots button')];
  const currentLabel = carousel.querySelector('.carousel-current');
  const previousButton = carousel.querySelector('.carousel-prev');
  const nextButton = carousel.querySelector('.carousel-next');
  if (!track || !slides.length || !previousButton || !nextButton) return;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let activeIndex = 0;
  let timer;
  const showSlide = (index) => {
    activeIndex = (index + slides.length) % slides.length;
    track.style.transform = `translateX(-${activeIndex * 100}%)`;
    slides.forEach((slide, slideIndex) => {
      const isActive = slideIndex === activeIndex;
      slide.classList.toggle('is-active', isActive);
      slide.setAttribute('aria-hidden', String(!isActive));
      const anchor = slide.querySelector('a');
      if (anchor) anchor.tabIndex = isActive ? 0 : -1;
    });
    dots.forEach((dot, dotIndex) => {
      const isActive = dotIndex === activeIndex;
      dot.classList.toggle('is-active', isActive);
      dot.setAttribute('aria-selected', String(isActive));
    });
    if (currentLabel) currentLabel.textContent = String(activeIndex + 1).padStart(2, '0');
  };
  const stopAutoPlay = () => window.clearInterval(timer);
  const startAutoPlay = () => {
    stopAutoPlay();
    if (!reduceMotion) timer = window.setInterval(() => showSlide(activeIndex + 1), 6500);
  };
  previousButton.addEventListener('click', () => { showSlide(activeIndex - 1); startAutoPlay(); });
  nextButton.addEventListener('click', () => { showSlide(activeIndex + 1); startAutoPlay(); });
  dots.forEach((dot, index) => dot.addEventListener('click', () => { showSlide(index); startAutoPlay(); }));
  carousel.addEventListener('mouseenter', stopAutoPlay);
  carousel.addEventListener('mouseleave', startAutoPlay);
  carousel.addEventListener('focusin', stopAutoPlay);
  carousel.addEventListener('focusout', startAutoPlay);
  carousel.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowLeft') showSlide(activeIndex - 1);
    if (event.key === 'ArrowRight') showSlide(activeIndex + 1);
  });
  document.addEventListener('visibilitychange', () => document.hidden ? stopAutoPlay() : startAutoPlay());
  showSlide(0);
  startAutoPlay();
};

if (carouselSection && homeHero) homeHero.insertAdjacentElement('afterend', carouselSection);

if (menuButton && navigation && sidebar) {
  const menuLabel = menuButton.querySelector('.sr-only');
  const setMenuState = (isOpen, returnFocus = false) => {
    menuButton.setAttribute('aria-expanded', String(isOpen));
    navigation.classList.toggle('open', isOpen);
    sidebar.classList.toggle('is-expanded', isOpen);
    if (menuLabel) menuLabel.textContent = isOpen ? 'Cerrar menú' : 'Abrir menú';
    if (returnFocus) menuButton.focus();
  };

  menuButton.addEventListener('click', () => setMenuState(menuButton.getAttribute('aria-expanded') !== 'true'));
  navLinks.forEach((link) => link.addEventListener('click', () => setMenuState(false)));
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && menuButton.getAttribute('aria-expanded') === 'true') setMenuState(false, true);
  });
  document.addEventListener('pointerdown', (event) => {
    if (menuButton.getAttribute('aria-expanded') === 'true' && !sidebar.contains(event.target)) setMenuState(false);
  });
}

const sections = [...document.querySelectorAll('main section[id]')];
if ('IntersectionObserver' in window && inPageNavLinks.length) {
  const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      inPageNavLinks.forEach((link) => link.classList.toggle('active', link.getAttribute('href') === '#' + entry.target.id));
    });
  }, { rootMargin: '-35% 0px -55% 0px' });
  sections.forEach((section) => sectionObserver.observe(section));
}

const initializeContent = async () => {
  const results = await Promise.all([loadDesign(), loadPageImage(), loadStaticContent(), loadCarousel(), loadResearch(), loadProjects(), loadTeam(), loadPersonProfile(), loadEvents(), loadLinks()]);
  document.documentElement.dataset.contentSource = results.some(Boolean) ? 'google-sheets' : 'local';
  initCarousel();
};

initializeContent();
