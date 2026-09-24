gsap.registerPlugin(ScrollTrigger);

const progressBar = document.getElementById("progressBar");
const motionToggle = document.getElementById("motionToggle");
let reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

motionToggle.addEventListener("click", () => {
  reducedMotion = !reducedMotion;
  motionToggle.setAttribute("aria-pressed", String(reducedMotion));
  document.body.classList.toggle("force-reduced-motion", reducedMotion);
});

// Overall scroll progress bar. This stays independent of ScrollTrigger because
// pinned scenes change that plugin's calculated scroll distance during refreshes.
function updateProgressBar() {
  const scrollableDistance = document.documentElement.scrollHeight - window.innerHeight;
  const progress = scrollableDistance > 0 ? (window.scrollY / scrollableDistance) * 100 : 0;
  progressBar.style.width = `${Math.min(100, Math.max(0, progress))}%`;
}

window.addEventListener("scroll", updateProgressBar, { passive: true });
window.addEventListener("resize", updateProgressBar);
updateProgressBar();

const appointmentDate = document.getElementById("wunschdatum");
appointmentDate?.addEventListener("click", () => appointmentDate.showPicker?.());

// SCENE 1: keep the opening focused before moving into the next scene.
ScrollTrigger.create({
  trigger: ".scene-1",
  start: "top top",
  end: "+=55%",
  pin: true,
  pinSpacing: true,
});

// SCENE 2: questions appear one by one as uncertainty builds.
const questionShards = gsap.utils.toArray(".shard");
const questionTimeline = gsap.timeline({
  scrollTrigger: {
    trigger: ".scene-2",
    start: "top top",
    end: "+=70%",
    pin: true,
    pinSpacing: true,
    scrub: 0.15,
  },
});

questionShards.forEach((shard, i) => {
  const direction = i % 2 === 0 ? 1 : -1;
  const impactAt = i * 0.55;
  gsap.set(shard, {
    autoAlpha: 0,
    scale: 2.2,
    y: direction * 90,
    rotation: direction * 11,
    skewX: direction * 9,
    filter: "blur(9px)",
  });
  questionTimeline
    .to(shard, { autoAlpha: 1, duration: 0.06, ease: "none" }, impactAt)
    .to(
      shard,
      {
        scale: 0.9,
        y: 0,
        rotation: 0,
        skewX: 0,
        filter: "blur(0px)",
        duration: 0.34,
        ease: "power4.in",
      },
      impactAt
    )
    .to(shard, { scale: 1, duration: 0.16, ease: "back.out(4)" }, impactAt + 0.34);
});

// SCENE 3: draw route path as user scrolls, activate steps sequentially
gsap.to("#routePath", {
  strokeDashoffset: 0,
  ease: "none",
  scrollTrigger: {
    trigger: ".scene-3",
    start: "top center",
    end: "bottom center",
    scrub: true,
  },
});
document.querySelectorAll(".route-step").forEach((step, i) => {
  ScrollTrigger.create({
    trigger: ".scene-3",
    start: `top+=${i * 100} center`,
    onEnter: () => step.classList.add("active"),
    onLeaveBack: () => step.classList.remove("active"),
  });
});

// SCENE 4: move gently into Hamburg while each licence choice resolves in sequence.
gsap.to(".road-parallax", {
  scale: 1.09,
  xPercent: -1.5,
  ease: "none",
  scrollTrigger: {
    trigger: ".scene-4",
    start: "top bottom",
    end: "bottom top",
    scrub: true,
  },
});

const licenceCards = gsap.utils.toArray(".scene-4 .card");
const licenceTimeline = gsap.timeline({
  scrollTrigger: {
    trigger: ".scene-4",
    start: () => window.innerWidth <= 640 ? "top 35%" : "top 65%",
    end: () => window.innerWidth <= 640 ? "top -20%" : "top 15%",
    scrub: true,
    invalidateOnRefresh: true,
  },
});

licenceCards.forEach((card, i) => {
  const border = document.createElement("span");
  border.className = "card-border-draw";
  border.setAttribute("aria-hidden", "true");
  card.appendChild(border);

  licenceTimeline.to(
    border,
    {
      width: "calc(100% + 2px)",
      opacity: 1,
      duration: 0.7,
      ease: "power2.out",
    },
    i * 0.85
  ).to(
    card,
    {
      backgroundColor: () => window.innerWidth <= 640 ? "rgba(7,11,15,0.52)" : "rgba(10,14,18,0.68)",
      boxShadow: "0 0 0 1px rgba(214,255,63,0.3), 0 16px 38px rgba(0,0,0,0.42), inset 0 0 24px rgba(214,255,63,0.08)",
      y: -5,
      duration: 0.15,
      ease: "power2.out",
    },
    i * 0.85 + 0.7
  );
});

