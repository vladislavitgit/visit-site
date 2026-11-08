export function initializeIndicator(panel, items, getActive, onResize = () => {}) {
    let hovered;
    function move(item) {
        panel.style.setProperty('--nav-x', `${item.offsetLeft}px`);
        panel.style.setProperty('--nav-width', `${item.offsetWidth}px`);
    }
    function reset() {
        move(hovered || (items.includes(document.activeElement) ? document.activeElement : getActive()));
    }
    items.forEach(item => {
        item.addEventListener('pointerenter', () => {
            hovered = item;
            move(item);
        });
        item.addEventListener('focus', () => move(item));
    });
    panel.addEventListener('pointerleave', () => {
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
