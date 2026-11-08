export function initializeIndicator(panel, items, getActive, onResize = () => {}) {
    const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
    let hovered;
    let position;
    let width;
    function move(item) {
        const nextPosition = item.offsetLeft;
        const nextWidth = item.offsetWidth;
        if (position !== nextPosition) {
            position = nextPosition;
            panel.style.setProperty('--nav-x', `${position}px`);
        }
        if (width !== nextWidth) {
            width = nextWidth;
            panel.style.setProperty('--nav-width', `${width}px`);
        }
    }
    function reset() {
        const focused = items.includes(document.activeElement) && document.activeElement.matches(':focus-visible');
        move(hovered || (focused ? document.activeElement : getActive()));
    }
    items.forEach(item => {
        item.addEventListener('pointerenter', event => {
            if (event.pointerType === 'touch' || !finePointer.matches) return;
            hovered = item;
            move(item);
        });
        item.addEventListener('focus', () => {
            if (item.matches(':focus-visible')) move(item);
        });
    });
    panel.addEventListener('pointerdown', event => {
        if (event.pointerType === 'touch') hovered = null;
    });
    panel.addEventListener('pointerleave', event => {
        if (event.pointerType === 'touch') return;
        hovered = null;
        reset();
    });
    panel.addEventListener('focusout', () => requestAnimationFrame(reset));
    const resize = () => {
        reset();
        onResize();
    };
    let resizeFrame = 0;
    if ('ResizeObserver' in window) new ResizeObserver(() => {
        if (resizeFrame) return;
        resizeFrame = requestAnimationFrame(() => {
            resizeFrame = 0;
            resize();
        });
    }).observe(panel);
    else window.addEventListener('resize', resize);
    requestAnimationFrame(() => {
        reset();
        panel.classList.add('is-ready');
    });
    return move;
}
