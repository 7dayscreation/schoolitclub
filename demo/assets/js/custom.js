/**
 * School IT Club - Custom JavaScript
 * All custom scripts, user session/auth, directory search, and module interactions.
 */

(function () {
    'use strict';

    // =========================================================================
    // 1. HEADER MODULE: Authentication, User Session, Category & Filter Sidebar
    // =========================================================================
    window.initHeaderModule = function () {
        const headerLoginBtn = document.getElementById('header-login-btn');
        const headerUserDropdown = document.getElementById('header-user-dropdown');
        const mobileLoginBtn = document.getElementById('mobile-login-btn');
        const headerLogoutBtn = document.getElementById('header-logout-btn');
        const signinForm = document.getElementById('signin-form');

        // Apply UI state based on logged in user or null
        // Called on page load (session restore) and after login/logout actions.
        function applyUserSessionUI(user) {
            if (!user) {
                // ── Logged Out State ──────────────────────────────────────
                // Show: Login button (desktop + mobile)
                if (headerLoginBtn) {
                    headerLoginBtn.style.setProperty('display', 'inline-flex', 'important');
                    headerLoginBtn.classList.remove('auth-hidden', 'd-none');
                }
                // Hide: User profile dropdown
                if (headerUserDropdown) {
                    headerUserDropdown.style.setProperty('display', 'none', 'important');
                    headerUserDropdown.classList.remove('is-active');
                    headerUserDropdown.classList.add('d-none');
                }
                // Show: Mobile login button
                if (mobileLoginBtn) {
                    mobileLoginBtn.style.setProperty('display', 'inline-flex', 'important');
                    mobileLoginBtn.classList.remove('d-none');
                }
                return;
            }

            // ── Logged In State ───────────────────────────────────────────
            // Hide: Login button (desktop + mobile) – use !important to beat inline styles
            if (headerLoginBtn) {
                headerLoginBtn.style.setProperty('display', 'none', 'important');
                headerLoginBtn.classList.add('auth-hidden', 'd-none');
            }
            // Show: User profile dropdown
            if (headerUserDropdown) {
                headerUserDropdown.style.removeProperty('display');
                headerUserDropdown.style.setProperty('display', 'flex', 'important');
                headerUserDropdown.classList.remove('d-none');
                headerUserDropdown.classList.add('is-active');
            }
            // Hide: Mobile login button
            if (mobileLoginBtn) {
                mobileLoginBtn.style.setProperty('display', 'none', 'important');
                mobileLoginBtn.classList.add('d-none');
            }

            // Populate user details in the profile dropdown
            const headerUserName  = document.getElementById('header-user-name');
            const headerUserRole  = document.getElementById('header-user-role');
            const headerUserAvatar = document.getElementById('header-user-avatar');
            const popupAvatarImg  = document.getElementById('popup-avatar-img');
            const popupName       = document.getElementById('popup-name');
            const popupEmail      = document.getElementById('popup-email');
            const popupRoleBadge  = document.getElementById('popup-role-badge');

            if (headerUserName)  headerUserName.textContent  = user.shortName || user.name;
            if (headerUserRole)  headerUserRole.textContent  = user.roleBadge  || 'Student';
            if (popupName)       popupName.textContent       = user.name;
            if (popupEmail)      popupEmail.textContent      = user.email;
            if (popupRoleBadge) {
                popupRoleBadge.textContent      = user.roleTitle || 'Student';
                popupRoleBadge.style.background = user.role === 'mentor' ? '#3b82f6' : '#10b981';
            }
        }

        function loginUser(userObj) {
            localStorage.setItem('schoolitclub_session', JSON.stringify(userObj));
            applyUserSessionUI(userObj);
        }

        function logoutUser() {
            localStorage.removeItem('schoolitclub_session');
            applyUserSessionUI(null);
            alert('You have successfully logged out.');
        }

        // ── Session Restore on every page load ──────────────────────────────
        // ALWAYS call applyUserSessionUI — even with null — to guarantee
        // a clean, consistent header state regardless of what CSS/HTML defaults.
        try {
            const savedSession = localStorage.getItem('schoolitclub_session');
            const sessionUser = savedSession ? JSON.parse(savedSession) : null;
            applyUserSessionUI(sessionUser); // null → logged-out UI, object → logged-in UI
        } catch (err) {
            console.error('Session restore error:', err);
            applyUserSessionUI(null); // Fail-safe: show logged-out state
        }

        // Sign In Form Submission
        if (signinForm && !signinForm.dataset.bound) {
            signinForm.dataset.bound = 'true';
            signinForm.addEventListener('submit', function (e) {
                e.preventDefault();
                const inputEmail = this.querySelector('input[type="text"]').value.trim() || 'pratham@school.edu';
                const isMentor = inputEmail.includes('mentor') || inputEmail.includes('teacher');

                const user = {
                    name: isMentor ? 'Prof. Rajesh Sharma' : 'Pratham Mehta',
                    shortName: isMentor ? 'Prof. Rajesh' : 'Pratham M.',
                    email: inputEmail,
                    role: isMentor ? 'mentor' : 'student',
                    roleTitle: isMentor ? 'Verified Mentor' : 'Verified Student',
                    roleBadge: isMentor ? 'Faculty Mentor' : 'Grade 10 • Student'
                };

                loginUser(user);

                const authSidebarEl = document.getElementById('authSidebar');
                if (authSidebarEl && window.bootstrap) {
                    const offcanvasInstance = bootstrap.Offcanvas.getInstance(authSidebarEl) || new bootstrap.Offcanvas(authSidebarEl);
                    offcanvasInstance.hide();
                }

                alert(`Welcome back, ${user.shortName}! You are now logged in.`);
            });
        }

        // Logout button
        if (headerLogoutBtn && !headerLogoutBtn.dataset.bound) {
            headerLogoutBtn.dataset.bound = 'true';
            headerLogoutBtn.addEventListener('click', function (e) {
                e.preventDefault();
                logoutUser();
            });
        }

        // Auth Sidebar Tabs, Role Switching & OTP
        const tabSignIn = document.getElementById('auth-tab-signin');
        const tabRegister = document.getElementById('auth-tab-register');
        const panelSignIn = document.getElementById('auth-signin-panel');
        const panelRegister = document.getElementById('auth-register-panel');
        const panelOtp = document.getElementById('auth-otp-panel');
        const panelSuccess = document.getElementById('auth-success-panel');
        const switchToRegister = document.getElementById('switch-to-register');
        const switchToSignIn = document.getElementById('switch-to-signin');
        const rolePills = document.querySelectorAll('.auth-role-selector .role-pill');
        const studentRegForm = document.getElementById('student-register-form');
        const mentorRegForm = document.getElementById('mentor-register-form');
        const studentAgeInput = document.getElementById('student-age');
        const parentEmailInput = document.getElementById('parent-email');
        const parentStar = document.getElementById('parent-star');
        const parentAgeNote = document.getElementById('parent-age-note');
        const otpSentToEmail = document.getElementById('otp-sent-to-email');
        const otpDestinationDesc = document.getElementById('otp-destination-desc');
        const otpVerifyForm = document.getElementById('otp-verify-form');
        const btnOtpBack = document.getElementById('btn-otp-back');
        const btnResendOtp = document.getElementById('btn-resend-otp');
        const otpBoxes = document.querySelectorAll('.otp-box');

        function hideAllAuthPanels() {
            if (panelSignIn) panelSignIn.style.display = 'none';
            if (panelRegister) panelRegister.style.display = 'none';
            if (panelOtp) panelOtp.style.display = 'none';
            if (panelSuccess) panelSuccess.style.display = 'none';
        }

        function showSignIn() {
            hideAllAuthPanels();
            if (tabSignIn && tabRegister && panelSignIn) {
                tabSignIn.classList.add('active');
                tabRegister.classList.remove('active');
                panelSignIn.style.display = 'block';
            }
        }

        function showRegister() {
            hideAllAuthPanels();
            if (tabSignIn && tabRegister && panelRegister) {
                tabRegister.classList.add('active');
                tabSignIn.classList.remove('active');
                panelRegister.style.display = 'block';
                updateRegisterRoleForm();
            }
        }

        function updateRegisterRoleForm() {
            const activeRole = document.querySelector('.auth-role-selector .role-pill.active');
            const role = activeRole ? activeRole.getAttribute('data-role') : 'student';
            if (role === 'mentor') {
                if (studentRegForm) studentRegForm.style.display = 'none';
                if (mentorRegForm) mentorRegForm.style.display = 'block';
            } else {
                if (studentRegForm) studentRegForm.style.display = 'block';
                if (mentorRegForm) mentorRegForm.style.display = 'none';
                checkStudentAgeValidation();
            }
        }

        function checkStudentAgeValidation() {
            if (!studentAgeInput || !parentEmailInput) return;
            const age = parseInt(studentAgeInput.value, 10);
            if (!isNaN(age) && age < 18) {
                parentEmailInput.required = true;
                if (parentStar) parentStar.style.display = 'inline';
                if (parentAgeNote) {
                    parentAgeNote.style.display = 'block';
                    parentAgeNote.innerHTML = '🛡️ <strong>Age Verification:</strong> Under 18 accounts require parental approval. The 1st time verification OTP will be sent directly to your Parent\'s Email.';
                }
            } else {
                parentEmailInput.required = false;
                if (parentStar) parentStar.style.display = 'none';
                if (parentAgeNote) {
                    parentAgeNote.style.display = 'none';
                }
            }
        }

        if (studentAgeInput && !studentAgeInput.dataset.bound) {
            studentAgeInput.dataset.bound = 'true';
            studentAgeInput.addEventListener('input', checkStudentAgeValidation);
            studentAgeInput.addEventListener('change', checkStudentAgeValidation);
            checkStudentAgeValidation();
        }

        if (tabSignIn && !tabSignIn.dataset.bound) {
            tabSignIn.dataset.bound = 'true';
            tabSignIn.addEventListener('click', showSignIn);
        }
        if (tabRegister && !tabRegister.dataset.bound) {
            tabRegister.dataset.bound = 'true';
            tabRegister.addEventListener('click', showRegister);
        }
        if (switchToRegister && !switchToRegister.dataset.bound) {
            switchToRegister.dataset.bound = 'true';
            switchToRegister.addEventListener('click', function (e) { e.preventDefault(); showRegister(); });
        }
        if (switchToSignIn && !switchToSignIn.dataset.bound) {
            switchToSignIn.dataset.bound = 'true';
            switchToSignIn.addEventListener('click', function (e) { e.preventDefault(); showSignIn(); });
        }

        rolePills.forEach(pill => {
            if (!pill.dataset.bound) {
                pill.dataset.bound = 'true';
                pill.addEventListener('click', function () {
                    rolePills.forEach(p => p.classList.remove('active'));
                    this.classList.add('active');
                    updateRegisterRoleForm();
                });
            }
        });

        // Student Registration -> OTP
        if (studentRegForm && !studentRegForm.dataset.bound) {
            studentRegForm.dataset.bound = 'true';
            studentRegForm.addEventListener('submit', function (e) {
                e.preventDefault();
                const age = parseInt(studentAgeInput.value, 10);
                const studentEmail = document.getElementById('student-email').value.trim();
                const parentEmail = parentEmailInput.value.trim();

                hideAllAuthPanels();
                if (panelOtp) panelOtp.style.display = 'block';

                if (age < 18) {
                    if (otpSentToEmail) otpSentToEmail.textContent = parentEmail || studentEmail;
                    if (otpDestinationDesc) {
                        otpDestinationDesc.innerHTML = `Under 18 verification: We sent a 6-digit OTP to your Parent's Email:<br><strong class="text_black">${parentEmail}</strong>`;
                    }
                } else {
                    if (otpSentToEmail) otpSentToEmail.textContent = studentEmail;
                    if (otpDestinationDesc) {
                        otpDestinationDesc.innerHTML = `We sent a 6-digit OTP to your Email:<br><strong class="text_black">${studentEmail}</strong>`;
                    }
                }

                if (otpBoxes.length > 0) otpBoxes[0].focus();
            });
        }

        // Mentor Registration -> OTP
        if (mentorRegForm && !mentorRegForm.dataset.bound) {
            mentorRegForm.dataset.bound = 'true';
            mentorRegForm.addEventListener('submit', function (e) {
                e.preventDefault();
                const mentorEmail = document.getElementById('mentor-email').value.trim();

                hideAllAuthPanels();
                if (panelOtp) panelOtp.style.display = 'block';
                if (otpSentToEmail) otpSentToEmail.textContent = mentorEmail;
                if (otpDestinationDesc) {
                    otpDestinationDesc.innerHTML = `We sent a 6-digit OTP to your Mentor Email:<br><strong class="text_black">${mentorEmail}</strong>`;
                }

                if (otpBoxes.length > 0) otpBoxes[0].focus();
            });
        }

        // OTP Box Auto-Advance
        otpBoxes.forEach((box, index) => {
            if (!box.dataset.bound) {
                box.dataset.bound = 'true';
                box.addEventListener('input', function () {
                    if (this.value.length === 1 && index < otpBoxes.length - 1) {
                        otpBoxes[index + 1].focus();
                    }
                });
                box.addEventListener('keydown', function (e) {
                    if (e.key === 'Backspace' && this.value === '' && index > 0) {
                        otpBoxes[index - 1].focus();
                    }
                });
            }
        });

        // OTP Verify -> Login
        if (otpVerifyForm && !otpVerifyForm.dataset.bound) {
            otpVerifyForm.dataset.bound = 'true';
            otpVerifyForm.addEventListener('submit', function (e) {
                e.preventDefault();
                hideAllAuthPanels();
                if (panelSuccess) panelSuccess.style.display = 'block';

                const registeredStudentEmail = document.getElementById('student-email') ? document.getElementById('student-email').value : 'student@schoolitclub.com';
                const firstName = document.getElementById('student-firstname') ? document.getElementById('student-firstname').value : 'Student';
                const grade = document.getElementById('student-grade') ? document.getElementById('student-grade').value : '10';

                loginUser({
                    name: `${firstName} Student`,
                    shortName: firstName,
                    email: registeredStudentEmail,
                    role: 'student',
                    roleTitle: 'Verified Student',
                    roleBadge: `Grade ${grade} • Student`
                });
            });
        }

        if (btnOtpBack && !btnOtpBack.dataset.bound) {
            btnOtpBack.dataset.bound = 'true';
            btnOtpBack.addEventListener('click', function (e) {
                e.preventDefault();
                showRegister();
            });
        }

        if (btnResendOtp && !btnResendOtp.dataset.bound) {
            btnResendOtp.dataset.bound = 'true';
            btnResendOtp.addEventListener('click', function () {
                this.textContent = 'OTP Resent Successfully! (30s)';
                this.disabled = true;
                setTimeout(() => {
                    this.textContent = 'Resend OTP';
                    this.disabled = false;
                }, 5000);
            });
        }

        // ── Advanced Filter Sidebar UI/UX Pro Max Bindings ───────────────────
        function updateSidebarActiveCount() {
            const activeItems = document.querySelectorAll('#filterSidebar .sidebar-role-card.active, #filterSidebar .sidebar-chip.active, #filterSidebar .sidebar-exp-row.active');
            const count = activeItems.length;
            const countPill = document.getElementById('sidebar-active-count');
            const applyBtn = document.getElementById('btn-apply-filters');

            if (countPill) {
                countPill.textContent = count;
                countPill.style.display = count > 0 ? 'inline-block' : 'none';
            }
            if (applyBtn) {
                applyBtn.querySelector('span').textContent = count > 0 ? `Apply Filters (${count})` : 'Apply Filters';
            }
        }

        // Shared helper: radio-style or multi-select toggle for filter groups
        function bindFilterGroup(selector, multiSelect, onChange) {
            const items = document.querySelectorAll(selector);
            items.forEach(item => {
                if (!item.dataset.bound) {
                    item.dataset.bound = 'true';
                    item.addEventListener('click', function () {
                        if (multiSelect) {
                            this.classList.toggle('active');
                        } else {
                            const wasActive = this.classList.contains('active');
                            items.forEach(i => i.classList.remove('active'));
                            if (!wasActive) this.classList.add('active');
                        }
                        if (typeof onChange === 'function') onChange(this);
                        updateSidebarActiveCount();
                    });
                }
            });
        }

        // 1. Member Role — single-select with grade-section visibility toggle
        bindFilterGroup('#filter-member-type .sidebar-role-card', false, function (selectedEl) {
            const role = selectedEl.getAttribute('data-value');
            const gradeSection = document.getElementById('sidebar-grade-section');
            if (gradeSection) {
                gradeSection.style.display = (role === 'Student') ? 'block' : 'none';
            }
        });

        // 2. Grade Level — single-select
        bindFilterGroup('#filter-grade-level .sidebar-chip', false);

        // 3. Topics & Skills — multi-select
        bindFilterGroup('#filter-topic .sidebar-chip', true);

        // 4. Experience Level — single-select
        bindFilterGroup('#filter-experience .sidebar-exp-row', false);

        // 5. Location / Region — single-select
        bindFilterGroup('#filter-location .sidebar-chip', false);

        // Reset Button
        const btnResetFilters = document.getElementById('btn-reset-filters');
        if (btnResetFilters && !btnResetFilters.dataset.bound) {
            btnResetFilters.dataset.bound = 'true';
            btnResetFilters.addEventListener('click', function () {
                document.querySelectorAll('#filterSidebar .sidebar-role-card, #filterSidebar .sidebar-chip, #filterSidebar .sidebar-exp-row').forEach(el => el.classList.remove('active'));
                // Default back to student
                const studentCard = document.querySelector('#filter-member-type .sidebar-role-card[data-value="Student"]');
                if (studentCard) studentCard.classList.add('active');
                const gradeSection = document.getElementById('sidebar-grade-section');
                if (gradeSection) gradeSection.style.display = 'block';
                updateSidebarActiveCount();
            });
        }

        // Apply Filters Button
        const btnApplyFilters = document.getElementById('btn-apply-filters');
        if (btnApplyFilters && !btnApplyFilters.dataset.bound) {
            btnApplyFilters.dataset.bound = 'true';
            btnApplyFilters.addEventListener('click', function () {
                const filterSidebarEl = document.getElementById('filterSidebar');
                if (filterSidebarEl && window.bootstrap) {
                    const offcanvasInstance = bootstrap.Offcanvas.getInstance(filterSidebarEl) || new bootstrap.Offcanvas(filterSidebarEl);
                    offcanvasInstance.hide();
                }
            });
        }

        // Topic / Category Dropdown Selection
        const topicDropdownBtn = document.getElementById('topicDropdown') || document.getElementById('cityDropdown');
        const topicDropdownItems = document.querySelectorAll('.header-city-dropdown .dropdown-item');
        if (topicDropdownBtn && topicDropdownItems.length) {
            topicDropdownItems.forEach(item => {
                if (!item.dataset.bound) {
                    item.dataset.bound = 'true';
                    item.addEventListener('click', function (e) {
                        e.preventDefault();
                        const selectedTopic = this.getAttribute('data-topic') || this.getAttribute('data-city') || this.textContent.trim();
                        topicDropdownBtn.textContent = selectedTopic;
                        topicDropdownItems.forEach(i => i.classList.remove('active'));
                        this.classList.add('active');
                    });
                }
            });
        }
    };

    // =========================================================================
    // 2. FOOTER MODULE: Mobile Accordion & Back to Top Progress
    // =========================================================================
    window.initFooterModule = function () {
        if (!window.jQuery) return;
        const $ = window.jQuery;
        const isMobile = () => window.matchMedia("only screen and (max-width: 767px)").matches;

        // Mobile Footer Accordion
        const $headers = $(".footer-heading-mobile");
        $headers.off("click").on("click", function () {
            if (isMobile()) {
                const $block = $(this).parent(".footer-col-block").toggleClass("open");
                $block.hasClass("open") ? $(this).next().slideDown(250) : $(this).next().slideUp(250);
            }
        });

        // Back to Top Circle Progress
        const $wrap = $(".progress-wrap");
        if ($wrap.length) {
            const path = $wrap.find("path")[0];
            if (path) {
                const length = path.getTotalLength();
                path.style.strokeDasharray = `${length} ${length}`;
                path.style.strokeDashoffset = length;

                const updateProgress = () => {
                    const scroll = $(window).scrollTop();
                    const docH = $(document).height() - $(window).height();
                    if (docH > 0) {
                        path.style.strokeDashoffset = length - (scroll * length) / docH;
                    }
                };

                const checkVisibility = () => {
                    const scroll = $(window).scrollTop();
                    const $footerGoTop = $(".footer-go-top");
                    const footerTop = $footerGoTop.length ? $footerGoTop.offset().top : 999999;
                    const winHeight = $(window).height();
                    const visible = scroll > 200 && (scroll + winHeight < footerTop - 100);
                    $wrap.toggleClass("active-progress", visible);
                };

                updateProgress();
                $(window).off("scroll.footerProgress").on("scroll.footerProgress", () => {
                    updateProgress();
                    checkVisibility();
                });
            }

            $(".progress-wrap, .footer-go-top").off("click.footerGoTop").on("click.footerGoTop", function (e) {
                e.preventDefault();
                $("html, body").animate({ scrollTop: 0 }, 300);
            });
        }
    };

    // =========================================================================
    // 3. HOMEPAGE: Advanced Directory Search & Filter Logic
    // =========================================================================
    window.initDirectorySearch = function () {

        // ── School IT Club Directory Data ─────────────────────────────────────
        // 3 roles: student | teacher | professional
        const DIRECTORY_DATA = [
            // ── STUDENTS ──────────────────────────────────────────────────────
            {
                id: 1, role: 'student',
                name: 'Pratham Mehta',
                grade: 'Grade 10 · Lead Coder',
                country: 'India', state: 'Gujarat', city: 'Ahmedabad',
                rating: 4.9, reviews: 14,
                avatar: 'assets/images/avatar/main-avatar.jpg',
                tags: ['Python', 'AI Tools', 'Web Dev'],
                badge: 'Top Coder'
            },
            {
                id: 2, role: 'student',
                name: 'Riya Shah',
                grade: 'Grade 9 · UI Specialist',
                country: 'India', state: 'Gujarat', city: 'Surat',
                rating: 4.8, reviews: 9,
                avatar: 'assets/images/avatar/main-avatar.jpg',
                tags: ['UI/UX Design', 'Figma', 'Web Dev'],
                badge: 'Design Star'
            },
            {
                id: 3, role: 'student',
                name: 'Arjun Patel',
                grade: 'Grade 11 · App Dev',
                country: 'India', state: 'Gujarat', city: 'Vadodara',
                rating: 4.8, reviews: 11,
                avatar: 'assets/images/avatar/main-avatar.jpg',
                tags: ['Java', 'Robotics', 'Python'],
                badge: 'App Builder'
            },
            {
                id: 4, role: 'student',
                name: 'Sneha Joshi',
                grade: 'Grade 8 · STEM Junior',
                country: 'India', state: 'Maharashtra', city: 'Mumbai',
                rating: 4.7, reviews: 7,
                avatar: 'assets/images/avatar/main-avatar.jpg',
                tags: ['Web Dev', 'AI Tools', 'Robotics'],
                badge: 'Rising Star'
            },
            // ── TEACHERS / MENTORS ────────────────────────────────────────────
            {
                id: 5, role: 'teacher',
                name: 'Prof. Rajesh Sharma',
                grade: 'Faculty Mentor · 12 Yrs Exp',
                country: 'India', state: 'Gujarat', city: 'Ahmedabad',
                rating: 5.0, reviews: 48,
                avatar: 'assets/images/avatar/main-avatar.jpg',
                tags: ['Java', 'C++', 'Robotics'],
                badge: 'Verified Mentor'
            },
            {
                id: 6, role: 'teacher',
                name: 'Ms. Priya Nair',
                grade: 'School Faculty · AI Lead',
                country: 'India', state: 'Maharashtra', city: 'Mumbai',
                rating: 4.9, reviews: 35,
                avatar: 'assets/images/avatar/main-avatar.jpg',
                tags: ['AI Tools', 'Python', 'STEM'],
                badge: 'Verified Mentor'
            },
            {
                id: 7, role: 'teacher',
                name: 'Mr. Deepak Verma',
                grade: 'Tech Trainer · Web Mentor',
                country: 'India', state: 'Delhi', city: 'Delhi',
                rating: 4.8, reviews: 29,
                avatar: 'assets/images/avatar/main-avatar.jpg',
                tags: ['Web Dev', 'UI/UX Design', 'Java'],
                badge: 'Club Lead'
            },
            // ── PROFESSIONALS ─────────────────────────────────────────────────
            {
                id: 8, role: 'professional',
                name: 'Aakash Freelance Studio',
                grade: 'Senior Fullstack Architect',
                country: 'India', state: 'Gujarat', city: 'Ahmedabad',
                rating: 4.9, reviews: 26,
                avatar: 'assets/images/avatar/main-avatar.jpg',
                tags: ['Web Dev', 'UI/UX Design', 'Python'],
                badge: 'Industry Pro'
            },
            {
                id: 9, role: 'professional',
                name: 'TechCraft Solutions',
                grade: 'Mobile & Cloud Consultant',
                country: 'India', state: 'Maharashtra', city: 'Mumbai',
                rating: 4.8, reviews: 21,
                avatar: 'assets/images/avatar/main-avatar.jpg',
                tags: ['Java', 'Robotics', 'Web Dev'],
                badge: 'Industry Pro'
            },
            {
                id: 10, role: 'professional',
                name: 'CodeNest Labs',
                grade: 'AI & Data Science Partner',
                country: 'India', state: 'Gujarat', city: 'Surat',
                rating: 4.9, reviews: 34,
                avatar: 'assets/images/avatar/main-avatar.jpg',
                tags: ['AI Tools', 'Python', 'Robotics'],
                badge: 'Club Alumni'
            }
        ];

        // ── DOM References ────────────────────────────────────────────────────
        const cardsContainer = document.getElementById('adv-results-grid');
        if (!cardsContainer) return; // Not on homepage

        const countrySelect  = document.getElementById('adv-country-select');
        const stateSelect    = document.getElementById('adv-state-select');
        const citySelect     = document.getElementById('adv-city-select');
        const searchInput    = document.getElementById('adv-search-input');
        const btnSearch      = document.getElementById('adv-btn-search');
        const btnReset       = document.getElementById('adv-btn-reset');
        const resultsCount   = document.getElementById('adv-results-count');
        const typeTabs       = document.querySelectorAll('#filter-type-tabs .type-tab');

        // Track the currently selected role tab
        let activeRole = 'student';

        // ── Tab Switching ─────────────────────────────────────────────────────
        typeTabs.forEach(tab => {
            if (!tab.dataset.bound) {
                tab.dataset.bound = 'true';
                tab.addEventListener('click', function () {
                    typeTabs.forEach(t => t.classList.remove('active'));
                    this.classList.add('active');
                    activeRole = this.getAttribute('data-type');
                    // Re-filter live if results panel is already open
                    const rw = document.getElementById('adv-results-wrapper');
                    if (rw && rw.style.display !== 'none') {
                        filterDirectory();
                    }
                });
            }
        });

        // ── Badge colour & theme map ─────────────────────────────────────────
        const BADGE_CONFIG = {
            'Top Coder':       { color: '#4f46e5', bg: '#eef2ff', border: '#c7d2fe', accent: '#4f46e5' },
            'Design Star':     { color: '#ec4899', bg: '#fdf2f8', border: '#fbcfe8', accent: '#ec4899' },
            'App Builder':     { color: '#d97706', bg: '#fffbeb', border: '#fde68a', accent: '#f59e0b' },
            'Rising Star':     { color: '#059669', bg: '#ecfdf5', border: '#a7f3d0', accent: '#10b981' },
            'Verified Mentor': { color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe', accent: '#3b82f6' },
            'Club Lead':       { color: '#7c3aed', bg: '#f5f3ff', border: '#ddd6fe', accent: '#8b5cf6' },
            'Industry Pro':    { color: '#0284c7', bg: '#f0f9ff', border: '#bae6fd', accent: '#0ea5e9' },
            'Club Alumni':     { color: '#0d9488', bg: '#f0fdfa', border: '#99f6e4', accent: '#14b8a6' }
        };

        // ── Render Cards ──────────────────────────────────────────────────────
        function renderDirectory(items) {
            const roleLabel = { student: 'Student', teacher: 'Teacher / Mentor', professional: 'Professional' };
            if (resultsCount) {
                resultsCount.textContent = `${items.length} ${roleLabel[activeRole] || 'Member'}${items.length !== 1 ? 's' : ''} Found`;
            }

            if (items.length === 0) {
                cardsContainer.innerHTML = `
                    <div class="col-12 text-center py-5">
                        <div class="mb-3 d-inline-flex align-items-center justify-content-center p-3 rounded-circle" style="background:#f1f5f9; color:#64748b;">
                            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <circle cx="11" cy="11" r="8"></circle>
                                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                                <line x1="8" y1="11" x2="14" y2="11"></line>
                            </svg>
                        </div>
                        <h5 class="fw-7 text_black mb-1">No Matching Members Found</h5>
                        <p class="text-caption text_mono-gray-5" style="max-width:440px; margin:0 auto;">
                            Try clearing your keyword filter, searching by a different city or state, or switching role tabs above.
                        </p>
                    </div>`;
                return;
            }

            cardsContainer.innerHTML = items.map(item => {
                const badgeInfo = BADGE_CONFIG[item.badge] || { color: '#4f46e5', bg: '#eef2ff', border: '#c7d2fe', accent: '#4f46e5' };
                return `
                <div class="col-12 col-md-6 col-lg-3">
                    <div class="adv-member-card" style="--card-accent: ${badgeInfo.accent};">
                        <div>
                            <!-- Header: Avatar + Name + Badge -->
                            <div class="adv-card-header">
                                <div class="adv-avatar-wrap">
                                    <img src="${item.avatar}" alt="${item.name}" class="adv-avatar-img">
                                    <span class="adv-online-badge" title="Active Member"></span>
                                </div>
                                <div>
                                    <h6 class="adv-card-name">${item.name}</h6>
                                    <span class="adv-role-badge" style="color:${badgeInfo.color}; background:${badgeInfo.bg}; border:1px solid ${badgeInfo.border};">
                                        ${item.badge}
                                    </span>
                                </div>
                            </div>

                            <!-- Meta Info (Grade & Location with SVG icons) -->
                            <div class="adv-card-meta">
                                <div class="adv-card-meta-item">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                        <path d="M22 10v6M2 10l10-5 10 5-10 5z"></path>
                                        <path d="M6 12v5c3 3 9 3 12 0v-5"></path>
                                    </svg>
                                    <span>${item.grade}</span>
                                </div>
                                <div class="adv-card-meta-item">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                                        <circle cx="12" cy="10" r="3"></circle>
                                    </svg>
                                    <span>${item.city}, ${item.state}</span>
                                </div>
                            </div>

                            <!-- Rating & Reviews -->
                            <div class="adv-rating-row">
                                <span class="adv-rating-pill">
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="#f59e0b" stroke="#f59e0b" stroke-width="1">
                                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                                    </svg>
                                    ${item.rating.toFixed(1)}
                                </span>
                                <span class="adv-reviews-count">(${item.reviews} reviews)</span>
                            </div>

                            <!-- Skills Tags -->
                            <div class="adv-tags-row">
                                ${item.tags.map(t => `<span class="adv-skill-tag">${t}</span>`).join('')}
                            </div>
                        </div>

                        <!-- Action Button -->
                        <a href="#" class="adv-card-btn" data-bs-toggle="offcanvas" data-bs-target="#filterSidebar">
                            <span>View Profile</span>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                                <line x1="5" y1="12" x2="19" y2="12"></line>
                                <polyline points="12 5 19 12 12 19"></polyline>
                            </svg>
                        </a>
                    </div>
                </div>`;
            }).join('');
        }

        // ── Validation: at least one field must be filled ─────────────────────
        function hasAnyFilter() {
            const query   = searchInput   ? searchInput.value.trim() : '';
            const country = countrySelect ? countrySelect.value      : 'all';
            const state   = stateSelect   ? stateSelect.value        : 'all';
            const city    = citySelect    ? citySelect.value         : 'all';
            return query !== '' || country !== 'all' || state !== 'all' || city !== 'all';
        }

        // ── Filter Logic ──────────────────────────────────────────────────────
        function filterDirectory() {
            const query          = searchInput   ? searchInput.value.toLowerCase().trim() : '';
            const selectedCountry= countrySelect ? countrySelect.value : 'all';
            const selectedState  = stateSelect   ? stateSelect.value   : 'all';
            const selectedCity   = citySelect    ? citySelect.value    : 'all';

            const filtered = DIRECTORY_DATA.filter(item => {
                const matchRole    = item.role === activeRole;
                const matchQuery   = !query
                    || item.name.toLowerCase().includes(query)
                    || item.grade.toLowerCase().includes(query)
                    || item.tags.some(t => t.toLowerCase().includes(query));
                const matchCountry = selectedCountry === 'all' || item.country.toLowerCase() === selectedCountry.toLowerCase();
                const matchState   = selectedState   === 'all' || item.state.toLowerCase()   === selectedState.toLowerCase();
                const matchCity    = selectedCity    === 'all' || item.city.toLowerCase()    === selectedCity.toLowerCase();
                return matchRole && matchQuery && matchCountry && matchState && matchCity;
            });

            renderDirectory(filtered);
        }

        // ── Clear Input Button Logic ──────────────────────────────────────────
        const clearInputBtn = document.getElementById('adv-clear-input');
        if (searchInput && clearInputBtn) {
            searchInput.addEventListener('input', function () {
                clearInputBtn.style.display = this.value ? 'inline-flex' : 'none';
            });
            clearInputBtn.addEventListener('click', function () {
                searchInput.value = '';
                clearInputBtn.style.display = 'none';
                searchInput.focus();
                // If results visible, re-filter or clear
                const rw = document.getElementById('adv-results-wrapper');
                if (rw && rw.style.display !== 'none') {
                    filterDirectory();
                }
            });
        }

        // ── Quick Suggestion Chips Logic ──────────────────────────────────────
        const suggestChips = document.querySelectorAll('.adv-suggest-chip');
        suggestChips.forEach(chip => {
            if (!chip.dataset.bound) {
                chip.dataset.bound = 'true';
                chip.addEventListener('click', function () {
                    const skill = this.getAttribute('data-skill');
                    if (searchInput) {
                        searchInput.value = skill;
                        if (clearInputBtn) clearInputBtn.style.display = 'inline-flex';
                    }
                    suggestChips.forEach(c => c.classList.remove('active-chip'));
                    this.classList.add('active-chip');
                    const resultsWrapper = document.getElementById('adv-results-wrapper');
                    if (resultsWrapper) resultsWrapper.style.display = 'block';
                    filterDirectory();
                });
            }
        });

        // ── Search Button ─────────────────────────────────────────────────────
        if (btnSearch && !btnSearch.dataset.bound) {
            btnSearch.dataset.bound = 'true';
            btnSearch.addEventListener('click', function () {
                const resultsWrapper = document.getElementById('adv-results-wrapper');

                // Show prompt if no filter is set
                if (!hasAnyFilter()) {
                    if (resultsWrapper) {
                        resultsWrapper.style.display = 'block';
                        cardsContainer.innerHTML = `
                            <div class="col-12 text-center py-5">
                                <div class="mb-3 d-inline-flex align-items-center justify-content-center p-3 rounded-circle" style="background:#fef3c7; color:#d97706;">
                                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                        <polyline points="14 2 14 8 20 8"></polyline>
                                        <line x1="16" y1="13" x2="8" y2="13"></line>
                                        <line x1="16" y1="17" x2="8" y2="17"></line>
                                        <polyline points="10 9 9 9 8 9"></polyline>
                                    </svg>
                                </div>
                                <h5 class="fw-7 text_black mb-1">Please Select or Enter Filter Criteria</h5>
                                <p class="text-caption text_mono-gray-5" style="max-width:440px; margin:0 auto;">
                                    Type a skill/name above, pick a Country/State/City, or click a trending skill chip to explore members.
                                </p>
                            </div>`;
                        if (resultsCount) resultsCount.textContent = '0 Criteria Selected';
                    }
                    return;
                }

                if (resultsWrapper) resultsWrapper.style.display = 'block';
                filterDirectory();
                setTimeout(() => {
                    if (resultsWrapper) resultsWrapper.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                }, 50);
            });
        }

        // ── Clear & Close Results Button ──────────────────────────────────────
        const clearResultsBtn = document.getElementById('adv-clear-results-btn');
        if (clearResultsBtn && !clearResultsBtn.dataset.bound) {
            clearResultsBtn.dataset.bound = 'true';
            clearResultsBtn.addEventListener('click', function () {
                const resultsWrapper = document.getElementById('adv-results-wrapper');
                if (resultsWrapper) resultsWrapper.style.display = 'none';
            });
        }

        // ── Enter Key on Search Input ─────────────────────────────────────────
        if (searchInput && !searchInput.dataset.bound) {
            searchInput.dataset.bound = 'true';
            searchInput.addEventListener('keypress', function (e) {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    if (btnSearch) btnSearch.click();
                }
            });
        }

        // ── Reset Button ──────────────────────────────────────────────────────
        if (btnReset && !btnReset.dataset.bound) {
            btnReset.dataset.bound = 'true';
            btnReset.addEventListener('click', function () {
                if (searchInput)   searchInput.value   = '';
                if (clearInputBtn) clearInputBtn.style.display = 'none';
                if (countrySelect) countrySelect.value = 'all';
                if (stateSelect)   stateSelect.value   = 'all';
                if (citySelect)    citySelect.value    = 'all';
                suggestChips.forEach(c => c.classList.remove('active-chip'));
                // Reset tab back to Students
                activeRole = 'student';
                typeTabs.forEach(t => t.classList.remove('active'));
                const firstTab = document.querySelector('#filter-type-tabs .type-tab[data-type="student"]');
                if (firstTab) firstTab.classList.add('active');
                // Hide results panel
                const resultsWrapper = document.getElementById('adv-results-wrapper');
            });
        }
    };

    // =========================================================================
    // 4. AI PROMPTS LIBRARY: 1-Click Copy & Engagement Logic
    // =========================================================================
    window.initPromptLibrary = function () {
        // Create Toast element if not present
        let toast = document.getElementById('prompt-toast');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'prompt-toast';
            toast.className = 'prompt-toast-pill';
            toast.innerHTML = `
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
                <span>Prompt copied to clipboard!</span>
            `;
            document.body.appendChild(toast);
        }

        function showPromptToast(msg) {
            if (!toast) return;
            if (msg) toast.querySelector('span').textContent = msg;
            toast.classList.add('show');
            setTimeout(() => {
                toast.classList.remove('show');
            }, 2200);
        }

        // Copy button handler
        document.querySelectorAll('.btn-copy-prompt, .btn-quick-copy-overlay').forEach(btn => {
            if (btn.dataset.boundCopy) return;
            btn.dataset.boundCopy = 'true';

            btn.addEventListener('click', async function (e) {
                e.preventDefault();
                e.stopPropagation();

                const card = this.closest('.prompt-card');
                let textToCopy = this.getAttribute('data-prompt');

                if (!textToCopy && card) {
                    const textEl = card.querySelector('.prompt-text-content');
                    if (textEl) {
                        textToCopy = textEl.textContent.trim().replace(/^["']|["']$/g, '');
                    }
                }

                if (!textToCopy) return;

                try {
                    await navigator.clipboard.writeText(textToCopy);

                    // Update UI feedback on clicked button
                    const copyBtn = card ? card.querySelector('.btn-copy-prompt') : this;
                    if (copyBtn) {
                        const copyIcon = copyBtn.querySelector('.copy-icon');
                        const checkIcon = copyBtn.querySelector('.check-icon');
                        const copyText = copyBtn.querySelector('.copy-text');

                        copyBtn.classList.add('copied');
                        if (copyIcon) copyIcon.classList.add('d-none');
                        if (checkIcon) checkIcon.classList.remove('d-none');
                        if (copyText) copyText.textContent = 'Copied!';

                        setTimeout(() => {
                            copyBtn.classList.remove('copied');
                            if (copyIcon) copyIcon.classList.remove('d-none');
                            if (checkIcon) checkIcon.classList.add('d-none');
                            if (copyText) copyText.textContent = 'Copy';
                        }, 2000);
                    }

                    // Also feedback on quick overlay if it was clicked
                    if (this.classList.contains('btn-quick-copy-overlay')) {
                        const span = this.querySelector('span');
                        const oldText = span ? span.textContent : 'Quick Copy';
                        this.classList.add('copied');
                        if (span) span.textContent = 'Copied!';
                        setTimeout(() => {
                            this.classList.remove('copied');
                            if (span) span.textContent = oldText;
                        }, 2000);
                    }

                    // Increment copy count indicator
                    if (card) {
                        const copyCountEl = card.querySelector('.copy-count');
                        if (copyCountEl && !copyCountEl.dataset.counted) {
                            copyCountEl.dataset.counted = 'true';
                            let count = parseInt(copyCountEl.textContent, 10) || 0;
                            copyCountEl.textContent = count + 1;
                        }
                    }

                    showPromptToast('Prompt copied to clipboard!');
                } catch (err) {
                    console.error('Clipboard copy failed:', err);
                }
            });
        });

        // Like button toggle handler
        document.querySelectorAll('.btn-like-prompt').forEach(btn => {
            if (btn.dataset.boundLike) return;
            btn.dataset.boundLike = 'true';

            btn.addEventListener('click', function (e) {
                e.preventDefault();
                e.stopPropagation();

                const isLiked = this.classList.toggle('liked');
                const countEl = this.querySelector('.like-count');
                if (countEl) {
                    let count = parseInt(countEl.textContent, 10) || 0;
                    countEl.textContent = isLiked ? count + 1 : Math.max(0, count - 1);
                }
            });
        });
    };

    // Auto-init on DOMContentLoaded (runs for inline HTML elements on the page)
    document.addEventListener('DOMContentLoaded', function () {
        if (typeof window.initDirectorySearch === 'function') window.initDirectorySearch();
        if (typeof window.initPromptLibrary === 'function') window.initPromptLibrary();
    });

    // modules-loader.js already calls initHeaderModule() and initFooterModule()
    // from its own fetch callbacks. We re-init directorySearch & promptLibrary here.
    window.addEventListener('schoolitclub:modulesLoaded', function () {
        if (typeof window.initDirectorySearch === 'function') window.initDirectorySearch();
        if (typeof window.initPromptLibrary === 'function') window.initPromptLibrary();
    });
})();

