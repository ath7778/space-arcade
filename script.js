

document.addEventListener('DOMContentLoaded', function() {

    const USERNAME_KEY = 'space_arcade_username';
    const THEME_KEY = 'space_arcade_theme';
    

    initStarsBackground();
    

    initPageSpecificEffects();
    

    initPS5Navigation();
    

    const savedUsername = localStorage.getItem(USERNAME_KEY);
    const currentPath = window.location.pathname;
    const userDisplayEl = document.getElementById('user-display');
    

    if (userDisplayEl && savedUsername) {
        userDisplayEl.textContent = savedUsername;
    }
    

    const savedTheme = localStorage.getItem(THEME_KEY) || 'dark';
    document.body.setAttribute('data-theme', savedTheme);
    

    if (!savedUsername && !currentPath.includes('index.html') && 
        (currentPath.includes('home.html') || 
         currentPath.includes('games.html') || 
         currentPath.includes('about.html') || 
         currentPath.includes('settings.html'))) {
    
        window.location.href = 'index.html';
    }
    

    initHeaderScrollEffect();
    

    const usernameForm = document.getElementById('usernameForm');
    if (usernameForm) {
        usernameForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const usernameInput = document.getElementById('username');
            const username = usernameInput.value.trim();
            
            if (username) {
            
                localStorage.setItem(USERNAME_KEY, username);
                
            
                addLoginEffect();
                
            
                setTimeout(() => {
                    window.location.href = 'home.html';
                }, 800); 
            }
        });
    }
    

    const menuToggle = document.querySelector('.menu-toggle');
    const nav = document.querySelector('nav');
    
    if (menuToggle) {
        menuToggle.addEventListener('click', function() {
            nav.classList.toggle('active');
            menuToggle.classList.toggle('active');
        });
    }
    

    const scrollContainer = document.querySelector('.games-row');
    const leftArrow = document.querySelector('.scroll-arrow.left');
    const rightArrow = document.querySelector('.scroll-arrow.right');
    
    if (scrollContainer && leftArrow && rightArrow) {
    
        leftArrow.addEventListener('click', function() {
            scrollContainer.scrollBy({ left: -300, behavior: 'smooth' });
        });
        
    
        rightArrow.addEventListener('click', function() {
            scrollContainer.scrollBy({ left: 300, behavior: 'smooth' });
        });
        
    
        checkScrollArrows();
        
    
        window.addEventListener('resize', checkScrollArrows);
        
        function checkScrollArrows() {
        
            leftArrow.style.opacity = '0.3';
            rightArrow.style.opacity = '0.3';
            
        
            if (scrollContainer.scrollWidth > scrollContainer.clientWidth) {
                rightArrow.style.opacity = '1';
                
            
                scrollContainer.addEventListener('scroll', updateArrowVisibility);
                updateArrowVisibility();
            }
        }
        
        function updateArrowVisibility() {
        
            leftArrow.style.opacity = scrollContainer.scrollLeft > 0 ? '1' : '0.3';
            
        
            const maxScrollLeft = scrollContainer.scrollWidth - scrollContainer.clientWidth;
            rightArrow.style.opacity = scrollContainer.scrollLeft < maxScrollLeft - 10 ? '1' : '0.3';
        }
    }
    

    const navLinks = document.querySelectorAll('nav a, .hero-content a');
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            
            if (href.startsWith('#') && href.length > 1) {
                e.preventDefault();
                const targetSection = document.querySelector(href);
                if (targetSection) {
                    targetSection.scrollIntoView({ behavior: 'smooth' });
                    
                
                    if (nav.classList.contains('active')) {
                        nav.classList.remove('active');
                        menuToggle.classList.remove('active');
                    }
                }
            }
        });
    });
    

    const themeButtons = document.querySelectorAll('.theme-btn');
    const changeUsernameForm = document.querySelector('#change-username');
    

    if (themeButtons.length) {
    
        const savedTheme = localStorage.getItem(THEME_KEY) || 'dark';
        setTheme(savedTheme);
        
        themeButtons.forEach(btn => {
            btn.addEventListener('click', function() {
                const theme = this.getAttribute('data-theme');
                setTheme(theme);
                localStorage.setItem(THEME_KEY, theme);
                
            
                themeButtons.forEach(b => b.classList.remove('active'));
                this.classList.add('active');
            });
            
        
            if (btn.getAttribute('data-theme') === savedTheme) {
                btn.classList.add('active');
            }
        });
    }
    

    if (changeUsernameForm) {
        const updateBtn = changeUsernameForm.nextElementSibling;
        if (updateBtn) {
            updateBtn.addEventListener('click', function() {
                const newUsername = changeUsernameForm.value.trim();
                if (newUsername) {
                    localStorage.setItem(USERNAME_KEY, newUsername);
                    document.getElementById('user-display').textContent = newUsername;
                    
                
                    showSettingsMessage('Username updated successfully!', 'success');
                    changeUsernameForm.value = '';
                } else {
                    showSettingsMessage('Please enter a valid username', 'error');
                }
            });
        }
    }
});

