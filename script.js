let lastScroll = 0;

const navbar = document.getElementById('navbar');
const burger = document.getElementById('burger');
const navLinks = document.getElementById('navLinks');

if (navbar) {
    window.addEventListener('scroll', () => {
        const currentScroll = window.pageYOffset;

        if (currentScroll <= 0) {
            navbar.classList.remove('hide');
            lastScroll = 0;
            return;
        }

        navbar.classList.toggle('hide', currentScroll > lastScroll);
        lastScroll = currentScroll;
    });
}

if (burger && navLinks) {
    burger.addEventListener('click', () => {
        const isActive = navLinks.classList.toggle('active');
        burger.setAttribute('aria-expanded', String(isActive));
    });

    document.querySelectorAll('.nav-links a').forEach(link => {
        link.addEventListener('click', () => {
            navLinks.classList.remove('active');
            burger.setAttribute('aria-expanded', 'false');
        });
    });
}

const LEAD_COOLDOWN_MS = 30 * 60 * 1000;

function getSource() {
    const params = new URLSearchParams(window.location.search);

    const utm = [
        'utm_source',
        'utm_medium',
        'utm_campaign',
        'utm_term',
        'utm_content'
    ]
        .map(key => params.get(key) ? `${key}=${params.get(key)}` : '')
        .filter(Boolean)
        .join('; ');

    return utm || document.referrer || 'Прямой заход';
}

function formatWait(ms) {
    const minutes = Math.ceil(ms / 60000);

    return document.documentElement.lang === 'uk'
        ? `Повторну заявку можна відправити через ${minutes} хв.`
        : `Повторную заявку можно отправить через ${minutes} мин.`;
}

document.querySelectorAll('.lead-form').forEach(form => {
    const phoneInput = form.querySelector('.phone-input');
    const message = form.querySelector('.form-message');
    const button = form.querySelector('.form-submit');

    if (!phoneInput || !message || !button) return;

    const startedAt = form.querySelector('input[name="started_at"]');

    if (startedAt) {
        startedAt.value = String(Date.now());
    }

    phoneInput.addEventListener('focus', () => {
        if (!phoneInput.value.trim()) {
            phoneInput.value = '0';
        }
    });

    phoneInput.addEventListener('input', () => {
        let value = phoneInput.value.replace(/\D/g, '');

        if (value.startsWith('38')) {
            value = value.slice(2);
        }

        if (value.startsWith('8')) {
            value = '0' + value.slice(1);
        }

        if (value.length && value[0] !== '0') {
            value = '0' + value.replace(/^0+/, '');
        }

        phoneInput.value = value.slice(0, 10);
    });

    form.addEventListener('submit', async event => {
        event.preventDefault();

        message.className = 'form-message';
        message.textContent = '';

        const lastSent = Number(localStorage.getItem('lead_last_sent') || 0);
        const wait = LEAD_COOLDOWN_MS - (Date.now() - lastSent);

        if (wait > 0) {
            message.classList.add('error');
            message.textContent = formatWait(wait);
            return;
        }

        const phone = phoneInput.value.replace(/\D/g, '');

        if (!/^0\d{9}$/.test(phone)) {
            message.classList.add('error');
            message.textContent = document.documentElement.lang === 'uk'
                ? 'Введіть 10 цифр номера, починаючи з 0.'
                : 'Введите 10 цифр номера, начиная с 0.';
            phoneInput.focus();
            return;
        }

        button.disabled = true;
        button.textContent = document.documentElement.lang === 'uk'
            ? 'Відправляємо...'
            : 'Отправляем...';

        try {
            const formData = new FormData(form);

            formData.set('phone', '+38' + phone);
            formData.set('page_url', window.location.href);
            formData.set('source', getSource());

            const response = await fetch(form.action, {
                method: 'POST',
                body: formData
            });

            const data = await response.json();

            if (!response.ok || !data.ok) {
                throw new Error(data.message || 'send_error');
            }

            localStorage.setItem('lead_last_sent', String(Date.now()));

            form.reset();

            if (startedAt) {
                startedAt.value = String(Date.now());
            }

            message.classList.add('success');
            message.textContent = data.message || (
                document.documentElement.lang === 'uk'
                    ? 'Дякуємо! Заявку відправлено.'
                    : 'Спасибо! Заявка отправлена.'
            );

        } catch (error) {
            message.classList.add('error');
            message.textContent = error.message || (
                document.documentElement.lang === 'uk'
                    ? 'Помилка відправки. Спробуйте ще раз або зателефонуйте.'
                    : 'Ошибка отправки. Попробуйте ещё раз или позвоните.'
            );
        } finally {
            button.disabled = false;
            button.textContent = document.documentElement.lang === 'uk'
                ? 'Відправити'
                : 'Отправить';
        }
    });
});
