// تأثيرات تفاعلية للموقع
document.addEventListener('DOMContentLoaded', function() {
    
    // تأثير ظهور العناصر عند التمرير
    const observerOptions = {
        threshold: 0.15,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);

    // تطبيق التأثير على البطاقات
    document.querySelectorAll('.card').forEach(card => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(30px)';
        card.style.transition = 'all 0.6s cubic-bezier(0.16, 1, 0.3, 1)';
        observer.observe(card);
    });

    // تأثير النقر على الأزرار
    document.querySelectorAll('.btn-buy, .btn-buy-small, .btn-discord-header').forEach(btn => {
        btn.addEventListener('click', function(e) {
            // تأثير ضغط
            this.style.transform = 'scale(0.95)';
            setTimeout(() => {
                this.style.transform = '';
            }, 150);
            
            // تسجيل في الكونسول (للتتبع)
            console.log('🎫 تم النقر على زر الدسكورد - توجيه إلى discord.gg/lrn');
        });
    });

    // تأثيرات خاصة للبطاقة المميزة
    const featuredCard = document.querySelector('.featured-card');
    if (featuredCard) {
        featuredCard.addEventListener('mousemove', function(e) {
            const rect = this.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            
            const rotateX = (y - centerY) / centerY * -5;
            const rotateY = (x - centerX) / centerX * 5;
            
            this.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-6px)`;
        });
        
        featuredCard.addEventListener('mouseleave', function() {
            this.style.transform = '';
            this.style.transition = 'all 0.5s ease';
        });
    }

    // عداد تاريخ السنة الحالية للفوتر
    const yearSpan = document.querySelector('footer p');
    if (yearSpan) {
        const currentYear = new Date().getFullYear();
        yearSpan.innerHTML = yearSpan.innerHTML.replace('2024', currentYear);
    }

    console.log('⚡ LRN Hub - جاهز');
    console.log('🎧 للطلب: discord.gg/lrn');
});