function addLoginEffect() {
    const content = document.getElementById('main-content');
    content.style.animation = 'fadeIn 1s ease-out';
    
    const styleSheet = document.styleSheets[0];
    const fadeInRule = `
        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
    `;
    
    try {
        styleSheet.insertRule(fadeInRule, styleSheet.cssRules.length);
    } catch(e) {
        console.warn('Error inserting CSS rule:', e);
    }
}


function setTheme(theme) {
    const root = document.documentElement;
    
    if (theme === 'light') {
        root.style.setProperty('--dark-bg', '#f0f0f0');
        root.style.setProperty('--darker-bg', '#e0e0e0');
        root.style.setProperty('--panel-bg', '#ffffff');
        root.style.setProperty('--light-panel', '#f5f5f5');
        root.style.setProperty('--card-bg', '#ffffff');
        root.style.setProperty('--card-hover', '#f9f9f9');
        root.style.setProperty('--light-text', '#333333');
        root.style.setProperty('--gray', '#666666');
    } else {
        // Reset to default dark theme
        root.style.setProperty('--dark-bg', '#121212');
        root.style.setProperty('--darker-bg', '#0a0a0a');
        root.style.setProperty('--panel-bg', '#1e1e1e');
        root.style.setProperty('--light-panel', '#2a2a2a');
        root.style.setProperty('--card-bg', '#242424');
        root.style.setProperty('--card-hover', '#2f2f2f');
        root.style.setProperty('--light-text', '#e0e0e0');
        root.style.setProperty('--gray', '#9e9e9e');
    }
}


function showSettingsMessage(message, type) {
    const existingMsg = document.querySelector('.settings-message');
    if (existingMsg) {
        existingMsg.remove();
    }
    
    const msgElement = document.createElement('div');
    msgElement.className = `settings-message ${type}`;
    msgElement.textContent = message;
    msgElement.style.padding = '8px 12px';
    msgElement.style.marginTop = '10px';
    msgElement.style.borderRadius = '4px';
    msgElement.style.fontSize = '0.9rem';
    
    if (type === 'success') {
        msgElement.style.backgroundColor = 'rgba(67, 160, 71, 0.2)';
        msgElement.style.color = '#43a047';
        msgElement.style.border = '1px solid rgba(67, 160, 71, 0.3)';
    } else {
        msgElement.style.backgroundColor = 'rgba(229, 57, 53, 0.2)';
        msgElement.style.color = '#e53935';
        msgElement.style.border = '1px solid rgba(229, 57, 53, 0.3)';
    }
    
    const settingsForm = document.getElementById('change-username').parentNode;
    settingsForm.appendChild(msgElement);
    
    setTimeout(() => {
        msgElement.style.opacity = '0';
        msgElement.style.transition = 'opacity 0.5s ease';
        
        setTimeout(() => {
            if (msgElement.parentNode) {
                msgElement.parentNode.removeChild(msgElement);
            }
        }, 500);
    }, 3000);
}

// Initialize stars background
function initStarsBackground() {
    const starsContainer = document.querySelector('.stars-container');
    if (!starsContainer) return;
    
    for (let i = 0; i < 100; i++) {
        const star = document.createElement('div');
        star.classList.add('star');
        star.style.width = Math.random() * 2 + 'px';
        star.style.height = star.style.width;
        star.style.left = Math.random() * 100 + '%';
        star.style.top = Math.random() * 100 + '%';
        star.style.animationDelay = Math.random() * 10 + 's';
        starsContainer.appendChild(star);
    }
}

// Initialize page-specific effects
function initPageSpecificEffects() {
    // Check current page
    const currentPath = window.location.pathname;
    
    // About page effects
    if (currentPath.includes('about.html')) {
        initAboutPageEffects();
    }
    
    // Games page effects
    if (currentPath.includes('games.html')) {
        initGamesPageEffects();
    }
    
    // Settings page effects
    if (currentPath.includes('settings.html')) {
        initSettingsPageEffects();
    }
}


function initAboutPageEffects() {
    // Animated stars
    const animatedStars = document.querySelector('.about-unified-section .animated-stars');
    if (animatedStars) {
        createAnimatedStars(animatedStars, 40);
    }
    
    // Orbital rings
    const orbitalRings = document.querySelector('.orbital-rings');
    if (orbitalRings) {
        createOrbitalRings(orbitalRings);
    }
}


