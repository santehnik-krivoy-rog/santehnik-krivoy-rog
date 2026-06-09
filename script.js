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
