document.addEventListener("DOMContentLoaded", () => {
  initThemeToggle();
  initMotion();
  initTypewriter();
  initGalleryFilter();
});

function initThemeToggle() {
  const toggleBtn = document.getElementById("theme-toggle");
  if (!toggleBtn) return;

  toggleBtn.addEventListener("click", () => {
    const currentTheme = localStorage.getItem("theme") || "dark";
    const nextTheme = currentTheme === "dark" ? "light" : "dark";

    document.documentElement.className = nextTheme + "-theme";
    localStorage.setItem("theme", nextTheme);
  });
}

function initMotion() {
  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (prefersReduced) return;

  // Initialize Lenis for smooth scrolling
  const lenis = new Lenis({
    lerp: 0.1,
    smoothWheel: true,
    normalizeWheel: true,
    wheelMultiplier: 1
  });

  lenis.on("scroll", ScrollTrigger.update);

  gsap.ticker.add((time) => {
    lenis.raf(time * 1000);
  });

  gsap.ticker.lagSmoothing(0);

  // ScrollReveal Fade-in animations
  gsap.utils.toArray(".project-card, .service-card, .skill-pill, .gallery-item, .testimonial-card, .blog-card").forEach(elem => {
    gsap.fromTo(elem,
      { opacity: 0, y: 30 },
      {
        opacity: 1,
        y: 0,
        duration: 0.8,
        ease: "power2.out",
        scrollTrigger: {
          trigger: elem,
          start: "top 70%",
          end: "bottom 30%",
          toggleActions: "play none none none"
        }
      }
    );
  });

  // Link hijacking curtain transitions
  document.querySelectorAll("a").forEach(link => {
    const href = link.getAttribute("href");
    if (!href || href.startsWith("#") || href.startsWith("javascript") || link.target === "_blank") return;

    link.addEventListener("click", e => {
      e.preventDefault();
      const curtain = document.querySelector(".transition-curtain");
      if (!curtain) {
        window.location.href = href;
        return;
      }

      gsap.to(curtain, {
        scaleY: 1,
        duration: 0.5,
        transformOrigin: "bottom",
        ease: "power4.inOut",
        onComplete: () => {
          window.location.href = href;
        }
      });
    });
  });
}

function initTypewriter() {
  const elem = document.querySelector(".typewriter-text");
  if (!elem) return;

  const words = JSON.parse(elem.getAttribute("data-words") || "[]");
  if (words.length === 0) return;

  let wordIndex = 0;
  let txt = "";
  let isDeleting = false;

  function type() {
    const currentWord = words[wordIndex];
    if (isDeleting) {
      txt = currentWord.substring(0, txt.length - 1);
    } else {
      txt = currentWord.substring(0, txt.length + 1);
    }

    elem.textContent = txt;

    let typeSpeed = 100;
    if (isDeleting) {
      typeSpeed /= 2;
    }

    if (!isDeleting && txt === currentWord) {
      typeSpeed = 1500;
      isDeleting = true;
    } else if (isDeleting && txt === "") {
      isDeleting = false;
      wordIndex = (wordIndex + 1) % words.length;
      typeSpeed = 500;
    }

    setTimeout(type, typeSpeed);
  }

  type();
}

function initGalleryFilter() {
  const filterButtons = document.querySelectorAll(".filter-btn");
  const galleryItems = document.querySelectorAll(".gallery-item");

  filterButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      filterButtons.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");

      const filterValue = btn.getAttribute("data-filter");

      galleryItems.forEach(item => {
        if (filterValue === "all" || item.classList.contains(filterValue)) {
          item.classList.remove("hidden");
          gsap.fromTo(item, { opacity: 0, scale: 0.9 }, { opacity: 1, scale: 1, duration: 0.4 });
        } else {
          item.classList.add("hidden");
        }
      });

      setTimeout(() => {
        ScrollTrigger.refresh();
      }, 100);
    });
  });
}
