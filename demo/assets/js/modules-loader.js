/**
 * School IT Club - Modular Component Loader
 * Dynamically loads and integrates header and footer modules across all pages.
 */
(function () {
    'use strict';

    /**
     * Fetches an HTML component and injects it into the target container.
     * Evaluates any embedded <script> tags to ensure interactive behavior.
     * 
     * @param {string} targetId - ID of the container element
     * @param {string} moduleUrl - Path to the module HTML file
     * @param {Function} [onComplete] - Optional callback after injection and execution
     */
    async function loadModule(targetId, moduleUrl, onComplete) {
        const container = document.getElementById(targetId);
        if (!container) return;

        try {
            const response = await fetch(moduleUrl, { cache: 'no-cache' });
            if (!response.ok) {
                throw new Error(`Failed to load ${moduleUrl}: ${response.status} ${response.statusText}`);
            }

            const htmlContent = await response.text();
            container.innerHTML = htmlContent;

            // Execute scripts within the injected HTML
            const scriptElements = container.querySelectorAll('script');
            for (const oldScript of scriptElements) {
                const newScript = document.createElement('script');
                Array.from(oldScript.attributes).forEach(attr => {
                    newScript.setAttribute(attr.name, attr.value);
                });
                newScript.textContent = oldScript.textContent;
                oldScript.parentNode.replaceChild(newScript, oldScript);
            }

            if (typeof onComplete === 'function') {
                onComplete();
            }
        } catch (error) {
            console.error(`[ModuleLoader] Error loading ${moduleUrl} into #${targetId}:`, error);
        }
    }

    /**
     * Initializes all standard modules (header, filter, newsletter & footer).
     */
    async function initAllModules() {
        const promises = [];

        // 1. Site Header
        if (document.getElementById('site-header')) {
            promises.push(loadModule('site-header', 'modules/header.html', () => {
                // Re-bind popup search
                if (window.jQuery) {
                    const $ = window.jQuery;
                    $(".popup-show-form").each(function () {
                        const $popup = $(this);
                        const $button = $popup.find(".btn-show");
                        const $close = $popup.find(".close-form");
                        $button.off('click').on("click", function (event) {
                            event.preventDefault();
                            $popup.find(".popup-show").toggleClass("show");
                        });
                        $close.off('click').on("click", function () {
                            $popup.find(".popup-show").removeClass("show");
                        });
                    });

                    $(document).off('click.popupSearch').on('click.popupSearch', function (e) {
                        $(".popup-show-form").each(function () {
                            const $popup = $(this);
                            const $button = $popup.find(".btn-show");
                            if (!$popup.is(e.target) && $popup.has(e.target).length === 0 &&
                                !$button.is(e.target) && $button.has(e.target).length === 0) {
                                $popup.find(".popup-show").removeClass("show");
                            }
                        });
                    });
                }

                if (typeof window.initHeaderModule === 'function') {
                    window.initHeaderModule();
                }
            }));
        }

        // 2. Section Filter Module (if present on page)
        if (document.getElementById('section-filter')) {
            promises.push(loadModule('section-filter', 'modules/section-filter.html', () => {
                if (typeof window.initDirectorySearch === 'function') {
                    window.initDirectorySearch();
                }
            }));
        }

        // 3. Section Newsletter Module (if present on page)
        if (document.getElementById('section-newsletter')) {
            promises.push(loadModule('section-newsletter', 'modules/section-newsletter.html', () => {
                // Trigger Sendinblue/Brevo form script if available
                if (window.initSibForm && typeof window.initSibForm === 'function') {
                    window.initSibForm();
                }
            }));
        }

        // 4. Student Sidebar Module (if present on page)
        if (document.getElementById('student-sidebar')) {
            promises.push(loadModule('student-sidebar', 'modules/student-sidebar.html'));
        }

        // 5. Site Footer
        if (document.getElementById('site-footer')) {
            promises.push(loadModule('site-footer', 'modules/footer.html', () => {
                if (typeof window.initFooterModule === 'function') {
                    window.initFooterModule();
                }
            }));
        }

        await Promise.all(promises);

        // Dispatch an event so any custom page logic can react
        window.dispatchEvent(new CustomEvent('schoolitclub:modulesLoaded'));
    }

    // Expose loader to global scope
    window.SchoolITModules = {
        loadModule: loadModule,
        initAllModules: initAllModules
    };

    // Auto load when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initAllModules);
    } else {
        initAllModules();
    }
})();
