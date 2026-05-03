document.querySelectorAll('.plan-card, .mega-card, .api-card').forEach((el, index) => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(30px)';
    setTimeout(() => {
        el.style.transition = 'all 0.8s ease-out';
        el.style.opacity = '1';
        el.style.transform = 'translateY(0)';
    }, 200 * index);
});
