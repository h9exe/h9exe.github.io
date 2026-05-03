document.addEventListener('DOMContentLoaded', () => {
    // 1. Preloader
    const preloader = document.querySelector('.preloader');
    const hidePreloader = () => {
        if (preloader) {
            preloader.style.opacity = '0';
            setTimeout(() => {
                preloader.style.display = 'none';
            }, 500);
        }
    };
    window.addEventListener('load', hidePreloader);
    setTimeout(hidePreloader, 2000);

    // 2. Typing Effect
    const typingText = document.getElementById('typingText');
    if (typingText) {
        const phrases = ['أقوى البوتات', 'يوزرات مميزة', 'خدمات API سريعة', 'دعم فني 24/7'];
        let pIndex = 0, cIndex = 0, isDeleting = false;
        function type() {
            const current = phrases[pIndex];
            if (isDeleting) {
                typingText.textContent = current.substring(0, cIndex - 1);
                cIndex--;
            } else {
                typingText.textContent = current.substring(0, cIndex + 1);
                cIndex++;
            }
            let speed = isDeleting ? 50 : 150;
            if (!isDeleting && cIndex === current.length) {
                speed = 2000;
                isDeleting = true;
            } else if (isDeleting && cIndex === 0) {
                isDeleting = false;
                pIndex = (pIndex + 1) % phrases.length;
                speed = 500;
            }
            setTimeout(type, speed);
        }
        type();
    }

    // 3. Navbar Scroll
    const navbar = document.querySelector('.navbar');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 20) navbar.classList.add('scrolled');
        else navbar.classList.remove('scrolled');
    });

    // 4. Mobile Menu Toggle
    const navToggle = document.getElementById('navToggle');
    const navMenu = document.getElementById('navMenu');
    if (navToggle && navMenu) {
        navToggle.addEventListener('click', () => {
            navMenu.classList.toggle('active');
            navToggle.classList.toggle('active');
        });
        navMenu.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', () => {
                navMenu.classList.remove('active');
                navToggle.classList.remove('active');
            });
        });
    }

    // 5. Tabs
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const target = btn.getAttribute('data-tab');
            tabBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));
            btn.classList.add('active');
            const content = document.getElementById(target);
            if (content) content.classList.add('active');
        });
    });

    // 6. Stats Counter
    const counters = document.querySelectorAll('.counter, .stat-number');
    const observerOptions = { threshold: 0.5 };
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const target = +entry.target.getAttribute('data-target');
                let count = 0;
                const increment = target / 50;
                const update = () => {
                    if (count < target) {
                        count += increment;
                        entry.target.innerText = Math.ceil(count);
                        setTimeout(update, 20);
                    } else {
                        entry.target.innerText = target;
                    }
                };
                update();
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);
    counters.forEach(c => observer.observe(c));

    // 7. Scroll to Top Button
    const scrollTopBtn = document.getElementById('scrollTop');
    if (scrollTopBtn) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 500) scrollTopBtn.style.display = 'block';
            else scrollTopBtn.style.display = 'none';
        });
        scrollTopBtn.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }
});