// SCENE 5: horizontal fleet reveal — pinned for the exact horizontal distance so
// the gallery is fully used instead of racing past (desktop only; mobile stacks vertically via CSS).
const fleetTrack = document.getElementById("fleetTrack");
const fleetCards = gsap.utils.toArray(".fleet-card");
const fleetDots = gsap.utils.toArray(".fleet-dot");
fleetCards[0]?.classList.add("is-active");

ScrollTrigger.matchMedia({
  "(min-width: 641px)": function () {
    const getScrollDistance = () => fleetTrack.scrollWidth - window.innerWidth + 200;

    ScrollTrigger.create({
      trigger: ".scene-5",
      start: "top top",
      end: () => `+=${getScrollDistance()}`,
      pin: true,
      pinSpacing: true,
      invalidateOnRefresh: true,
    });

    gsap.to(fleetTrack, {
      x: () => -getScrollDistance(),
      ease: "none",
      scrollTrigger: {
        trigger: ".scene-5",
        start: "top top",
        end: () => `+=${getScrollDistance()}`,
        scrub: true,
        invalidateOnRefresh: true,
        onUpdate: (self) => {
          const activeIndex = Math.min(
            fleetCards.length - 1,
            Math.floor(self.progress * fleetCards.length)
          );
          fleetCards.forEach((card, i) => card.classList.toggle("is-active", i === activeIndex));
          fleetDots.forEach((dot, i) => dot.classList.toggle("active", i === activeIndex));
        },
      },
    });

    document.querySelectorAll(".bubble").forEach((bubble, i) => {
      ScrollTrigger.create({
        trigger: ".scene-5",
        start: () => `top+=${(30 + i * 20) * getScrollDistance() / 100} top`,
        onEnter: () => bubble.classList.add("in-view"),
        onLeaveBack: () => bubble.classList.remove("in-view"),
      });
    });
  },
  "(max-width: 640px)": function () {
    const getMobileScrollDistance = () => fleetTrack.scrollWidth - fleetTrack.clientWidth;

    gsap.to(fleetTrack, {
      scrollLeft: () => getMobileScrollDistance(),
      ease: "none",
      scrollTrigger: {
        trigger: ".scene-5",
        start: "top top",
        end: () => `+=${getMobileScrollDistance()}`,
        pin: true,
        pinSpacing: true,
        scrub: true,
        invalidateOnRefresh: true,
        onUpdate: (self) => {
          const activeIndex = Math.min(
            fleetCards.length - 1,
            Math.floor(self.progress * fleetCards.length)
          );
          fleetCards.forEach((card, i) => card.classList.toggle("is-active", i === activeIndex));
        },
      },
    });
  },
});

// SCENE 6: count-up stats on arrival
document.querySelectorAll(".count").forEach((counter) => {
  const target = parseFloat(counter.dataset.target);
  ScrollTrigger.create({
    trigger: counter,
    start: "top 80%",
    onEnter: () => {
      gsap.fromTo(
        counter,
        { innerText: 0 },
        {
          innerText: target,
          duration: 1.5,
          snap: { innerText: target < 10 ? 0.1 : 1 },
          onUpdate: function () {
            counter.innerText =
              target < 10 ? Number(counter.innerText).toFixed(1) : Math.floor(counter.innerText);
          },
        }
      );
    },
    once: true,
  });
});

// CONTACT FORM: builds a prefilled WhatsApp message from the entered fields,
// mirroring the real site's "Angaben per WhatsApp übermitteln" flow — no backend needed.
const bookingForm = document.getElementById("bookingForm");
const formHint = document.getElementById("formHint");
if (bookingForm) {
  bookingForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const data = new FormData(bookingForm);
    const vorname = data.get("vorname") || "";
    const nachname = data.get("nachname") || "";
    const telefon = data.get("telefon") || "";
    const email = data.get("email") || "";
    const anliegen = data.get("anliegen") || "";
    const datum = data.get("datum") || "";
    const uhrzeit = data.get("uhrzeit") || "";
    const nachricht = data.get("nachricht") || "";

    const lines = [
      "Terminanfrage über die Website:",
      `Name: ${vorname} ${nachname}`,
      `Telefon: ${telefon}`,
      `E-Mail: ${email}`,
      anliegen && `Anliegen: ${anliegen}`,
      datum && `Wunschdatum: ${datum}`,
      uhrzeit && `Uhrzeit: ${uhrzeit}`,
      nachricht && `Nachricht: ${nachricht}`,
    ].filter(Boolean);

    const text = encodeURIComponent(lines.join("\n"));
    window.open(`https://wa.me/4917623794488?text=${text}`, "_blank", "noopener");
    formHint.textContent = "Deine Anfrage wurde in WhatsApp vorbereitet — bitte dort absenden.";
  });
}
