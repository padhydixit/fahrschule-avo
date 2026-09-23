// ===== Layer 2: Tesla-style HUD, custom cursor, spotlight =====
// Adds on top of the existing scene animations in script.js — does not modify them.

(function () {
  const isTouch = window.matchMedia("(hover: none)").matches;
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Custom cursor (dot + lagging ring) ---------- */
  if (!isTouch) {
    const dot = document.getElementById("cursorDot");
    const ring = document.getElementById("cursorRing");
    let mouseX = window.innerWidth / 2, mouseY = window.innerHeight / 2;
    let ringX = mouseX, ringY = mouseY;

    window.addEventListener("mousemove", (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      dot.style.transform = `translate(${mouseX}px, ${mouseY}px) translate(-50%, -50%)`;

      // headlight spotlight follows the raw cursor position
      document.documentElement.style.setProperty("--mx", `${mouseX}px`);
      document.documentElement.style.setProperty("--my", `${mouseY}px`);
    });

    function animateRing() {
      ringX += (mouseX - ringX) * 0.15;
      ringY += (mouseY - ringY) * 0.15;
      ring.style.transform = `translate(${ringX}px, ${ringY}px) translate(-50%, -50%)`;
      requestAnimationFrame(animateRing);
    }
    animateRing();

    document.querySelectorAll(".cursor-hover").forEach((el) => {
      el.addEventListener("mouseenter", () => ring.classList.add("cursor-active"));
      el.addEventListener("mouseleave", () => ring.classList.remove("cursor-active"));
    });
  }

  /* ---------- Dark-scene detection for the headlight overlay ---------- */
  ScrollTrigger.batch(".scene-1, .scene-2", {
    onEnter: () => document.body.classList.add("in-dark-scene"),
    onEnterBack: () => document.body.classList.add("in-dark-scene"),
    onLeave: () => document.body.classList.remove("in-dark-scene"),
    onLeaveBack: () => document.body.classList.remove("in-dark-scene"),
  });

  /* ---------- Gear indicator: P (anxious/parked) -> N (uncertain) -> D (driving) -> P (arrived) ---------- */
  const gearMap = { 1: "P", 2: "N", 3: "N", 4: "D", 5: "D", 6: "D", 7: "P" };
  const gearEls = document.querySelectorAll(".hud-gear span");
  document.querySelectorAll(".scene").forEach((scene) => {
    const sceneNum = scene.dataset.scene;
    ScrollTrigger.create({
      trigger: scene,
      start: "top center",
      end: "bottom center",
      onToggle: (self) => {
        if (!self.isActive) return;
        const gear = gearMap[sceneNum];
        gearEls.forEach((el) => el.classList.toggle("active", el.dataset.gear === gear));
      },
    });
  });

  /* ---------- Range track + readout ---------- */
  const trackFill = document.getElementById("hudTrackFill");
  const trackMarker = document.getElementById("hudTrackMarker");
  const hudRange = document.getElementById("hudRange");
  let confidenceReady = false;
  let carTimeline;

  function getConfidenceProgress() {
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    const openingTrigger = ScrollTrigger.getAll().find(
      (trigger) => trigger.trigger?.classList?.contains("scene-1") && trigger.vars.pin
    );
    const openingEnd = openingTrigger?.end || 1;

    if (window.scrollY <= openingEnd) {
      return (window.scrollY / openingEnd) * 9;
    }

    return 9 + ((window.scrollY - openingEnd) / (maxScroll - openingEnd)) * 91;
  }

  gsap.to(
    {},
    {
      scrollTrigger: {
        trigger: "#story",
        start: "top top",
        end: "bottom bottom",
        scrub: true,
        onUpdate: (self) => {
          const pct = Math.min(100, Math.max(0, getConfidenceProgress()));
          trackFill.style.width = `${pct}%`;
          trackMarker.style.left = `${pct}%`;
          hudRange.textContent = `${Math.round(pct)}%`;
          const isReady = pct >= 9;
          if (isReady !== confidenceReady) {
            confidenceReady = isReady;
            document.body.classList.toggle("confidence-ready", isReady);
            if (isReady) {
              carTimeline?.play();
            } else {
              carTimeline?.pause(0);
            }
          }
        },
      },
    }
  );

  /* ---------- Scene 1: neon car materializes + reticle locks on, synced to grey->white grade ---------- */
  const carBody = document.getElementById("carBody");
  const carBaseline = document.getElementById("carBaseline");
  const wheelA = document.getElementById("wheelA");
  const wheelB = document.getElementById("wheelB");
  const carWrap = document.querySelector(".hud-car-wrap");
  const scanText = document.getElementById("hudScanText");

  const bodyLength = carBody.getTotalLength();
  carBody.style.strokeDasharray = bodyLength;
  carBody.style.strokeDashoffset = bodyLength;

  carTimeline = gsap.timeline({ paused: true });
  carTimeline
    .to(carBaseline, { strokeDashoffset: 0, duration: 1 }, 0)
    .to(carBody, { strokeDashoffset: 0, duration: 2.2 }, 0.3)
    .to([wheelA, wheelB], { scale: 1, duration: 0.8, ease: "back.out(2)" }, 2.3)
    .call(() => carWrap.classList.add("locked"), null, 2.8)
    .call(() => scanText.classList.add("locked"), null, 2.9);
})();
