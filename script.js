
(function () {
  "use strict";

  var root = document.documentElement;
  var hasGSAP = typeof window.gsap !== "undefined";
  var hasST = hasGSAP && typeof window.ScrollTrigger !== "undefined";

  if (!hasGSAP) {
    root.classList.remove("js-anim");
    ready(function () {
      faqAccordion(false);
      stickyNav();
    });
    return;
  }

  if (hasST) {
    gsap.registerPlugin(ScrollTrigger);
    ScrollTrigger.config({ ignoreMobileResize: true });
  }

 
  function makeWord(inner) {
    var mask = document.createElement("span");
    mask.className = "a-word";
    var slide = document.createElement("span");
    slide.className = "a-word-in";
    slide.appendChild(inner);
    mask.appendChild(slide);
    return mask;
  }

  function splitWords(el) {
    if (!el) return [];
    if (el.getAttribute("data-split") === "done") {
      return el.querySelectorAll(".a-word-in");
    }

    var frag = document.createDocumentFragment();
    var nodes = Array.prototype.slice.call(el.childNodes);

    nodes.forEach(function (node) {
      if (node.nodeType === 3) {
        var parts = node.textContent.split(/(\s+)/);
        parts.forEach(function (part) {
          if (!part) return;
          if (/^\s+$/.test(part)) {
            frag.appendChild(document.createTextNode(" "));
            return;
          }
          frag.appendChild(makeWord(document.createTextNode(part)));
        });
      } else if (node.nodeType === 1) {
        frag.appendChild(makeWord(node));
      }
    });

    while (el.firstChild) el.removeChild(el.firstChild);
    el.appendChild(frag);
    el.setAttribute("data-split", "done");
    return el.querySelectorAll(".a-word-in");
  }


  function heroEntrance(deep) {
    var heading = document.querySelector("[data-hero-line]");
    var fadeEls = document.querySelectorAll("[data-hero-fade]");
    var stack = document.querySelector("[data-hero-stack]");
    var layers = document.querySelectorAll("[data-hero-layer]");
    var words = splitWords(heading);

    var tl = gsap.timeline({ defaults: { ease: "power4.out" } });

   
    if (deep && stack) heroFloat(stack);

    if (words.length) {
      tl.fromTo(
        words,
        { yPercent: 110 },
        { yPercent: 0, duration: 1.15, stagger: 0.075 },
        0.1
      );
    }

    if (fadeEls.length) {
      tl.fromTo(
        fadeEls,
        { opacity: 0, y: 18 },
        { opacity: 1, y: 0, duration: 0.85, stagger: 0.12 },
        "-=0.75"
      );
    }

    if (stack) {
      tl.fromTo(
        stack,
        {
          opacity: 0,
          y: deep ? 46 : 26,
          scale: deep ? 0.9 : 0.95,
          rotateY: deep ? -14 : 0,
          rotateX: deep ? 6 : 0,
        },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          rotateY: 0,
          rotateX: 0,
          duration: 1.4,
          ease: "expo.out",
        },
        deep ? "-=1.05" : "-=0.9"
      );
    }

    if (layers.length) {
    
      var rest = deep
        ? [
            { x: 12, y: 14, rotation: -3 },
            { x: 24, y: 28, rotation: -6 },
          ]
        : [
            { x: 8, y: 10, rotation: -3 },
            { x: 16, y: 20, rotation: -6 },
          ];

      Array.prototype.forEach.call(layers, function (layer, i) {
        var target = rest[i] || rest[rest.length - 1];
        tl.fromTo(
          layer,
          { opacity: 0, x: 0, y: 0, rotation: 0 },
          {
            opacity: 1,
            x: target.x,
            y: target.y,
            rotation: target.rotation,
            duration: 1.1,
            ease: "expo.out",
          },
          "-=" + (1.0 - i * 0.12)
        );
      });
    }

   
    var primary = document.querySelector(".hero .btn-primary");
    if (primary) {
      tl.call(function () {
        primary.classList.add("is-sheening");
        setTimeout(function () {
          primary.classList.remove("is-sheening");
        }, 1200);
      }, null, "-=0.35");
    }

    return tl;
  }

  function heroFloat(stack) {
    gsap.to(stack, {
      y: -12,
      duration: 3.6,
      delay: 2.8,
      ease: "sine.inOut",
      yoyo: true,
      repeat: -1,
    });
  }

  function heroTilt() {
    var stage = document.querySelector("[data-hero-visual]");
    var tilt = document.querySelector("[data-hero-tilt]");
    var layers = document.querySelectorAll("[data-hero-layer]");
    if (!stage || !tilt) return function () {};

    var bounds = null;
    var rotY = gsap.quickTo(tilt, "rotateY", { duration: 0.7, ease: "power3.out" });
    var rotX = gsap.quickTo(tilt, "rotateX", { duration: 0.7, ease: "power3.out" });
    var layerTweens = Array.prototype.map.call(layers, function (layer, i) {
      return {
        x: gsap.quickTo(layer, "x", { duration: 0.9, ease: "power3.out" }),
        y: gsap.quickTo(layer, "y", { duration: 0.9, ease: "power3.out" }),
        baseX: 12 + i * 12,
        baseY: 14 + i * 14,
        depth: 10 + i * 8,
      };
    });

    function measure() {
      bounds = stage.getBoundingClientRect();
    }

    function onMove(e) {
      if (!bounds) measure();
      var relX = (e.clientX - bounds.left) / bounds.width - 0.5;
      var relY = (e.clientY - bounds.top) / bounds.height - 0.5;
      rotY(relX * 13);
      rotX(relY * -9);
      layerTweens.forEach(function (l) {
        l.x(l.baseX + relX * l.depth);
        l.y(l.baseY + relY * l.depth * 0.6);
      });
    }

    function onLeave() {
      rotY(0);
      rotX(0);
      layerTweens.forEach(function (l) {
        l.x(l.baseX);
        l.y(l.baseY);
      });
    }

    stage.addEventListener("mouseenter", measure);
    stage.addEventListener("mousemove", onMove);
    stage.addEventListener("mouseleave", onLeave);
    window.addEventListener("resize", measure);

    // Cleanup handed back to matchMedia.
    return function () {
      stage.removeEventListener("mouseenter", measure);
      stage.removeEventListener("mousemove", onMove);
      stage.removeEventListener("mouseleave", onLeave);
      window.removeEventListener("resize", measure);
    };
  }

  function heroScroll(deep) {
    if (!hasST) return;
    var hero = document.querySelector(".hero");
    var copy = document.querySelector(".hero-copy");
    var visual = document.querySelector("[data-hero-visual]");
    var img = document.querySelector("[data-hero-img]");
    if (!hero) return;

    var tl = gsap.timeline({
      scrollTrigger: {
        trigger: hero,
        start: "top top",
        end: "bottom top",
        scrub: deep ? 0.6 : 0.4,
      },
    });

    if (copy) tl.to(copy, { y: deep ? -70 : -34, ease: "none" }, 0);
    if (visual) tl.to(visual, { y: deep ? -26 : -14, ease: "none" }, 0);
    if (img) tl.fromTo(img, { yPercent: -3, scale: 1.06 }, { yPercent: 5, scale: 1.02, ease: "none" }, 0);
  }

  function headingReveals() {
    if (!hasST) return;
    var headings = document.querySelectorAll("[data-reveal-heading]");


    Array.prototype.forEach.call(headings, function (heading) {
      gsap.fromTo(
        heading,
        { opacity: 1, y: 26, clipPath: "inset(0% 0% 100% 0%)" },
        {
          y: 0,
          clipPath: "inset(0% 0% -20% 0%)",
          duration: 1.15,
          ease: "power4.out",
          scrollTrigger: {
            trigger: heading,
            start: "top 88%",
            once: true,
            onEnter: function () {
              heading.classList.add("is-revealed");
            },
          },
        }
      );
    });
  }

  function serviceReveals(deep) {
    if (!hasST) return;
    var blocks = document.querySelectorAll(".services-block");

    Array.prototype.forEach.call(blocks, function (block) {
      var sub = block.querySelector("[data-reveal-sub]");
      var rows = block.querySelectorAll("[data-reveal-row]");

      var tl = gsap.timeline({
        scrollTrigger: {
          trigger: block,
          start: "top 85%",
          once: true,
        },
        defaults: { ease: "power3.out" },
      });

      if (sub) {
        tl.fromTo(sub, { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.7 });
      }
      if (rows.length) {
        tl.fromTo(
          rows,
          { opacity: 0, y: deep ? 20 : 14 },
          { opacity: 1, y: 0, duration: 0.65, stagger: deep ? 0.06 : 0.045 },
          "-=0.45"
        );
      }
    });
  }
  function galleryReveals(deep) {
    if (!hasST) return;
    var items = document.querySelectorAll("[data-reveal-img]");
    if (!items.length) return;

    gsap.fromTo(
      items,
      { opacity: 1, clipPath: "inset(0% 0% 100% 0%)" },
      {
        opacity: 1,
        clipPath: "inset(0% 0% 0% 0%)",
        duration: 1.1,
        ease: "power4.out",
        stagger: 0.09,
        scrollTrigger: {
          trigger: items[0].parentNode,
          start: "top 85%",
          once: true,
        },
      }
    );

    var medias = document.querySelectorAll("[data-g-media]");
    gsap.fromTo(
      medias,
      { scale: 1.28 },
      {
        scale: 1,
        duration: 1.3,
        ease: "power3.out",
        stagger: 0.09,
        scrollTrigger: {
          trigger: items[0].parentNode,
          start: "top 85%",
          once: true,
        },
      }
    );

    if (!deep) return;

    Array.prototype.forEach.call(medias, function (media, i) {
      gsap.fromTo(
        media,
        { yPercent: i % 2 === 0 ? -4 : -7 },
        {
          yPercent: i % 2 === 0 ? 5 : 8,
          ease: "none",
          scrollTrigger: {
            trigger: media.closest(".gallery-item") || media,
            start: "top bottom",
            end: "bottom top",
            scrub: 0.7,
          },
        }
      );
    });
  }

 
  function panelReveals() {
    if (!hasST) return;

    var faqList = document.querySelector(".faq-list");
    if (faqList) {
      gsap.fromTo(
        faqList.querySelectorAll("[data-reveal-row]"),
        { opacity: 0, y: 18 },
        {
          opacity: 1,
          y: 0,
          duration: 0.7,
          ease: "power3.out",
          stagger: 0.07,
          scrollTrigger: { trigger: faqList, start: "top 85%", once: true },
        }
      );
    }

    var booking = document.querySelector("[data-reveal-form]");
    if (booking) {
      gsap.fromTo(
        booking,
        { opacity: 0, y: 22 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          ease: "power3.out",
          scrollTrigger: { trigger: booking, start: "top 88%", once: true },
        }
      );
    }

    var details = document.querySelector(".visit-details");
    if (details) {
      gsap.fromTo(
        details.querySelectorAll("[data-reveal-row]"),
        { opacity: 0, y: 16 },
        {
          opacity: 1,
          y: 0,
          duration: 0.7,
          ease: "power3.out",
          stagger: 0.1,
          scrollTrigger: { trigger: details, start: "top 85%", once: true },
        }
      );
    }

    var cta = document.querySelector("[data-reveal-cta]");
    if (cta) {
      gsap.fromTo(
        cta,
        { opacity: 0, y: 20, scale: 0.94 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.8,
          ease: "back.out(1.6)",
          scrollTrigger: { trigger: cta, start: "top 90%", once: true },
          onComplete: function () {
            cta.classList.add("is-sheening");
            setTimeout(function () {
              cta.classList.remove("is-sheening");
            }, 1200);
          },
        }
      );
    }
  }

  function floatingCta() {
    var float = document.querySelector("[data-float-cta]");
    if (!float) return;
    gsap.fromTo(
      float,
      { opacity: 0, scale: 0.5, y: 12 },
      { opacity: 1, scale: 1, y: 0, duration: 0.7, delay: 1.5, ease: "back.out(2)" }
    );
  }

  function stickyNav() {
    var nav = document.querySelector("[data-nav]");
    if (!nav) return;
    var ticking = false;

    function update() {
      ticking = false;
      if (window.scrollY > 60) nav.classList.add("is-stuck");
      else nav.classList.remove("is-stuck");
    }

    window.addEventListener(
      "scroll",
      function () {
        if (ticking) return;
        ticking = true;
        window.requestAnimationFrame(update);
      },
      { passive: true }
    );
    update();
  }

  function closeFaqItem(item, animate) {
    var answer = item.querySelector(".faq-answer");
    var button = item.querySelector(".faq-question");
    item.classList.remove("is-open");
    if (button) button.setAttribute("aria-expanded", "false");
    if (!answer) return;

    if (animate && hasGSAP) {
      gsap.to(answer, {
        height: 0,
        duration: 0.42,
        ease: "power2.inOut",
        onComplete: refreshST,
      });
    } else {
      answer.style.height = "0px";
      refreshST();
    }
  }

  function openFaqItem(item, animate) {
    var answer = item.querySelector(".faq-answer");
    var button = item.querySelector(".faq-question");
    item.classList.add("is-open");
    if (button) button.setAttribute("aria-expanded", "true");
    if (!answer) return;

    if (animate && hasGSAP) {
      gsap.set(answer, { height: "auto" });
      gsap.from(answer, {
        height: 0,
        duration: 0.5,
        ease: "power2.inOut",
        onComplete: refreshST,
      });
    } else {
      answer.style.height = "auto";
      refreshST();
    }
  }

  function refreshST() {
    if (hasST) ScrollTrigger.refresh();
  }

  function faqAccordion(animate) {
    var items = document.querySelectorAll(".faq-item");
    if (!items.length) return;

    Array.prototype.forEach.call(items, function (item) {
      var button = item.querySelector(".faq-question");
      var answer = item.querySelector(".faq-answer");
      if (!button || !answer) return;

      answer.style.height = "0px";
      if (!animate || !hasGSAP) answer.style.transition = "height 0.4s ease";

      button.addEventListener("click", function () {
        var isOpen = item.classList.contains("is-open");

        Array.prototype.forEach.call(items, function (other) {
          if (other !== item && other.classList.contains("is-open")) {
            closeFaqItem(other, animate);
          }
        });

        if (isOpen) closeFaqItem(item, animate);
        else openFaqItem(item, animate);
      });
    });
  }

  function setupAnimations() {
    var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    stickyNav();
    faqAccordion(!reduced);

    if (reduced) {
  
      root.classList.remove("js-anim");
      return;
    }

    var mm = gsap.matchMedia();

    mm.add(
      {
        motion: "(prefers-reduced-motion: no-preference)",
        reduce: "(prefers-reduced-motion: reduce)",
        desktop: "(min-width: 900px)",
        mobile: "(max-width: 899px)",
        fine: "(hover: hover) and (pointer: fine)",
      },
      function (context) {
        var c = context.conditions;

        if (c.reduce) {
          root.classList.add("anim-failed"); 
          return;
        }
        root.classList.remove("anim-failed");

        var deep = c.desktop;

        heroEntrance(deep);
        heroScroll(deep);
        headingReveals();
        serviceReveals(deep);
        galleryReveals(deep);
        panelReveals();
        floatingCta();

        if (deep && c.fine) {
          var cleanupTilt = heroTilt();
          return function () {
            cleanupTilt();
          };
        }
      }
    );

    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(function () {
        refreshST();
      });
    }
    window.addEventListener("load", refreshST);
  }


  function ready(fn) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", fn, { once: true });
    } else {
      fn();
    }
  }

  ready(function () {
    try {
      setupAnimations();
    } catch (err) {
      
      root.classList.add("anim-failed");
      if (window.console && console.error) console.error("Animation setup failed:", err);
    }
  });
})();



