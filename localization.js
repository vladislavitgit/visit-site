import { initializeIndicator } from './indicator.js';

const messages = {
    github: ['My GitHub account', 'My GitHub account'],
    home: ['Главная', 'Home'],
    about: ['Обо мне', 'About me'],
    contacts: ['Контакты', 'Contact'],
    reviews: ['Отзывы', 'Reviews'],
    name: ['Владислав', 'Vladislav'],
    profession: ['веб-разработка', 'web development'],
    welcomeFirst: ['Добро', 'Welcome'],
    welcomeSecond: ['пожаловать!', 'to my space.'],
    intro: ['На этой странице собраны мои работы, которые я буду копить с опытом, а также информация обо мне.', 'A growing collection of my work as I learn and gain experience, along with a little about me.'],
    sculptureTip: ['Поверните. Нажмите. Исследуйте.', 'Drag. Click. Explore.'],
    sculptureLabel: ['Изменить форму объёмной фигуры', 'Change the 3D shape'],
    catalogTag: ['демо-каталог', 'catalog demo'],
    landingTag: ['демо-лендинг', 'landing demo'],
    catalogProject: ['Пример сайта-каталога', 'Product catalog demo'],
    travelProject: ['Пример туристического лендинга', 'Travel landing page demo'],
    bioName: ['Меня зовут Владислав,', 'My name is Vladislav.'],
    bioAge: ['мне', 'I’m'],
    bioWork: ['Я занимаюсь веб-разработкой и дизайном простых сайтов и каталогов.', 'I build and design simple websites and product catalogs.'],
    bioTools: ['Работаю с HTML, CSS и JavaScript, соединением сайта с Google Таблицами и Telegram-ботами.', 'I work with HTML, CSS and JavaScript, and connect websites to Google Sheets and Telegram bots.'],
    bioContact: ['Вы можете увидеть мои проекты на Главной, а так же связаться со мной через мою рабочую почту/телеграм.', 'Explore my projects on the home page, or get in touch by email or Telegram.'],
    email: ['Почта:', 'Email:'],
    telegram: ['Телеграм:', 'Telegram:'],
    copyEmail: ['Скопировать адрес почты', 'Copy email address'],
    copyTelegram: ['Скопировать имя пользователя Telegram', 'Copy Telegram username'],
    emailCopied: ['Адрес почты скопирован', 'Email address copied'],
    telegramCopied: ['Имя пользователя Telegram скопировано', 'Telegram username copied'],
    copyFailed: ['Не удалось скопировать. Текст можно выделить вручную.', 'Couldn’t copy. You can select and copy the text manually.'],
    reviewsFirst: ['Здесь будут отзывы', 'Feedback on my work'],
    reviewsSecond: ['о моей работе.', 'will appear here.'],
    mainMenu: ['Основное меню', 'Main navigation'],
    language: ['Язык сайта', 'Site language'],
    description: ['Личный сайт: обо мне, контакты, отзывы и примеры работ.', 'Vladislav’s personal portfolio: projects, web development, contact details and testimonials.']
};
let language = 'ru';

export function translate(key) {
    return messages[key][language === 'en' ? 1 : 0];
}

export function initializeLanguage(onChange, reducedMotion) {
    const elements = document.querySelectorAll('[data-i18n]');
    const attributes = ['aria-label', 'title', 'content', 'data-success'];
    const buttons = [...document.querySelectorAll('[data-language]')];
    const panel = document.querySelector('.language-switch');
    const attributeTargets = attributes.flatMap(attribute =>
        [...document.querySelectorAll(`[data-i18n-${attribute}]`)].map(element => ({
            element,
            attribute,
            key: element.getAttribute(`data-i18n-${attribute}`)
        }))
    );
    const viewTargets = new Map([...document.querySelectorAll('.page-view')].map(view => {
        const targets = [...view.querySelectorAll('.reveal, .sculpture-tip')].filter(element =>
            !element.classList.contains('sculpture-stage') &&
            (element.matches('[data-i18n], .tool-stack') || element.querySelector('[data-i18n]'))
        );
        return [view, targets];
    }));
    let animationTimer;
    let animatedTargets = [];
    const moveIndicator = initializeIndicator(panel, buttons, () => buttons.find(button => button.dataset.language === language));
    function applyLanguage(next, animate = false) {
        language = next === 'en' ? 'en' : 'ru';
        document.documentElement.lang = language;
        elements.forEach(element => element.textContent = translate(element.dataset.i18n));
        attributeTargets.forEach(({ element, attribute, key }) => element.setAttribute(attribute, translate(key)));
        buttons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.language === language)));
        moveIndicator(buttons.find(button => button.dataset.language === language));
        onChange();
        clearTimeout(animationTimer);
        animatedTargets.forEach(element => element.classList.remove('language-reveal'));
        animatedTargets = [];
        if (animate && !reducedMotion.matches) {
            const view = document.querySelector('.page-view:not([hidden])');
            animatedTargets = viewTargets.get(view);
            view.classList.remove('is-entering');
            void view.offsetWidth;
            animatedTargets.forEach(element => element.classList.add('language-reveal'));
            animationTimer = setTimeout(() => animatedTargets.forEach(element => element.classList.remove('language-reveal')), 1200);
        }
    }
    try {
        language = localStorage.getItem('visit-site-language') || 'ru';
    } catch {}
    applyLanguage(language);
    buttons.forEach(button => button.addEventListener('click', () => {
        if (button.dataset.language === language) return;
        applyLanguage(button.dataset.language, true);
        try {
            localStorage.setItem('visit-site-language', language);
        } catch {}
    }));
}
