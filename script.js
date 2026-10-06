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

    // 8. Music Player
    const audio = document.getElementById('bg-music');
    const musicBtn = document.getElementById('musicToggle');

    if (musicBtn && audio) {
        musicBtn.addEventListener('click', () => {
            if (audio.paused) {
                audio.volume = 0.3;
                audio.play();
                musicBtn.innerHTML = '<i class="fas fa-pause"></i>';
                musicBtn.classList.add('playing');
            } else {
                audio.pause();
                musicBtn.innerHTML = '<i class="fas fa-music"></i>';
                musicBtn.classList.remove('playing');
            }
        });
    }

    // 9. Theme Picker
    const themeToggle = document.getElementById('themeToggle');
    const themeMenu = document.getElementById('themeMenu');
    const applyTheme = (name, save = true) => {
        document.documentElement.setAttribute('data-theme', name);
        if (save) { try { localStorage.setItem('lrn-theme', name); } catch (e) {} }
        document.querySelectorAll('.theme-item').forEach(i => i.classList.toggle('active', i.dataset.theme === name));
        window.dispatchEvent(new CustomEvent('lrn:themechange', { detail: { theme: name } }));
    };
    if (themeToggle && themeMenu) {
        const storedTheme = (() => { try { return localStorage.getItem('lrn-theme') || 'cyber'; } catch (e) { return 'cyber'; } })();
        applyTheme(storedTheme, false);
        themeToggle.addEventListener('click', e => {
            e.stopPropagation();
            themeMenu.classList.toggle('open');
        });
        themeMenu.querySelectorAll('.theme-item').forEach(item => {
            item.addEventListener('click', () => {
                applyTheme(item.dataset.theme);
                themeMenu.classList.remove('open');
            });
        });
        document.addEventListener('click', e => {
            if (!themeMenu.contains(e.target) && e.target !== themeToggle) themeMenu.classList.remove('open');
        });
    }

    // 10. 3D Tilt on cards
    const tiltEls = document.querySelectorAll('.tilt, .service-card, .pricing-card, .stat-box, .hw-card');
    tiltEls.forEach(el => {
        el.style.transformStyle = 'preserve-3d';
        el.addEventListener('pointermove', e => {
            if (e.pointerType === 'touch') return;
            const r = el.getBoundingClientRect();
            const px = (e.clientX - r.left) / r.width - 0.5;
            const py = (e.clientY - r.top) / r.height - 0.5;
            const boost = el.classList.contains('featured') || el.classList.contains('popular') ? 1.4 : 1;
            el.style.transition = 'transform 0.08s ease-out';
            el.style.transform =
                `perspective(900px) rotateY(${px * 12 * boost}deg) rotateX(${-py * 12 * boost}deg) translateZ(18px)${el.classList.contains('popular') && innerWidth >= 769 ? ' scale(1.04)' : ''}`;
        });
        el.addEventListener('pointerleave', () => {
            el.style.transition = 'transform 0.5s cubic-bezier(.22,1,.36,1)';
            el.style.transform = '';
        });
    });

    // 10b. Scroll reveal
    const revealEls = document.querySelectorAll('.section-header, .service-card, .pricing-card, .hw-card, .stat-box, .addons');
    try {
        if (!('IntersectionObserver' in window)) throw new Error('no IO');
        const revealObs = new IntersectionObserver(entries => {
            entries.forEach(en => {
                if (en.isIntersecting) {
                    en.target.classList.add('reveal-in');
                    revealObs.unobserve(en.target);
                }
            });
        }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
        revealEls.forEach((el, i) => {
            el.classList.add('reveal');
            const parent = el.parentElement;
            const idx = Array.from(parent.children).indexOf(el);
            el.style.transitionDelay = `${(idx % 6) * 0.07}s`;
            revealObs.observe(el);
        });
        setTimeout(() => {
            revealEls.forEach(el => {
                if (!el.classList.contains('reveal-in')) el.classList.add('reveal-in');
            });
        }, 4000);
    } catch (e) {
        revealEls.forEach(el => el.classList.add('reveal-in'));
    }

    // 11. Hero card parallax
    const heroCard = document.getElementById('heroCard');
    if (heroCard) {
        const hero = document.getElementById('home');
        hero.addEventListener('pointermove', e => {
            if (e.pointerType === 'touch') return;
            const r = hero.getBoundingClientRect();
            const px = (e.clientX - r.left) / r.width - 0.5;
            const py = (e.clientY - r.top) / r.height - 0.5;
            heroCard.style.animation = 'none';
            heroCard.style.transform = `translateY(-50%) perspective(800px) rotateY(${px * 16}deg) rotateX(${-py * 16}deg)`;
        });
        hero.addEventListener('pointerleave', () => {
            heroCard.style.transform = 'translateY(-50%)';
            heroCard.style.animation = '';
        });
    }

    // 12. Active nav on scroll
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-link[data-section]');
    if (sections.length && navLinks.length) {
        const spy = new IntersectionObserver(entries => {
            entries.forEach(en => {
                if (en.isIntersecting) {
                    navLinks.forEach(l => l.classList.toggle('active', l.dataset.section === en.target.id));
                }
            });
        }, { rootMargin: '-45% 0px -50% 0px' });
        sections.forEach(s => spy.observe(s));
    }

    // 13. 3D scene fallback (CDN / WebGL issues)
    setTimeout(() => {
        const load = document.getElementById('dcLoading');
        if (load && !load.classList.contains('hide') && load.querySelector('.dc-loader-ring')) {
            load.querySelector('.dc-loader-ring').remove();
            load.insertAdjacentHTML('beforeend', '<span>تعذّر تحميل المشهد ثلاثي الأبعاد — تأكد من اتصال الإنترنت (Three.js من CDN).</span>');
        }
    }, 9000);
});
