import { initializeSculpture } from './sculpture.js';
import { initializeLanguage, translate } from './localization.js';

const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const nav = document.querySelector('.nav');
const links = [...nav.querySelectorAll('a')];
const views = [...document.querySelectorAll('.page-view')];
const pages = ['home', 'about', 'contacts', 'reviews'];
let currentPage = '';
let requestedPage = '';
let transitionId = 0;
let swapTimer;
let entranceTimer;

function moveIndicator(link) {
    nav.style.setProperty('--nav-x', `${link.offsetLeft}px`);
    nav.style.setProperty('--nav-width', `${link.offsetWidth}px`);
}

function highlightNavigation(page) {
    links.forEach(link => {
        if (link.id === `nav-${page}`) link.setAttribute('aria-current', 'page');
        else link.removeAttribute('aria-current');
    });
    moveIndicator(document.getElementById(`nav-${page}`));
}

function showPage(page, id) {
    if (id !== transitionId) return;
    const changed = currentPage !== page;
    views.forEach(view => {
        view.hidden = view.id !== `${page}-view`;
        view.inert = view.hidden;
        view.classList.remove('is-leaving', 'is-entering');
    });
    currentPage = page;
    const view = document.getElementById(`${page}-view`);
    if (changed) window.scrollTo({ top: 0, behavior: 'instant' });
    updateTitle();
    if (reducedMotion.matches) return;
    void view.offsetWidth;
    view.classList.add('is-entering');
    entranceTimer = setTimeout(() => {
        if (id === transitionId) view.classList.remove('is-entering');
    }, 1200);
}

function switchPage() {
    const hash = location.hash.slice(1);
    const page = pages.includes(hash) ? hash : 'home';
    if (page === requestedPage) return;
    requestedPage = page;
    const id = ++transitionId;
    clearTimeout(swapTimer);
    clearTimeout(entranceTimer);
    highlightNavigation(page);
    if (!currentPage || reducedMotion.matches) {
        showPage(page, id);
        return;
    }
    const outgoing = document.getElementById(`${currentPage}-view`);
    if (currentPage === page) {
        outgoing.classList.remove('is-leaving', 'is-entering');
        outgoing.inert = false;
        return;
    }
    outgoing.classList.remove('is-entering');
    outgoing.classList.add('is-leaving');
    outgoing.inert = true;
    swapTimer = setTimeout(() => showPage(page, id), 210);
}

links.forEach(link => {
    link.addEventListener('pointerenter', () => moveIndicator(link));
    link.addEventListener('focus', () => moveIndicator(link));
    link.addEventListener('click', () => {
        if (link.id === `nav-${currentPage}` && currentPage === requestedPage) {
            window.scrollTo({ top: 0, behavior: reducedMotion.matches ? 'instant' : 'smooth' });
        }
    });
});
nav.addEventListener('pointerleave', () => highlightNavigation(requestedPage));
nav.addEventListener('focusout', event => {
    if (!nav.contains(event.relatedTarget)) highlightNavigation(requestedPage);
});
window.addEventListener('hashchange', switchPage);
const resizeNavigation = () => {
    highlightNavigation(requestedPage);
    if (currentPage !== requestedPage) {
        clearTimeout(swapTimer);
        showPage(requestedPage, transitionId);
    }
};
if ('ResizeObserver' in window) new ResizeObserver(resizeNavigation).observe(nav);
else window.addEventListener('resize', resizeNavigation);
reducedMotion.addEventListener('change', () => {
    clearTimeout(swapTimer);
    clearTimeout(entranceTimer);
    showPage(requestedPage, ++transitionId);
});

const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
document.querySelectorAll('.spotlight').forEach(element => {
    let frame = 0;
    let x = 0;
    let y = 0;
    element.addEventListener('pointermove', event => {
        if (!finePointer.matches || reducedMotion.matches) return;
        x = event.clientX;
        y = event.clientY;
        if (frame) return;
        frame = requestAnimationFrame(() => {
            const bounds = element.getBoundingClientRect();
            element.style.setProperty('--pointer-x', `${x - bounds.left}px`);
            element.style.setProperty('--pointer-y', `${y - bounds.top}px`);
            frame = 0;
        });
    });
});

const copyStatus = document.getElementById('copy-status');
let toastTimer;
document.querySelectorAll('.copy-button').forEach(button => button.addEventListener('click', async () => {
    try {
        await navigator.clipboard.writeText(button.dataset.copy);
        copyStatus.textContent = button.dataset.success;
    } catch {
        copyStatus.textContent = translate('copyFailed');
    }
    clearTimeout(toastTimer);
    copyStatus.classList.add('is-visible');
    toastTimer = setTimeout(() => copyStatus.classList.remove('is-visible'), 3000);
}));

function updateTitle() {
    document.title = `${translate(requestedPage || 'home')} — ${translate('name')}`;
}
initializeLanguage(() => {
    updateTitle();
    clearTimeout(toastTimer);
    copyStatus.classList.remove('is-visible');
    requestAnimationFrame(() => highlightNavigation(requestedPage || 'home'));
});
switchPage();
requestAnimationFrame(() => nav.classList.add('is-ready'));
initializeSculpture(document.querySelector('.sculpture'), reducedMotion);
