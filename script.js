const content = document.getElementById('content');
const homeContent = content.innerHTML;
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

const EXIT_DURATION = 440;
const STAGGER_DELAY = 300;
const ENTER_DURATION = 700;

const pages = {
    home: {
        link: document.getElementById('nav-home'),
        template: null
    },
    about: {
        link: document.getElementById('nav-about'),
        template: document.getElementById('about-template')
    },
    contacts: {
        link: document.getElementById('nav-contacts'),
        template: document.getElementById('contacts-template')
    },
    reviews: {
        link: document.getElementById('nav-reviews'),
        template: document.getElementById('reviews-template')
    }
};

let currentPage = 'home';
let transitionId = 0;
let timers = [];

function clearTransition() {
    timers.forEach(timerId => clearTimeout(timerId));
    timers = [];

    content.classList.remove('fade-out', 'staged-in');
    [...content.children].forEach(element => {
        element.classList.remove('stagger-in');
    });
}

function schedule(callback, delay, id) {
    const timerId = setTimeout(() => {
        if (id === transitionId) callback();
    }, delay);
    timers.push(timerId);
}

// Ссылка на опубликованную таблицу Google Sheets в формате CSV
const PRODUCTS_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSO2bOg9tzrlDoGm4Z5D7P8wWfS3lAg__mT_iVOb74ZSOiQk2p115IC1vM1HfveBlMOadzPomIqF0TU/pub?gid=0&single=true&output=csv';

// Преобразование CSV в массив строк с учётом кавычек
function parseCSV(text) {
    const rows = [];
    let row = [];
    let cell = '';
    let quoted = false;

    for (let i = 0; i < text.length; i++) {
        const char = text[i];
        const next = text[i + 1];

        if (char === '"' && quoted && next === '"') {
            cell += '"';
            i++;
        } else if (char === '"') {
            quoted = !quoted;
        } else if (char === ',' && !quoted) {
            row.push(cell.trim());
            cell = '';
        } else if ((char === '\n' || char === '\r') && !quoted) {
            if (char === '\r' && next === '\n') i++;

            row.push(cell.trim());

            if (row.some(value => value !== '')) {
                rows.push(row);
            }
            row = [];
            cell = '';
        } else {
            cell += char;
        }
    }
    row.push(cell.trim());
    if (row.some(value => value !== '')) {
        rows.push(row);
    }
    return rows;
}
// Нормализация названий колонок
function normalizeHeader(value) {
    return value
        .replace(/^\uFEFF/, '')
        .trim()
        .toLowerCase()
        .replace(/ё/g, 'е');
}
// Поиск нужной колонки по названию
function findColumn(headers, aliases) {
    return headers.findIndex(header =>
        aliases.includes(normalizeHeader(header))
    );
}
let productsRequestId = 0;
async function loadProducts() {
    const container = document.getElementById('products');
    if (!container) return;

    const requestId = ++productsRequestId;
    container.setAttribute('aria-busy', 'true');
    container.replaceChildren();

    const status = document.createElement('p');
    status.className = 'products-status';
    status.textContent = 'Загрузка товаров...';
    container.append(status);

    try {
        const response = await fetch(PRODUCTS_CSV_URL, { cache: 'no-store' });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const rows = parseCSV(await response.text());
        if (requestId !== productsRequestId || !container.isConnected) return;
        if (rows.length < 2) {
            status.textContent = 'Товаров пока нет.';
            return;
        }
        const headers = rows[0];
        const nameIndex = findColumn(headers, ['название']);
        const priceIndex = findColumn(headers, ['цена']);
        const quantityIndex = findColumn(headers, ['наличие шт']);
        const availabilityIndex = findColumn(headers, ['наличие в магазинах']);
        if (nameIndex === -1) throw new Error('Не найдена колонка «название».');
        const products = rows.slice(1)
            .map(row => ({
                name: row[nameIndex] || '',
                price: priceIndex < 0 ? '' : (row[priceIndex] || ''),
                quantity: quantityIndex < 0 ? '' : (row[quantityIndex] || ''),
                availability: availabilityIndex < 0 ? '' : (row[availabilityIndex] || '')
            }))
            .filter(product => product.name);
        if (requestId !== productsRequestId || !container.isConnected) return;
        container.replaceChildren();
        if (!products.length) {
            status.textContent = 'Товаров пока нет.';
            container.append(status);
            return;
        }
        const fragment = document.createDocumentFragment();
        products.forEach((product, index) => {
            const card = document.createElement('article');
            card.className = 'product-card';
            card.style.setProperty('--product-index', index);

            const title = document.createElement('h3');
            title.className = 'product-name';
            title.textContent = product.name;
            card.append(title);
            if (product.price) {
                const price = document.createElement('p');
                price.className = 'product-price';
                price.textContent = `Цена: ${product.price}`;
                card.append(price);
            }
            if (product.quantity) {
                const quantity = document.createElement('p');
                quantity.className = 'product-quantity';
                quantity.textContent = `Количество: ${product.quantity}`;
                card.append(quantity);
            }
            if (product.availability) {
                const availability = document.createElement('p');
                availability.className = 'product-availability';
                availability.textContent = `Наличие в магазинах: ${product.availability}`;
                card.append(availability);
            }
            fragment.append(card);
        });

        container.append(fragment);
        container.setAttribute('aria-busy', 'false');

        // Trigger the CSS transition after the browser has laid out the cards.
        requestAnimationFrame(() => {
            if (requestId !== productsRequestId || !container.isConnected) return;
            container.classList.add('products-loaded');
        });
    } catch (error) {
        if (requestId !== productsRequestId || !container.isConnected) return;
        console.error('Ошибка загрузки товаров:', error);
        container.replaceChildren();
        const errorMessage = document.createElement('p');
        errorMessage.className = 'products-status products-error';
        errorMessage.textContent = 'Не удалось загрузить товары. Проверьте ссылку и доступ к таблице.';
        container.append(errorMessage);
    } finally {
        if (requestId === productsRequestId && container.isConnected) {
            container.setAttribute('aria-busy', 'false');
        }
    }
}
function initializeContactsMap() {
    const container = document.getElementById('contacts-map');
    if (!container || container.dataset.mapLoaded === 'true') {
        return;
    }
    container.dataset.mapLoaded = 'true';
    const mapScript = document.createElement('script');
    mapScript.type = 'text/javascript';
    mapScript.charset = 'utf-8';
    mapScript.async = true;
    mapScript.src = 'https://api-maps.yandex.ru/services/constructor/1.0/js/?um=constructor%3A0d15896ab19a686df7d42f3577a51427f5d81a88d6eb0e412e3c3c3ef89835cc' +
        '&width=100%25&height=100%25&lang=ru_RU&scroll=true';
    container.appendChild(mapScript);
}

