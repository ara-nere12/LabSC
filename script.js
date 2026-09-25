const menuButton = document.querySelector('.menu-toggle');
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
    const headers = (parsedRows.shift() || []).map((header) => header.trim().toLocaleUpperCase('es-MX'));
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
  const cards = activeRows.map((row) => {
    const article = document.createElement('article');
    article.className = 'impact-card';
    const id = safeDomId(`proyecto-${row.ID}`);
    if (id) article.id = id;
    article.append(createTextElement('span', row.CATEGORIA), createTextElement('h3', row.TITULO), createTextElement('p', row.DESCRIPCION), createTextElement('small', row.ETIQUETAS));
    return article;
  });
  container.replaceChildren(...cards);
  return true;
};

const createPersonCard = (row) => {
  const article = document.createElement('article');
  const id = safeDomId(`equipo-${row.ID}`);
  if (id) article.id = id;
  article.append(createTextElement('b', row.INICIALES), createTextElement('small', row.ROL), createTextElement('h3', row.NOMBRE), createTextElement('p', row.AREA));
  return article;
};

const loadTeam = async () => {
  const leaderSection = document.getElementById('leader-section');
  const leaderList = document.getElementById('leader-list');
  const collaboratorList = document.getElementById('collaborator-list');
  const studentList = document.getElementById('student-list');
  if (!leaderList && !collaboratorList && !studentList) return false;
  const rows = await fetchSheet('equipo', ['ID', 'GRUPO', 'INICIALES', 'NOMBRE', 'ROL', 'AREA', 'ACTIVO', 'ORDEN']);
  const activeRows = rows && sortSheetRows(rows.filter((row) => isActiveSheetRow(row.ACTIVO)));
  if (!activeRows?.length) return false;
  const leaders = activeRows.filter((row) => ['lider', 'liderazgo'].includes(normalizeSheetValue(row.GRUPO)));
  const collaborators = activeRows.filter((row) => normalizeSheetValue(row.GRUPO) === 'colaboradores');
  const students = activeRows.filter((row) => normalizeSheetValue(row.GRUPO) === 'estudiantes');
  if (leaderList && leaders.length) {
    leaderList.replaceChildren(...leaders.map(createPersonCard));
    if (leaderSection) leaderSection.hidden = false;
  }
  if (collaboratorList && collaborators.length) collaboratorList.replaceChildren(...collaborators.map(createPersonCard));
  if (studentList && students.length) studentList.replaceChildren(...students.map(createPersonCard));
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

if (menuButton && navigation) {
  menuButton.addEventListener('click', () => {
    const isOpen = menuButton.getAttribute('aria-expanded') === 'true';
    menuButton.setAttribute('aria-expanded', String(!isOpen));
    navigation.classList.toggle('open', !isOpen);
  });
  navLinks.forEach((link) => link.addEventListener('click', () => {
    navigation.classList.remove('open');
    menuButton.setAttribute('aria-expanded', 'false');
  }));
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
  const results = await Promise.all([loadStaticContent(), loadCarousel(), loadResearch(), loadProjects(), loadTeam(), loadLinks()]);
  document.documentElement.dataset.contentSource = results.some(Boolean) ? 'google-sheets' : 'local';
  initCarousel();
};

initializeContent();
