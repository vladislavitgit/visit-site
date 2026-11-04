const content = document.getElementById('content');
const homeContent = document.createDocumentFragment();
homeContent.append(...Array.from(content.childNodes, node => node.cloneNode(true)));
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const pages = Object.fromEntries(['home', 'about', 'contacts', 'reviews'].map(page => [
    page,
    { link: document.getElementById(`nav-${page}`), template: document.getElementById(`${page}-template`) }
]));
const timers = new Set();
let currentPage = 'home';
let transitionId = 0;

function schedule(callback, delay, id) {
    const timer = setTimeout(() => {
        timers.delete(timer);
        if (id === transitionId) callback();
    }, delay);
    timers.add(timer);
}

function initializeContactsMap() {
    const container = document.getElementById('contacts-map');
    if (!container) return;
    const script = document.createElement('script');
    script.async = true;
    script.charset = 'utf-8';
    script.src = 'https://api-maps.yandex.ru/services/constructor/1.0/js/?um=constructor%3A0d15896ab19a686df7d42f3577a51427f5d81a88d6eb0e412e3c3c3ef89835cc&width=100%25&height=100%25&lang=ru_RU&scroll=true';
    container.append(script);
}

function renderPage(page, id) {
    if (id !== transitionId) return;
    content.replaceChildren(page === 'home' ? homeContent.cloneNode(true) : pages[page].template.content.cloneNode(true));
    if (page === 'contacts') initializeContactsMap();
    content.classList.remove('fade-out', 'staged-in');
    if (reducedMotion.matches) return;
    const elements = [...content.children];
    content.classList.add('staged-in');
    requestAnimationFrame(() => {
        if (id !== transitionId) return;
        elements.forEach((element, index) => schedule(() => element.classList.add('stagger-in'), index * 300, id));
    });
    schedule(() => {
        content.classList.remove('staged-in');
        elements.forEach(element => element.classList.remove('stagger-in'));
    }, Math.max(700, (elements.length - 1) * 300 + 320), id);
}

function switchPage() {
    const hash = window.location.hash.slice(1);
    const page = Object.hasOwn(pages, hash) ? hash : 'home';
    if (page === currentPage) return;
    currentPage = page;
    const id = ++transitionId;
    timers.forEach(clearTimeout);
    timers.clear();
    content.classList.remove('fade-out', 'staged-in');
    [...content.children].forEach(element => element.classList.remove('stagger-in'));
    document.body.classList.add('view-switched');
    Object.entries(pages).forEach(([name, data]) => {
        data.link.classList.toggle('active', name === page);
        if (name === page) data.link.setAttribute('aria-current', 'page');
        else data.link.removeAttribute('aria-current');
    });
    if (reducedMotion.matches) renderPage(page, id);
    else {
        content.classList.add('fade-out');
        schedule(() => renderPage(page, id), 440, id);
    }
}

window.addEventListener('hashchange', switchPage);
switchPage();