function initGamesPageEffects() {
    // Animated stars
    const animatedStars = document.querySelector('.games-unified-section .animated-stars');
    if (animatedStars) {
        createAnimatedStars(animatedStars, 30);
    }
}


function initSettingsPageEffects() {
    // Animated stars
    const animatedStars = document.querySelector('.settings-unified-section .animated-stars');
    if (animatedStars) {
        createAnimatedStars(animatedStars, 35);
    }
    
    // Add hover effects to settings cards
    const settingsCards = document.querySelectorAll('.settings-card');
    if (settingsCards.length) {
        settingsCards.forEach(card => {
            card.addEventListener('mouseenter', () => {
                card.classList.add('card-hover');
                const glow = card.querySelector('.card-glow');
                if (glow) {
                    glow.style.opacity = '1';
                }
            });
            
            card.addEventListener('mouseleave', () => {
                card.classList.remove('card-hover');
                const glow = card.querySelector('.card-glow');
                if (glow) {
                    glow.style.opacity = '0.6';
                }
            });
        });
    }
}


function createAnimatedStars(container, count) {
    if (!container) return;
    
    for (let i = 0; i < count; i++) {
        const star = document.createElement('div');
        star.classList.add('animated-star');
        
        // Random size (1-3px)
        const size = Math.random() * 2 + 1;
        star.style.width = size + 'px';
        star.style.height = size + 'px';
        
        // Random position
        star.style.left = Math.random() * 100 + '%';
        star.style.top = Math.random() * 100 + '%';
        
        // Random animation duration and delay
        star.style.animationDuration = (Math.random() * 20 + 10) + 's';
        star.style.animationDelay = Math.random() * 5 + 's';
        
        // Random opacity
        star.style.opacity = Math.random() * 0.5 + 0.5;
        
        container.appendChild(star);
    }
}


function createOrbitalRings(container) {
    if (!container) return;
    
    for (let i = 0; i < 3; i++) {
        const ring = document.createElement('div');
        ring.classList.add('ring');
        ring.style.width = (200 + i * 100) + 'px';
        ring.style.height = (200 + i * 100) + 'px';
        ring.style.animationDuration = (20 + i * 5) + 's';
        container.appendChild(ring);
    }
}


function initPS5Navigation() {
    // Add the PS5-style active navigation indicators
    const navLinks = document.querySelectorAll('nav ul li a');
    
    navLinks.forEach(link => {
        // Hover effect with subtle animation
        link.addEventListener('mouseenter', () => {
            // Scale effect
            link.style.transform = 'scale(1.05)';
            
            // Find icon and add pulsing glow
            const icon = link.querySelector('i');
            if (icon) {
                icon.style.textShadow = '0 0 15px rgba(0, 169, 255, 0.7)';
            }
        });
        
        link.addEventListener('mouseleave', () => {
            // Reset scale
            link.style.transform = '';
            
            // Reset icon glow if not active link
            if (!link.classList.contains('active')) {
                const icon = link.querySelector('i');
                if (icon) {
                    icon.style.textShadow = '';
                }
            }
        });
    });
    
    initVideoBackground();
}


function initVideoBackground() {
    const videoElement = document.querySelector('.games-video-bg');
    if (!videoElement) return;
    
    // Ensure video loads and plays properly
    videoElement.addEventListener('loadeddata', () => {
        // Fade in video when it's ready
        videoElement.style.transition = 'opacity 1s ease-in-out';
        videoElement.style.opacity = '1';
        
        // Add dynamic interaction - slight parallax effect on mouse move
        const gamesSection = document.querySelector('.games-unified-section');
        if (gamesSection) {
            gamesSection.addEventListener('mousemove', (e) => {
                const x = e.clientX / window.innerWidth;
                const y = e.clientY / window.innerHeight;
                
                // Subtle movement effect
                videoElement.style.transform = `scale(1.05) translate(${(x - 0.5) * 10}px, ${(y - 0.5) * 10}px)`;
            });
            
            // Reset on mouse leave
            gamesSection.addEventListener('mouseleave', () => {
                videoElement.style.transform = 'scale(1)';
            });
        }
    });
    
    // Fallback in case video fails to load
    videoElement.addEventListener('error', () => {
        console.error('Video failed to load, applying fallback background');
        const gamesSection = document.querySelector('.games-unified-section');
        if (gamesSection) {
            // Apply a fallback static background
            gamesSection.style.backgroundImage = 'linear-gradient(135deg, #050520 0%, #0a0a2a 50%, #050520 100%)';
        }
    });
}