(function () {
  "use strict";

  var WHATSAPP_NUMBER = "923337874397";
  var SALON_NAME = "Kasabella Hair Salon & SPA";

  function init() {
    var form = document.getElementById("booking-form");
    if (!form) return;

    var status = document.getElementById("booking-status");
    var notesCount = document.getElementById("bk-notes-count");
    var keys = ["name", "phone", "service", "date", "time", "notes"];
    var fields = {};

    keys.forEach(function (key) {
      var input = document.getElementById("bk-" + key);
      fields[key] = {
        input: input,
        wrap: input.closest(".field"),
        error: document.getElementById("bk-" + key + "-error"), // notes has none
      };
    });

    function pad(n) {
      return n < 10 ? "0" + n : "" + n;
    }
    function todayISO() {
      var d = new Date();
      return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
    }
    function formatDate(iso) {
      var p = iso.split("-");
      var d = new Date(+p[0], +p[1] - 1, +p[2]);
      try {
        return d.toLocaleDateString("en-GB", {
          weekday: "long",
          day: "numeric",
          month: "long",
          year: "numeric",
        });
      } catch (err) {
        return iso;
      }
    }

    fields.date.input.setAttribute("min", todayISO());

    var validators = {
      name: function (v) {
        return v.length < 2 ? "Please enter your name." : "";
      },
      phone: function (v) {
        if (!v) return "Please enter your phone number.";
        var digits = v.replace(/\D/g, "");
        if (!/^\+?[\d\s\-()]+$/.test(v) || digits.length < 10 || digits.length > 15) {
          return "Please enter a valid phone number, e.g. 0300 1234567.";
        }
        return "";
      },
      service: function (v) {
        return v ? "" : "Please choose a service.";
      },
      date: function (v) {
        if (!v) return "Please choose your preferred date.";
        if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return "Please enter a valid date.";
        if (v < todayISO()) return "Please choose today or a later date.";
        return "";
      },
      time: function (v) {
        return v ? "" : "Please choose your preferred time.";
      },
    };

    function setError(key, message) {
      var f = fields[key];
      f.wrap.classList.add("has-error");
      f.input.setAttribute("aria-invalid", "true");
      if (f.error) {
        f.error.textContent = message;
        f.error.hidden = false;
      }
    }

    function clearError(key) {
      var f = fields[key];
      f.wrap.classList.remove("has-error");
      f.input.removeAttribute("aria-invalid");
      if (f.error) {
        f.error.textContent = "";
        f.error.hidden = true;
      }
    }

    keys.forEach(function (key) {
      var clear = function () {
        clearError(key);
      };
      fields[key].input.addEventListener("input", clear);
      fields[key].input.addEventListener("change", clear);
    });

    if (notesCount) {
      var max = fields.notes.input.getAttribute("maxlength") || "600";
      var updateCount = function () {
        notesCount.textContent = fields.notes.input.value.length + " / " + max;
      };
      fields.notes.input.addEventListener("input", updateCount);
      updateCount();
    }

    function buildMessage(v) {
      var notes = v.notes || "None";
      var notesLine =
        notes.indexOf("\n") > -1
          ? "*Additional Notes:*\n" + notes
          : "*Additional Notes:* " + notes;

      return [
        "*New Appointment Request*",
        SALON_NAME,
        "",
        "*Customer Name:* " + v.name,
        "*Phone Number:* " + v.phone,
        "*Service:* " + v.service,
        "*Preferred Date:* " + formatDate(v.date),
        "*Preferred Time:* " + v.time,
        notesLine,
        "",
        "Sent from the Kasabella website booking form.",
      ].join("\n");
    }

    function buildUrl(v) {
      return (
        "https://wa.me/" + WHATSAPP_NUMBER + "?text=" + encodeURIComponent(buildMessage(v))
      );
    }

    function openWhatsApp(url) {
      var a = document.createElement("a");
      a.href = url;
      a.target = "_blank";
      a.rel = "noopener";
      a.style.display = "none";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }

    function showStatus(url) {
      status.textContent = "";
      if (!url) return;
      status.appendChild(
        document.createTextNode(
          "Your request is ready in WhatsApp. Press Send there to confirm it. Didn\u2019t open? "
        )
      );
      var link = document.createElement("a");
      link.href = url;
      link.target = "_blank";
      link.rel = "noopener";
      link.textContent = "Tap here to open it again";
      status.appendChild(link);
      status.appendChild(document.createTextNode("."));
    }

    /* ---------- submit ---------- */
    form.addEventListener("submit", function (e) {
      e.preventDefault();

      var values = {};
      var firstInvalid = null;

      Object.keys(validators).forEach(function (key) {
        var v = fields[key].input.value.trim();
        values[key] = v;
        var message = validators[key](v);
        if (message) {
          setError(key, message);
          if (!firstInvalid) firstInvalid = fields[key].input;
        } else {
          clearError(key);
        }
      });
      values.notes = fields.notes.input.value.trim();

      if (firstInvalid) {
        showStatus(null);
        firstInvalid.focus();
        return;
      }

      var url = buildUrl(values);
      openWhatsApp(url);
      showStatus(url);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
