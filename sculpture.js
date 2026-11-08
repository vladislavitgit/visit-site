export function initializeSculpture(button, reducedMotion) {
    const canvas = button.querySelector('canvas');
    const context = canvas.getContext('2d');
    if (!context) {
        button.hidden = true;
        document.getElementById('sculpture-tip').hidden = true;
        return;
    }
    const rows = 144;
    const columns = 24;
    const planetColumns = 14;
    const tau = Math.PI * 2;
    const shapes = [0, 1, 2].map(createShape);
    let mode = 0;
    let previousSaturn = 0;
    let previous = shapes[0];
    let target = shapes[0];
    let progress = 1;
    let width = 0;
    let height = 0;
    let frame = 0;
    let lastTime = 0;
    let visible = false;
    let angle = 0;
    let pitch = -.55;
    let yaw = -.25;
    let targetPitch = pitch;
    let targetYaw = yaw;
    let dragPitch = pitch;
    let dragYaw = yaw;
    let dragging = false;
    let distance = 0;
    let pointerX = 0;
    let pointerY = 0;

    function createShape(shape) {
        const points = [];
        for (let row = 0; row < rows; row++) {
            const u = row / rows * tau;
            let center;
            let normal;
            let binormal;
            if (shape === 0) {
                const radius = 1.35 + .5 * Math.cos(3 * u);
                center = [radius * Math.cos(2 * u), radius * Math.sin(2 * u), .5 * Math.sin(3 * u)];
                const tangent = [
                    -1.5 * Math.sin(3 * u) * Math.cos(2 * u) - 2 * radius * Math.sin(2 * u),
                    -1.5 * Math.sin(3 * u) * Math.sin(2 * u) + 2 * radius * Math.cos(2 * u),
                    1.5 * Math.cos(3 * u)
                ];
                const length = Math.hypot(...tangent);
                const t = tangent.map(value => value / length);
                const nLength = Math.hypot(t[0], t[1]);
                normal = [t[1] / nLength, -t[0] / nLength, 0];
                binormal = [-t[2] * normal[1], t[2] * normal[0], t[0] * normal[1] - t[1] * normal[0]];
            }
            for (let column = 0; column < columns; column++) {
                const v = column / columns * tau;
                if (shape === 0) {
                    points.push(center.map((value, axis) => value + .24 * (normal[axis] * Math.cos(v) + binormal[axis] * Math.sin(v))));
                } else if (shape === 1) {
                    const twist = 2 * u;
                    const across = .48 * Math.cos(v);
                    const height = .22 * Math.sin(v);
                    const radius = 1.3 + .14 * Math.cos(3 * u) + across * Math.cos(twist) - height * Math.sin(twist);
                    points.push([radius * Math.cos(u), radius * Math.sin(u), .28 * Math.sin(3 * u) + across * Math.sin(twist) + height * Math.cos(twist)]);
                } else {
                    if (column < planetColumns) {
                        const latitude = column / (planetColumns - 1) * Math.PI;
                        const radius = 1.05 * Math.sin(latitude);
                        points.push([radius * Math.cos(u), radius * Math.sin(u), .96 * Math.cos(latitude)]);
                    } else {
                        const crossSection = (column - planetColumns) / (columns - planetColumns) * tau;
                        const radius = 1.78 + .38 * Math.cos(crossSection);
                        points.push([radius * Math.cos(u), radius * Math.sin(u), .16 * Math.sin(crossSection)]);
                    }
                }
            }
        }
        return points;
    }

    function requestFrame() {
        if (frame || !visible || document.hidden) return;
        frame = requestAnimationFrame(draw);
    }

    function draw(time) {
        frame = 0;
        const delta = lastTime ? Math.min((time - lastTime) / 1000, .05) : 0;
        lastTime = time;
        if (!reducedMotion.matches) {
            angle += delta * .11;
            progress = Math.min(1, progress + delta / .95);
            pitch += (targetPitch - pitch) * .09;
            yaw += (targetYaw - yaw) * .09;
        } else {
            progress = 1;
            pitch = targetPitch;
            yaw = targetYaw;
        }
        const mix = progress * progress * (3 - 2 * progress);
        const saturn = previousSaturn + ((mode === 2 ? 1 : 0) - previousSaturn) * mix;
        const cosX = Math.cos(pitch);
        const sinX = Math.sin(pitch);
        const cosY = Math.cos(yaw + angle);
        const sinY = Math.sin(yaw + angle);
        const cosZ = Math.cos(-.36);
        const sinZ = Math.sin(-.36);
        const scale = Math.min(width, height) * 1.16;
        context.clearRect(0, 0, width, height);
        const glow = context.createRadialGradient(width * .5, height * .5, 0, width * .5, height * .5, width * .46);
        glow.addColorStop(0, 'rgba(163, 204, 144, .045)');
        glow.addColorStop(1, 'rgba(163, 204, 144, 0)');
        context.fillStyle = glow;
        context.fillRect(0, 0, width, height);
        function rotate([x, y, z]) {
            const y1 = y * cosX - z * sinX;
            const z1 = y * sinX + z * cosX;
            const x1 = x * cosY + z1 * sinY;
            return [x1 * cosZ - y1 * sinZ, x1 * sinZ + y1 * cosZ, -x * sinY + z1 * cosY];
        }
        function project(point) {
            const [x, y, z] = rotate(point);
            const perspective = scale / (5.8 + z);
            return [x * perspective + width / 2, y * perspective + height / 2, z];
        }
        const projected = target.map((point, index) => {
            const origin = previous[index];
            return project(point.map((value, axis) => origin[axis] + (value - origin[axis]) * mix));
        });
        context.lineWidth = .65;
        for (let row = 0; row < rows; row++) {
            const start = row * columns;
            const depth = projected[start][2];
            const opacity = .15 + Math.max(0, 2 - depth) * .17;
            context.strokeStyle = `rgba(189, 220, 173, ${opacity})`;
            context.beginPath();
            for (let column = 0; column < columns; column++) {
                const point = projected[start + column];
                if (column === 0 || column === planetColumns) context.moveTo(point[0], point[1]);
                else context.lineTo(point[0], point[1]);
            }
            context.stroke();
            if (saturn > 0) {
                context.strokeStyle = `rgba(189, 220, 173, ${opacity * saturn})`;
                context.beginPath();
                context.moveTo(projected[start + columns - 1][0], projected[start + columns - 1][1]);
                context.lineTo(projected[start + planetColumns][0], projected[start + planetColumns][1]);
                context.stroke();
            }
            if (saturn < 1) {
                context.strokeStyle = `rgba(189, 220, 173, ${opacity * (1 - saturn)})`;
                context.beginPath();
                for (const [from, to] of [[planetColumns - 1, planetColumns], [columns - 1, 0]]) {
                    context.moveTo(projected[start + from][0], projected[start + from][1]);
                    context.lineTo(projected[start + to][0], projected[start + to][1]);
                }
                context.stroke();
            }
        }
        for (let column = 0; column < columns; column++) {
            context.strokeStyle = column % 4 === 0 ? 'rgba(212, 239, 199, .65)' : 'rgba(172, 199, 157, .18)';
            context.beginPath();
            for (let row = 0; row <= rows; row++) {
                const point = projected[(row % rows) * columns + column];
                if (row === 0) context.moveTo(point[0], point[1]);
                else context.lineTo(point[0], point[1]);
            }
            context.stroke();
        }
        context.lineWidth = 1.2;
        for (const column of [0, 8]) {
            const head = Math.floor((angle * 2 + column / columns) % 1 * rows);
            for (let step = 0; step < 26; step++) {
                const a = projected[((head - step + rows) % rows) * columns + column];
                const b = projected[((head - step - 1 + rows) % rows) * columns + column];
                const opacity = (1 - step / 26) * .8 / (1 + Math.max(0, a[2]) * .6);
                context.strokeStyle = `rgba(227, 255, 211, ${opacity})`;
                context.beginPath();
                context.moveTo(a[0], a[1]);
                context.lineTo(b[0], b[1]);
                context.stroke();
            }
        }
        if (!reducedMotion.matches && visible && !document.hidden) requestFrame();
    }

    function resize() {
        const bounds = button.getBoundingClientRect();
        if (!bounds.width || !bounds.height) return;
        width = bounds.width;
        height = bounds.height;
        const ratio = Math.min(devicePixelRatio || 1, 1.75);
        canvas.width = Math.round(width * ratio);
        canvas.height = Math.round(height * ratio);
        context.setTransform(ratio, 0, 0, ratio, 0, 0);
        requestFrame();
    }

    button.addEventListener('pointerdown', event => {
        if (event.button !== 0) return;
        dragging = true;
        distance = 0;
        pointerX = event.clientX;
        pointerY = event.clientY;
        button.setPointerCapture(event.pointerId);
        button.classList.add('is-dragging');
    });
    button.addEventListener('pointermove', event => {
        if (dragging) {
            const dx = event.clientX - pointerX;
            const dy = event.clientY - pointerY;
            distance += Math.abs(dx) + Math.abs(dy);
            dragYaw += dx * .006;
            dragPitch += dy * .006;
            pointerX = event.clientX;
            pointerY = event.clientY;
            targetYaw = dragYaw;
            targetPitch = dragPitch;
        } else if (event.pointerType === 'mouse') {
            const bounds = button.getBoundingClientRect();
            targetYaw = dragYaw + ((event.clientX - bounds.left) / bounds.width - .5) * .4;
            targetPitch = dragPitch + ((event.clientY - bounds.top) / bounds.height - .5) * .3;
        }
        requestFrame();
    });
    const stopDrag = () => {
        dragging = false;
        button.classList.remove('is-dragging');
    };
    button.addEventListener('pointerup', stopDrag);
    button.addEventListener('pointercancel', stopDrag);
    button.addEventListener('pointerleave', () => {
        if (dragging) return;
        targetPitch = dragPitch;
        targetYaw = dragYaw;
        requestFrame();
    });
    button.addEventListener('click', event => {
        if (event.detail && distance > 7) return;
        const mix = progress * progress * (3 - 2 * progress);
        previousSaturn += ((mode === 2 ? 1 : 0) - previousSaturn) * mix;
        previous = target.map((point, index) => point.map((value, axis) => previous[index][axis] + (value - previous[index][axis]) * mix));
        mode = (mode + 1) % shapes.length;
        target = shapes[mode];
        progress = 0;
        button.dataset.form = String(mode);
        requestFrame();
    });
    new ResizeObserver(resize).observe(button);
    new IntersectionObserver(entries => {
        visible = entries[0].isIntersecting;
        if (visible) {
            lastTime = 0;
            resize();
        } else {
            cancelAnimationFrame(frame);
            frame = 0;
        }
    }, { threshold: .02 }).observe(button);
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            cancelAnimationFrame(frame);
            frame = 0;
        } else {
            lastTime = 0;
            requestFrame();
        }
    });
    reducedMotion.addEventListener('change', () => {
        lastTime = 0;
        requestFrame();
    });
}
