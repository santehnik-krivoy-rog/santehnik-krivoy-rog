let lastScroll = 0;
const navbar = document.getElementById('navbar');
const burger = document.getElementById('burger');
const navLinks = document.getElementById('navLinks');

window.addEventListener('scroll', () => {
    const currentScroll = window.pageYOffset;

    if (currentScroll <= 0) {
        navbar.classList.remove('hide');
        lastScroll = 0;
        return;
    }

    if (currentScroll > lastScroll) {
        navbar.classList.add('hide');
    } else {
        navbar.classList.remove('hide');
    }

    lastScroll = currentScroll;
});

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


// Lead form: phone validation, anti-spam and Telegram PHP submit
const LEAD_COOLDOWN_MS = 30 * 60 * 1000;

function getSource() {
    const params = new URLSearchParams(window.location.search);
    const utm = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content']
        .map(key => params.get(key) ? `${key}=${params.get(key)}` : '')
        .filter(Boolean)
        .join('; ');
    return utm || document.referrer || 'direct';
}

function formatWait(ms) {
    const minutes = Math.ceil(ms / 60000);
    if (document.documentElement.lang === 'uk') {
        return `Повторну заявку можна відправити через ${minutes} хв.`;
    }
    return `Повторную заявку можно отправить через ${minutes} мин.`;
}

document.querySelectorAll('.lead-form').forEach(form => {
    const phoneInput = form.querySelector('.phone-input');
    const message = form.querySelector('.form-message');
    const button = form.querySelector('.form-submit');

    const pageUrl = form.querySelector('input[name="page_url"]');
    const source = form.querySelector('input[name="source"]');
    const startedAt = form.querySelector('input[name="started_at"]');

    if (pageUrl) pageUrl.value = window.location.href;
    if (source) source.value = getSource();
    if (startedAt) startedAt.value = String(Date.now());

    phoneInput.addEventListener('input', () => {
        let value = phoneInput.value.replace(/\D/g, '').slice(0, 10);
        if (value.length && value[0] !== '0') {
            value = '0' + value.replace(/^0+/, '').slice(0, 9);
        }
        phoneInput.value = value;
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

        const phone = phoneInput.value.trim();
        if (!/^0\d{9}$/.test(phone)) {
            message.classList.add('error');
            message.textContent = document.documentElement.lang === 'uk'
                ? 'Введіть 10 цифр номера, починаючи з 0.'
                : 'Введите 10 цифр номера, начиная с 0.';
            phoneInput.focus();
            return;
        }

        button.disabled = true;
        button.textContent = document.documentElement.lang === 'uk' ? 'Відправляємо...' : 'Отправляем...';

        try {
            const formData = new FormData(form);
            formData.set('phone', '+38' + phone);
            formData.set('page_url', window.location.href);
            formData.set('source', getSource());

            const response = await fetch(form.action, {
                method: 'POST',
                body: formData,
                mode: 'cors'
            });

            const data = await response.json().catch(() => ({}));

            if (!response.ok || !data.ok) {
                throw new Error(data.message || 'send_error');
            }

            localStorage.setItem('lead_last_sent', String(Date.now()));
            form.reset();
            message.classList.add('success');
            message.textContent = document.documentElement.lang === 'uk'
                ? 'Дякуємо! Заявку відправлено.'
                : 'Спасибо! Заявка отправлена.';
        } catch (error) {
            message.classList.add('error');
            message.textContent = document.documentElement.lang === 'uk'
                ? 'Помилка відправки. Спробуйте ще раз або зателефонуйте.'
                : 'Ошибка отправки. Попробуйте ещё раз или позвоните.';
        } finally {
            button.disabled = false;
            button.textContent = document.documentElement.lang === 'uk' ? 'Відправити' : 'Отправить';
        }
    });
});
