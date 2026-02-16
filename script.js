(function() {
  'use strict';

  if (typeof window.__app === 'undefined') {
    window.__app = {};
  }

  var app = window.__app;

  function debounce(fn, delay) {
    var timer = null;
    return function() {
      var ctx = this;
      var args = arguments;
      clearTimeout(timer);
      timer = setTimeout(function() {
        fn.apply(ctx, args);
      }, delay);
    };
  }

  function throttle(fn, limit) {
    var waiting = false;
    return function() {
      if (!waiting) {
        fn.apply(this, arguments);
        waiting = true;
        setTimeout(function() {
          waiting = false;
        }, limit);
      }
    };
  }

  function initBurgerMenu() {
    if (app.burgerInitialized) return;
    app.burgerInitialized = true;

    var toggle = document.querySelector('.navbar-toggler, .c-nav__toggle');
    var navbarCollapse = document.querySelector('.navbar-collapse');
    var navLinks = document.querySelectorAll('.nav-link, .c-nav__link');

    if (!toggle) return;

    var isOpen = false;

    function openMenu() {
      isOpen = true;
      if (navbarCollapse) {
        navbarCollapse.classList.add('show');
      }
      toggle.setAttribute('aria-expanded', 'true');
      document.body.classList.add('u-no-scroll');
    }

    function closeMenu() {
      isOpen = false;
      if (navbarCollapse) {
        navbarCollapse.classList.remove('show');
      }
      toggle.setAttribute('aria-expanded', 'false');
      document.body.classList.remove('u-no-scroll');
    }

    function toggleMenu() {
      if (isOpen) {
        closeMenu();
      } else {
        openMenu();
      }
    }

    toggle.addEventListener('click', function(e) {
      e.preventDefault();
      toggleMenu();
    });

    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape' && isOpen) {
        closeMenu();
        toggle.focus();
      }
    });

    document.addEventListener('click', function(e) {
      if (isOpen && navbarCollapse && !navbarCollapse.contains(e.target) && !toggle.contains(e.target)) {
        closeMenu();
      }
    });

    for (var i = 0; i < navLinks.length; i++) {
      navLinks[i].addEventListener('click', function() {
        if (isOpen) {
          closeMenu();
        }
      });
    }

    var resizeHandler = debounce(function() {
      if (window.innerWidth >= 1024 && isOpen) {
        closeMenu();
      }
    }, 200);

    window.addEventListener('resize', resizeHandler);
  }

  function initSmoothScroll() {
    if (app.smoothScrollInitialized) return;
    app.smoothScrollInitialized = true;

    var isHome = window.location.pathname === '/' || window.location.pathname === '/index.html' || window.location.pathname.endsWith('/index.html');

    var links = document.querySelectorAll('a[href^="#"]');
    for (var i = 0; i < links.length; i++) {
      var link = links[i];
      var href = link.getAttribute('href');

      if (href === '#' || href === '#!') continue;

      link.addEventListener('click', function(e) {
        var targetHref = this.getAttribute('href');
        var hash = targetHref;

        if (hash === '#' || hash === '#!') return;

        var targetEl = document.querySelector(hash);
        if (targetEl && isHome) {
          e.preventDefault();

          var header = document.querySelector('.l-header, header');
          var offset = header ? header.offsetHeight : 80;
          var targetPos = targetEl.getBoundingClientRect().top + window.pageYOffset - offset;

          window.scrollTo({
            top: targetPos,
            behavior: 'smooth'
          });

          if (history.pushState) {
            history.pushState(null, null, hash);
          }
        }
      });
    }
  }

  function initScrollSpy() {
    if (app.scrollSpyInitialized) return;
    app.scrollSpyInitialized = true;

    var navLinks = document.querySelectorAll('.nav-link[href^="#"], .c-nav__link[href^="#"]');
    if (navLinks.length === 0) return;

    var sections = [];
    for (var i = 0; i < navLinks.length; i++) {
      var href = navLinks[i].getAttribute('href');
      if (href && href !== '#' && href !== '#!') {
        var section = document.querySelector(href);
        if (section) {
          sections.push({ link: navLinks[i], section: section });
        }
      }
    }

    if (sections.length === 0) return;

    var header = document.querySelector('.l-header, header');
    var headerHeight = header ? header.offsetHeight : 80;

    function updateActiveLink() {
      var scrollPos = window.pageYOffset + headerHeight + 100;

      for (var i = sections.length - 1; i >= 0; i--) {
        var item = sections[i];
        if (item.section.offsetTop <= scrollPos) {
          for (var j = 0; j < sections.length; j++) {
            sections[j].link.classList.remove('active');
            sections[j].link.removeAttribute('aria-current');
          }
          item.link.classList.add('active');
          item.link.setAttribute('aria-current', 'page');
          return;
        }
      }
    }

    var scrollHandler = throttle(updateActiveLink, 100);
    window.addEventListener('scroll', scrollHandler);
    updateActiveLink();
  }

  function initActiveMenu() {
    if (app.activeMenuInitialized) return;
    app.activeMenuInitialized = true;

    var currentPath = window.location.pathname;
    var navLinks = document.querySelectorAll('.nav-link, .c-nav__link');

    for (var i = 0; i < navLinks.length; i++) {
      var link = navLinks[i];
      var linkPath = link.getAttribute('href');

      if (linkPath && linkPath.indexOf('#') === -1) {
        var normalizedLinkPath = linkPath.replace(/\/$/, '');
        var normalizedCurrentPath = currentPath.replace(/\/$/, '');

        if (normalizedLinkPath === normalizedCurrentPath ||
            (normalizedCurrentPath === '' && normalizedLinkPath === '/') ||
            (normalizedCurrentPath === '/index.html' && normalizedLinkPath === '/')) {
          link.setAttribute('aria-current', 'page');
          link.classList.add('active');
        } else {
          link.removeAttribute('aria-current');
          link.classList.remove('active');
        }
      }
    }
  }

  function initFormValidation() {
    if (app.formsInitialized) return;
    app.formsInitialized = true;

    var forms = document.querySelectorAll('form.c-form, form.needs-validation');

    app.notify = function(message, type) {
      var container = document.querySelector('.toast-container');
      if (!container) {
        container = document.createElement('div');
        container.className = 'toast-container position-fixed top-0 end-0 p-3';
        container.style.zIndex = '9999';
        document.body.appendChild(container);
      }

      var toastEl = document.createElement('div');
      toastEl.className = 'toast align-items-center text-white border-0';
      toastEl.className += type === 'success' ? ' bg-success' : ' bg-danger';
      toastEl.setAttribute('role', 'alert');
      toastEl.setAttribute('aria-live', 'assertive');
      toastEl.setAttribute('aria-atomic', 'true');

      toastEl.innerHTML = '<div class="d-flex"><div class="toast-body">' + message + '</div><button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button></div>';

      container.appendChild(toastEl);

      if (typeof window.bootstrap !== 'undefined' && window.bootstrap.Toast) {
        var toast = new window.bootstrap.Toast(toastEl, { delay: 5000 });
        toast.show();
        toastEl.addEventListener('hidden.bs.toast', function() {
          toastEl.remove();
        });
      } else {
        toastEl.style.display = 'block';
        setTimeout(function() {
          toastEl.remove();
        }, 5000);
      }
    };

    function sanitizeInput(value) {
      return value.replace(/<script[^>]*>.*?<\/script>/gi, '').trim();
    }

    function validateEmail(email) {
      var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(email);
    }

    function validatePhone(phone) {
      var phoneRegex = /^[\+\-\d\s\(\)]{10,20}$/;
      return phoneRegex.test(phone);
    }

    function validateName(name) {
      var nameRegex = /^[a-zA-ZÀ-ÿ\s\-']{2,50}$/;
      return nameRegex.test(name);
    }

    function validateMessage(message) {
      return message.length >= 10;
    }

    function validateSubject(subject) {
      return subject.length >= 3;
    }

    function showError(input, message) {
      var parent = input.parentElement;
      var errorEl = parent.querySelector('.invalid-feedback, .c-form__error');
      
      input.classList.add('is-invalid', 'has-error');
      input.setAttribute('aria-invalid', 'true');

      if (!errorEl) {
        errorEl = document.createElement('div');
        errorEl.className = 'invalid-feedback c-form__error';
        errorEl.style.display = 'block';
        parent.appendChild(errorEl);
      }
      
      errorEl.textContent = message;
      errorEl.style.display = 'block';
    }

    function clearError(input) {
      var parent = input.parentElement;
      var errorEl = parent.querySelector('.invalid-feedback, .c-form__error');
      
      input.classList.remove('is-invalid', 'has-error');
      input.removeAttribute('aria-invalid');
      
      if (errorEl) {
        errorEl.textContent = '';
        errorEl.style.display = 'none';
      }
    }

    for (var i = 0; i < forms.length; i++) {
      forms[i].addEventListener('submit', function(e) {
        e.preventDefault();
        e.stopPropagation();

        var form = this;
        var isValid = true;

        var fullName = form.querySelector('#fullName, #firstName');
        if (fullName) {
          var nameValue = sanitizeInput(fullName.value);
          if (!nameValue || !validateName(nameValue)) {
            showError(fullName, 'Bitte geben Sie einen gültigen Namen ein (2-50 Zeichen).');
            isValid = false;
          } else {
            clearError(fullName);
          }
        }

        var lastName = form.querySelector('#lastName');
        if (lastName) {
          var lastNameValue = sanitizeInput(lastName.value);
          if (!lastNameValue || !validateName(lastNameValue)) {
            showError(lastName, 'Bitte geben Sie einen gültigen Nachnamen ein.');
            isValid = false;
          } else {
            clearError(lastName);
          }
        }

        var email = form.querySelector('#email');
        if (email) {
          var emailValue = sanitizeInput(email.value);
          if (!emailValue || !validateEmail(emailValue)) {
            showError(email, 'Bitte geben Sie eine gültige E-Mail-Adresse ein.');
            isValid = false;
          } else {
            clearError(email);
          }
        }

        var phone = form.querySelector('#phone');
        if (phone && phone.hasAttribute('required')) {
          var phoneValue = sanitizeInput(phone.value);
          if (!phoneValue || !validatePhone(phoneValue)) {
            showError(phone, 'Bitte geben Sie eine gültige Telefonnummer ein.');
            isValid = false;
          } else {
            clearError(phone);
          }
        } else if (phone) {
          clearError(phone);
        }

        var subject = form.querySelector('#subject');
        if (subject) {
          var subjectValue = sanitizeInput(subject.value);
          if (!subjectValue || !validateSubject(subjectValue)) {
            showError(subject, 'Betreff muss mindestens 3 Zeichen lang sein.');
            isValid = false;
          } else {
            clearError(subject);
          }
        }

        var message = form.querySelector('#message, textarea[name="message"]');
        if (message) {
          var messageValue = sanitizeInput(message.value);
          if (!messageValue || !validateMessage(messageValue)) {
            showError(message, 'Nachricht muss mindestens 10 Zeichen lang sein.');
            isValid = false;
          } else {
            clearError(message);
          }
        }

        var consent = form.querySelector('#privacyConsent, #consent');
        if (consent) {
          if (!consent.checked) {
            showError(consent, 'Bitte stimmen Sie der Datenschutzerklärung zu.');
            isValid = false;
          } else {
            clearError(consent);
          }
        }

        var position = form.querySelector('#position');
        if (position) {
          if (!position.value) {
            showError(position, 'Bitte wählen Sie eine Position aus.');
            isValid = false;
          } else {
            clearError(position);
          }
        }

        if (!isValid) {
          form.classList.add('was-validated');
          return;
        }

        var submitBtn = form.querySelector('button[type="submit"]');
        if (submitBtn) {
          submitBtn.disabled = true;
          var originalText = submitBtn.textContent;
          submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Wird gesendet...';

          setTimeout(function() {
            app.notify('Vielen Dank! Ihre Nachricht wurde erfolgreich gesendet.', 'success');
            form.reset();
            form.classList.remove('was-validated');
            
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;

            setTimeout(function() {
              window.location.href = 'thank_you.html';
            }, 1500);
          }, 1000);
        }
      });
    }
  }

  function initScrollToTop() {
    if (app.scrollToTopInitialized) return;
    app.scrollToTopInitialized = true;

    var btn = document.querySelector('.scroll-to-top, .c-scroll-top');
    if (!btn) return;

    function toggleButton() {
      if (window.pageYOffset > 300) {
        btn.classList.add('is-visible');
      } else {
        btn.classList.remove('is-visible');
      }
    }

    btn.addEventListener('click', function(e) {
      e.preventDefault();
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    });

    var scrollHandler = throttle(toggleButton, 100);
    window.addEventListener('scroll', scrollHandler);
    toggleButton();
  }

  function initAccordion() {
    if (app.accordionInitialized) return;
    app.accordionInitialized = true;

    var accordionButtons = document.querySelectorAll('.accordion-button');

    for (var i = 0; i < accordionButtons.length; i++) {
      accordionButtons[i].addEventListener('click', function() {
        var target = this.getAttribute('data-bs-target');
        if (!target) return;

        var collapse = document.querySelector(target);
        if (!collapse) return;

        var isExpanded = this.getAttribute('aria-expanded') === 'true';

        if (isExpanded) {
          this.setAttribute('aria-expanded', 'false');
          this.classList.add('collapsed');
          collapse.classList.remove('show');
        } else {
          var parent = this.closest('.accordion');
          if (parent) {
            var otherButtons = parent.querySelectorAll('.accordion-button');
            var otherCollapses = parent.querySelectorAll('.accordion-collapse');
            
            for (var j = 0; j < otherButtons.length; j++) {
              otherButtons[j].setAttribute('aria-expanded', 'false');
              otherButtons[j].classList.add('collapsed');
            }
            
            for (var k = 0; k < otherCollapses.length; k++) {
              otherCollapses[k].classList.remove('show');
            }
          }

          this.setAttribute('aria-expanded', 'true');
          this.classList.remove('collapsed');
          collapse.classList.add('show');
        }
      });
    }
  }

  function initModalWindows() {
    if (app.modalsInitialized) return;
    app.modalsInitialized = true;

    var privacyLinks = document.querySelectorAll('a[href*="privacy"], a[href*="Privacy"]');
    
    for (var i = 0; i < privacyLinks.length; i++) {
      privacyLinks[i].addEventListener('click', function(e) {
        var href = this.getAttribute('href');
        if (href && href.indexOf('privacy') > -1 && href.indexOf('#') === -1) {
          return;
        }
      });
    }
  }

  function initCountUp() {
    if (app.countUpInitialized) return;
    app.countUpInitialized = true;

    var counters = document.querySelectorAll('[data-count]');
    if (counters.length === 0) return;

    function animateCount(element) {
      var target = parseInt(element.getAttribute('data-count'), 10);
      var duration = parseInt(element.getAttribute('data-duration') || '2000', 10);
      var start = 0;
      var increment = target / (duration / 16);
      var current = start;

      function updateCount() {
        current += increment;
        if (current < target) {
          element.textContent = Math.floor(current);
          requestAnimationFrame(updateCount);
        } else {
          element.textContent = target;
        }
      }

      updateCount();
    }

    for (var i = 0; i < counters.length; i++) {
      animateCount(counters[i]);
    }
  }

  function initRippleEffect() {
    if (app.rippleInitialized) return;
    app.rippleInitialized = true;

    var buttons = document.querySelectorAll('.c-button, .btn, button');

    for (var i = 0; i < buttons.length; i++) {
      buttons[i].addEventListener('click', function(e) {
        var button = this;
        var ripple = document.createElement('span');
        var rect = button.getBoundingClientRect();
        var size = Math.max(rect.width, rect.height);
        var x = e.clientX - rect.left - size / 2;
        var y = e.clientY - rect.top - size / 2;

        ripple.style.width = ripple.style.height = size + 'px';
        ripple.style.left = x + 'px';
        ripple.style.top = y + 'px';
        ripple.classList.add('ripple-effect');

        button.appendChild(ripple);

        setTimeout(function() {
          ripple.remove();
        }, 600);
      });
    }
  }

  app.init = function() {
    if (app.initialized) return;
    app.initialized = true;

    initBurgerMenu();
    initSmoothScroll();
    initScrollSpy();
    initActiveMenu();
    initFormValidation();
    initScrollToTop();
    initAccordion();
    initModalWindows();
    initCountUp();
    initRippleEffect();
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', app.init);
  } else {
    app.init();
  }

})();