document.addEventListener('DOMContentLoaded', () => {
    const openButton = document.getElementById('reservation');
    const overlay = document.getElementById('reservation-overlay');
    const backButton = document.getElementById('reservation-back');
    const form = document.getElementById('reservation-form');
    const status = document.getElementById('reservation-status');

    // Открытие окна
    openButton.addEventListener('click', (event) => {
        event.preventDefault();
        overlay.classList.add('is-open');
        overlay.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
        form.elements.name.focus();
    });
    // Закрытие окна
    function closeModal() {
        overlay.classList.remove('is-open');
        overlay.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';

        openButton.focus();
    }
    // Кнопка «Назад»
    backButton.addEventListener('click', closeModal);
    // Закрытие при клике вне окна
    overlay.addEventListener('click', (event) => {
        if (event.target === overlay) {
            closeModal();
        }
    });
    // Закрытие клавишей Escape
    document.addEventListener('keydown', (event) => {
        if (
            event.key === 'Escape' &&
            overlay.classList.contains('is-open')
        ) {
            closeModal();
        }
    });
    // Отправка формы
    form.addEventListener('submit', async (event) => {
        event.preventDefault();
        const submitButton = form.querySelector('[type="submit"]');
        submitButton.disabled = true;
        status.textContent = 'Отправка...';
        try {
            const response = await fetch('send-telegram.php', {
                method: 'POST',
                body: new FormData(form)
            });
            const result = await response.json();
            if (!response.ok || !result.ok) {
                throw new Error(result.description || 'Ошибка отправки');
            }
            status.textContent = 'Заявка успешно отправлена!';
            form.reset();
        } catch (error) {
            status.textContent = error.message;
        } finally {
            submitButton.disabled = false;
        }
    });
});

function renderPage(page, id) {
    if (id !== transitionId) return;

    if (page === 'home') {
        content.innerHTML = homeContent;
        loadProducts();
    } else {
        content.replaceChildren(pages[page].template.content.cloneNode(true));
    }
    if (page === 'contacts') {
        initializeContactsMap();
    }
    content.classList.remove('fade-out', 'staged-in');
    const elements = [...content.children];

    if (reducedMotion.matches) return;

    content.classList.add('staged-in');

    requestAnimationFrame(() => {
        if (id !== transitionId) return;
        elements.forEach((element, index) => {
            schedule(() => element.classList.add('stagger-in'), index * STAGGER_DELAY, id);
        });
    });

    schedule(() => {
        content.classList.remove('staged-in');
        elements.forEach(element => element.classList.remove('stagger-in'));
    }, ENTER_DURATION, id);
}

function switchPage(page) {
    if (!pages[page] || page === currentPage) return;

    currentPage = page;
    const id = ++transitionId;
    clearTransition();
    document.body.classList.add('view-switched');

    Object.entries(pages).forEach(([name, data]) => {
        data.link.classList.toggle('active', name === page);
    });

    if (reducedMotion.matches) {
        renderPage(page, id);
        return;
    }

    content.classList.add('fade-out');
    schedule(() => renderPage(page, id), EXIT_DURATION, id);
}


Object.entries(pages).forEach(([page, data]) => {
    data.link.addEventListener('click', event => {
        event.preventDefault();
        switchPage(page);
    });
});
loadProducts();

