/**
 * Corpo Humano — Vídeo Controlado por Scroll
 * 
 * A hero fica fixa na tela. O scroll do mouse controla o vídeo:
 * - Rolar para baixo = avança o vídeo
 * - Rolar para cima = volta o vídeo
 * - A hero só "libera" a página quando o vídeo termina
 * 
 * Técnica: Envolvemos a hero num container alto (wrapper).
 * A hero é position:sticky, então ela gruda no topo enquanto
 * o usuário faz scroll pelo wrapper. O progresso do scroll
 * dentro do wrapper é mapeado para video.currentTime.
 */

document.addEventListener('DOMContentLoaded', function () {
    'use strict';

    // ===========================
    // Referências DOM
    // ===========================
    const video = document.getElementById('hero-video');
    const heroSection = document.querySelector('.hero-section');
    const progressBar = document.getElementById('progress-bar');
    const scrollIndicator = document.getElementById('scroll-indicator');
    const navbar = document.getElementById('navbar');
    const navToggle = document.getElementById('nav-toggle');
    const navLinks = document.getElementById('nav-links');

    if (!heroSection || !video) {
        console.warn('Hero section ou vídeo não encontrado.');
        return;
    }

    // ===========================
    // Configuração
    // ===========================
    // Quantas "telas" de scroll o wrapper terá.
    // 5vh de wrapper = o vídeo de 8s é esticado por 5 telas de scroll
    const SCROLL_PAGES = 5;

    // ===========================
    // Criar Wrapper
    // ===========================
    const wrapper = document.createElement('div');
    wrapper.id = 'hero-scroll-wrapper';
    wrapper.style.position = 'relative';
    wrapper.style.width = '100%';
    wrapper.style.height = (SCROLL_PAGES * 100) + 'vh';

    // Inserir o wrapper no lugar da hero, e mover a hero para dentro
    heroSection.parentNode.insertBefore(wrapper, heroSection);
    wrapper.appendChild(heroSection);

    // Tornar a hero sticky (gruda no topo do wrapper)
    heroSection.style.position = 'sticky';
    heroSection.style.top = '0';
    heroSection.style.width = '100%';
    heroSection.style.height = '100vh';
    heroSection.style.overflow = 'hidden';
    heroSection.style.zIndex = '2';

    // ===========================
    // Vídeo — aguardar carregamento
    // ===========================
    let videoDuration = 0;
    let videoReady = false;

    function onVideoReady() {
        if (videoReady) return;
        if (!video.duration || isNaN(video.duration) || video.duration === Infinity) return;

        videoDuration = video.duration;
        videoReady = true;
        video.pause();
        video.currentTime = 0;
        console.log('Vídeo pronto. Duração:', videoDuration.toFixed(2) + 's');
        syncVideoToScroll();
    }

    video.addEventListener('loadedmetadata', onVideoReady);
    video.addEventListener('loadeddata', onVideoReady);
    video.addEventListener('canplay', onVideoReady);
    video.addEventListener('canplaythrough', onVideoReady);
    // Caso já esteja carregado
    if (video.readyState >= 2) {
        onVideoReady();
    }

    // Forçar carregamento
    video.load();

    // ===========================
    // Scroll → Vídeo
    // ===========================
    function syncVideoToScroll() {
        var scrollY = window.pageYOffset || window.scrollY;

        // Posição do wrapper no documento
        var wrapperTop = wrapper.offsetTop;
        // Distância total de scroll dentro do wrapper
        var scrollRange = wrapper.offsetHeight - window.innerHeight;

        if (scrollRange <= 0) scrollRange = 1;

        // Progresso de 0 a 1
        var rawProgress = (scrollY - wrapperTop) / scrollRange;
        var progress = Math.max(0, Math.min(1, rawProgress));

        // Sincronizar vídeo
        if (videoReady && videoDuration > 0) {
            var targetTime = progress * videoDuration;
            // Só atualizar se a diferença for significativa
            if (Math.abs(video.currentTime - targetTime) > 0.03) {
                try {
                    video.currentTime = targetTime;
                } catch (e) {
                    // Ignorar erros de seek
                }
            }
        }

        // Barra de progresso
        if (progressBar) {
            progressBar.style.width = (progress * 100) + '%';
        }

        // Fade do indicador de scroll
        if (scrollIndicator) {
            scrollIndicator.style.opacity = Math.max(1 - progress * 4, 0);
        }

        // Fade do conteúdo hero — só começa a sumir no final do vídeo (últimos 30%)
        var heroContent = heroSection.querySelector('.hero-content');
        if (heroContent) {
            // De 0% a 70% do scroll: texto totalmente visível
            // De 70% a 100%: texto desaparece gradualmente
            var fadeStart = 0.7;
            var fadeFactor = progress <= fadeStart ? 0 : (progress - fadeStart) / (1 - fadeStart);
            heroContent.style.opacity = Math.max(1 - fadeFactor, 0);
            heroContent.style.transform = 'translateY(' + (fadeFactor * -50) + 'px)';
        }

        // Navbar com fundo
        if (navbar) {
            if (scrollY > 80) {
                navbar.classList.add('scrolled');
            } else {
                navbar.classList.remove('scrolled');
            }
        }
    }

    // Usar scroll event com requestAnimationFrame para performance
    var scrollTicking = false;

    window.addEventListener('scroll', function () {
        if (!scrollTicking) {
            window.requestAnimationFrame(function () {
                syncVideoToScroll();
                scrollTicking = false;
            });
            scrollTicking = true;
        }
    }, { passive: true });

    // Sync no resize também
    window.addEventListener('resize', function () {
        window.requestAnimationFrame(syncVideoToScroll);
    }, { passive: true });

    // Sync inicial
    syncVideoToScroll();

    // ===========================
    // Navegação Mobile
    // ===========================
    if (navToggle && navLinks) {
        navToggle.addEventListener('click', function () {
            navToggle.classList.toggle('open');
            navLinks.classList.toggle('open');
        });

        var links = navLinks.querySelectorAll('.nav-link');
        for (var i = 0; i < links.length; i++) {
            links[i].addEventListener('click', function () {
                navToggle.classList.remove('open');
                navLinks.classList.remove('open');
            });
        }
    }

    // ===========================
    // Nav Ativa por Scroll
    // ===========================
    var allSections = document.querySelectorAll('.section, .hero-section');
    var navLinkEls = document.querySelectorAll('.nav-link[data-section]');

    function updateActiveNav() {
        var scrollPos = window.scrollY + window.innerHeight / 3;

        allSections.forEach(function (section) {
            var rect = section.getBoundingClientRect();
            var top = rect.top + window.scrollY;
            var bottom = top + section.offsetHeight;
            var id = section.id;

            if (scrollPos >= top && scrollPos < bottom) {
                navLinkEls.forEach(function (link) {
                    link.classList.remove('active');
                    if (link.getAttribute('data-section') === id) {
                        link.classList.add('active');
                    }
                });
            }
        });
    }

    window.addEventListener('scroll', function () {
        window.requestAnimationFrame(updateActiveNav);
    }, { passive: true });

    // ===========================
    // Animações de Reveal (scroll)
    // ===========================
    function initRevealAnimations() {
        var revealSelectors = [
            '.section-label',
            '.section-title',
            '.section-description',
            '.stat-item',
            '.about-image-card',
            '.organ-card',
            '.feature-item',
            '.contato-item',
            '.contato-form',
            '.explorar-visual',
            '.explorar-img'
        ];

        revealSelectors.forEach(function (selector) {
            var elements = document.querySelectorAll(selector);
            elements.forEach(function (el, i) {
                el.classList.add('reveal');
                el.style.transitionDelay = (i * 0.06) + 's';
            });
        });

        var observer = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                }
            });
        }, {
            threshold: 0.08,
            rootMargin: '0px 0px -40px 0px'
        });

        var reveals = document.querySelectorAll('.reveal');
        reveals.forEach(function (el) {
            observer.observe(el);
        });
    }

    // ===========================
    // Contadores Animados
    // ===========================
    function initStatCounters() {
        var statNumbers = document.querySelectorAll('.stat-number[data-target]');

        var observer = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    var el = entry.target;
                    var target = parseInt(el.getAttribute('data-target'), 10);
                    animateCounter(el, target);
                    observer.unobserve(el);
                }
            });
        }, { threshold: 0.5 });

        statNumbers.forEach(function (el) {
            observer.observe(el);
        });
    }

    function animateCounter(el, target) {
        var duration = 2000;
        var startTime = performance.now();

        function tick(now) {
            var elapsed = now - startTime;
            var progress = Math.min(elapsed / duration, 1);
            var eased = 1 - Math.pow(1 - progress, 3);
            el.textContent = Math.round(eased * target);

            if (progress < 1) {
                window.requestAnimationFrame(tick);
            } else {
                el.textContent = target;
            }
        }

        window.requestAnimationFrame(tick);
    }

    // ===========================
    // Formulário de Contato
    // ===========================
    var contatoForm = document.getElementById('contato-form');
    if (contatoForm) {
        contatoForm.addEventListener('submit', function (e) {
            e.preventDefault();
            var submitBtn = document.getElementById('form-submit');
            if (!submitBtn) return;
            var btnSpan = submitBtn.querySelector('span');
            var originalText = btnSpan.textContent;
            btnSpan.textContent = 'MENSAGEM ENVIADA ✓';
            submitBtn.style.background = '#22c55e';

            setTimeout(function () {
                btnSpan.textContent = originalText;
                submitBtn.style.background = '';
                contatoForm.reset();
            }, 3000);
        });
    }

    // ===========================
    // Inicializar
    // ===========================
    initRevealAnimations();
    initStatCounters();

});
