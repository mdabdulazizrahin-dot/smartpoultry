/**
 * Bye Bye Poultry Farm - Main JavaScript
 */

(function() {
    'use strict';

    /**
     * Initialize the theme
     */
    function init() {
        initLucideIcons();
        initNavTabs();
        initForms();
    }

    /**
     * Initialize Lucide icons
     */
    function initLucideIcons() {
        // Wait for lucide to be available
        if (typeof lucide !== 'undefined' && lucide.createIcons) {
            lucide.createIcons();
            console.log('Lucide icons initialized');
        } else {
            // Retry after a short delay if lucide isn't ready
            setTimeout(initLucideIcons, 100);
        }
    }

    /**
     * Initialize navigation tabs
     */
    function initNavTabs() {
        const navTabs = document.querySelectorAll('.nav-tab');
        const sections = document.querySelectorAll('.feature-section');

        console.log('Found tabs:', navTabs.length);
        console.log('Found sections:', sections.length);

        // Hide all sections except the first one initially
        sections.forEach(function(section, index) {
            if (index === 0) {
                section.style.display = 'block';
            } else {
                section.style.display = 'none';
            }
        });

        // Add click handlers to tabs
        navTabs.forEach(function(tab) {
            tab.addEventListener('click', function(e) {
                e.preventDefault();
                
                var targetId = this.getAttribute('href');
                if (!targetId || targetId === '#') return;

                console.log('Tab clicked:', targetId);

                // Remove active class from all tabs
                navTabs.forEach(function(t) {
                    t.classList.remove('active');
                });
                
                // Add active class to clicked tab
                this.classList.add('active');

                // Hide all sections
                sections.forEach(function(section) {
                    section.style.display = 'none';
                });

                // Show target section
                var targetSection = document.querySelector(targetId);
                if (targetSection) {
                    targetSection.style.display = 'block';
                    
                    // Smooth scroll to section
                    targetSection.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });

                    // Reinitialize Lucide icons for the new section
                    if (typeof lucide !== 'undefined' && lucide.createIcons) {
                        lucide.createIcons();
                    }
                }
            });
        });

        // Set first tab as active if none is active
        var activeTab = document.querySelector('.nav-tab.active');
        if (!activeTab && navTabs.length > 0) {
            navTabs[0].classList.add('active');
        }
    }

    /**
     * Initialize form handling
     */
    function initForms() {
        var forms = document.querySelectorAll('form');
        
        forms.forEach(function(form) {
            form.addEventListener('submit', function(e) {
                e.preventDefault();
                
                // Basic form validation
                var inputs = form.querySelectorAll('input[required], textarea[required], select[required]');
                var isValid = true;
                
                inputs.forEach(function(input) {
                    if (!input.value.trim()) {
                        isValid = false;
                        input.style.borderColor = 'hsl(0, 84%, 60%)';
                    } else {
                        input.style.borderColor = '';
                    }
                });

                if (isValid) {
                    // Show success message
                    showNotification('সংরক্ষণ সম্পন্ন হয়েছে!', 'success');
                    form.reset();
                } else {
                    showNotification('সব প্রয়োজনীয় তথ্য পূরণ করুন', 'error');
                }
            });
        });
    }

    /**
     * Show notification
     */
    function showNotification(message, type) {
        // Remove existing notifications
        var existingNotification = document.querySelector('.notification');
        if (existingNotification) {
            existingNotification.remove();
        }

        // Create notification element
        var notification = document.createElement('div');
        notification.className = 'notification';
        notification.style.cssText = 
            'position: fixed;' +
            'top: 20px;' +
            'right: 20px;' +
            'padding: 1rem 1.5rem;' +
            'border-radius: 0.75rem;' +
            'color: white;' +
            'font-weight: 500;' +
            'z-index: 9999;' +
            'animation: slideIn 0.3s ease;' +
            'box-shadow: 0 4px 12px rgba(0,0,0,0.15);';

        if (type === 'success') {
            notification.style.background = 'linear-gradient(135deg, hsl(142, 70%, 45%) 0%, hsl(160, 60%, 50%) 100%)';
        } else if (type === 'error') {
            notification.style.background = 'linear-gradient(135deg, hsl(0, 70%, 55%) 0%, hsl(15, 80%, 60%) 100%)';
        }

        notification.textContent = message;
        document.body.appendChild(notification);

        // Remove after 3 seconds
        setTimeout(function() {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(function() {
                if (notification.parentNode) {
                    notification.remove();
                }
            }, 300);
        }, 3000);
    }

    /**
     * Add CSS animations
     */
    function addAnimationStyles() {
        var style = document.createElement('style');
        style.textContent = 
            '@keyframes slideIn {' +
            '    from { transform: translateX(100%); opacity: 0; }' +
            '    to { transform: translateX(0); opacity: 1; }' +
            '}' +
            '@keyframes slideOut {' +
            '    from { transform: translateX(0); opacity: 1; }' +
            '    to { transform: translateX(100%); opacity: 0; }' +
            '}' +
            '.feature-section {' +
            '    animation: fadeIn 0.3s ease;' +
            '}' +
            '@keyframes fadeIn {' +
            '    from { opacity: 0; transform: translateY(10px); }' +
            '    to { opacity: 1; transform: translateY(0); }' +
            '}';
        document.head.appendChild(style);
    }

    /**
     * Bengali number conversion
     */
    function toBengaliNumber(num) {
        var bengaliDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
        return String(num).replace(/[0-9]/g, function(d) {
            return bengaliDigits[parseInt(d)];
        });
    }

    /**
     * Format currency
     */
    function formatCurrency(amount) {
        var formatted = new Intl.NumberFormat('en-IN').format(amount);
        return '৳ ' + toBengaliNumber(formatted);
    }

    // Expose utility functions globally
    window.ByeByePoultry = {
        toBengaliNumber: toBengaliNumber,
        formatCurrency: formatCurrency,
        showNotification: showNotification
    };

    // Run on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            addAnimationStyles();
            init();
        });
    } else {
        addAnimationStyles();
        init();
    }
})();