// Initialize header scroll effect
function initHeaderScrollEffect() {
    window.addEventListener('scroll', function() {
        const header = document.querySelector('.ps-header');
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    });
    
    // Add 3D tilt effect to game tiles and welcome cards
    initTiltEffect();
    
    initThemeToggle();
    
    // Initialize horizontal scroll for games section
    initHorizontalScroll();
}


function initTiltEffect() {
    const tiltElements = document.querySelectorAll('.welcome-card, .game-tile:not(.empty-tile)');
    
    tiltElements.forEach(element => {
        element.addEventListener('mousemove', function(e) {
            const rect = this.getBoundingClientRect();
            const x = e.clientX - rect.left; // x position within the element
            const y = e.clientY - rect.top; // y position within the element
            
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            
            const deltaX = (x - centerX) / centerX * 5; // Max 5 degrees
            const deltaY = (y - centerY) / centerY * 5; // Max 5 degrees
            
            this.style.transform = `perspective(1000px) rotateX(${-deltaY}deg) rotateY(${deltaX}deg) translateZ(10px)`;
        });
        
        element.addEventListener('mouseleave', function() {
            this.style.transform = '';
            // Allow CSS transitions to take over again
            setTimeout(() => {
                this.style.transition = 'all 0.4s ease';
            }, 100);
        });
        
        element.addEventListener('mouseenter', function() {
            this.style.transition = 'transform 0.1s ease';
        });
    });
}


function initThemeToggle() {
    const themeButtons = document.querySelectorAll('.theme-btn');
    const savedTheme = localStorage.getItem('space_arcade_theme') || 'dark';
    
    themeButtons.forEach(button => {
        // Set active class on the saved theme button
        if (button.getAttribute('data-theme') === savedTheme) {
            button.classList.add('active');
        } else {
            button.classList.remove('active');
        }
        
        button.addEventListener('click', function() {
            const theme = this.getAttribute('data-theme');
            document.body.setAttribute('data-theme', theme);
            localStorage.setItem('space_arcade_theme', theme);
            
            // Update active states
            themeButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
        });
    });
}


function initHorizontalScroll() {
    const leftArrow = document.querySelector('.scroll-arrow.left');
    const rightArrow = document.querySelector('.scroll-arrow.right');
    const gamesRow = document.querySelector('.games-row');
    
    if (leftArrow && rightArrow && gamesRow) {
        leftArrow.addEventListener('click', function() {
            gamesRow.scrollBy({ left: -350, behavior: 'smooth' });
        });
        
        rightArrow.addEventListener('click', function() {
            gamesRow.scrollBy({ left: 350, behavior: 'smooth' });
        });
    }
}


function initStarsBackgroundEffect() {
    const starsContainer = document.querySelector('.stars-container');
    if (!starsContainer) return;
    
    // Add shooting stars
    for (let i = 0; i < 3; i++) {
        createShootingStar(starsContainer);
    }
    
    // Periodically create new shooting stars
    setInterval(() => {
        if (Math.random() > 0.7) {
            createShootingStar(starsContainer);
        }
    }, 4000);
}


function createShootingStar(container) {
    const star = document.createElement('div');
    star.className = 'shooting-star';
    
    // Random position and size
    const size = Math.random() * 2 + 1;
    const top = Math.random() * 30;
    const left = Math.random() * 100;
    
    // Style the shooting star
    star.style.position = 'absolute';
    star.style.top = `${top}%`;
    star.style.left = `${left}%`;
    star.style.width = `${size}px`;
    star.style.height = `${size * 50}px`;
    star.style.backgroundImage = 'linear-gradient(to bottom, rgba(255,255,255,0.8), transparent)';
    star.style.transform = 'rotate(45deg)';
    star.style.borderRadius = `${size}px`;
    star.style.opacity = '0';
    star.style.animation = `shootingStar ${Math.random() * 2 + 2}s ease-out`;
    
    // Add animation keyframes if not already present
    const styleSheet = document.styleSheets[0];
    const shootingStarRule = `
        @keyframes shootingStar {
            0% { opacity: 0; transform: rotate(45deg) translateX(0); }
            10% { opacity: 1; }
            100% { opacity: 0; transform: rotate(45deg) translateX(100vw); }
        }
    `;
    
    try {
        if (!document.querySelector('style#shooting-stars-style')) {
            const styleEl = document.createElement('style');
            styleEl.id = 'shooting-stars-style';
            styleEl.textContent = shootingStarRule;
            document.head.appendChild(styleEl);
        }
    } catch(e) {
        console.warn('Error creating shooting star animation:', e);
    }
    
    container.appendChild(star);
    
    // Clean up after animation
    setTimeout(() => {
        if (star.parentNode) {
            star.parentNode.removeChild(star);
        }
    }, 5000);
}
