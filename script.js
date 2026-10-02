const weddingDate = new Date("2026-11-29T09:00:00");

function updateCountdown() {
  const now = new Date();
  const diff = weddingDate - now;

  if (diff <= 0) {
    document.getElementById("days").textContent = "00";
    document.getElementById("hours").textContent = "00";
    document.getElementById("minutes").textContent = "00";
    document.getElementById("seconds").textContent = "00";
    return;
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  const seconds = Math.floor((diff / 1000) % 60);

  document.getElementById("days").textContent = String(days).padStart(2, "0");
  document.getElementById("hours").textContent = String(hours).padStart(2, "0");
  document.getElementById("minutes").textContent = String(minutes).padStart(2, "0");
  document.getElementById("seconds").textContent = String(seconds).padStart(2, "0");
}

const STORAGE_KEY = "weddingGuestWishes";
const wishForm = document.getElementById("wishForm");
const wishList = document.getElementById("wishList");
const summaryCount = document.getElementById("summaryCount");
const guestNameInput = document.getElementById("guestName");
const guestWishInput = document.getElementById("guestWish");

let wishes = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");

function renderWishes() {
  if (!wishes.length) {
    wishList.innerHTML = '<div class="empty-state">Chưa có lời chúc nào. Hãy là người đầu tiên gửi lời yêu thương nhé!</div>';
    summaryCount.textContent = "0 lời chúc";
    return;
  }

  wishList.innerHTML = wishes
    .map(
      (item) => `
        <div class="wish-item">
          <strong>${item.name}</strong>
          <p>${item.message}</p>
        </div>
      `
    )
    .join("");

  summaryCount.textContent = `${wishes.length} lời chúc`;
}

wishForm.addEventListener("submit", function (event) {
  event.preventDefault();

  const name = guestNameInput.value.trim();
  const message = guestWishInput.value.trim();

  if (!name || !message) return;

  wishes.unshift({ name, message });
  localStorage.setItem(STORAGE_KEY, JSON.stringify(wishes));
  renderWishes();
  wishForm.reset();
  guestNameInput.focus();
});

document.getElementById("clearWishes").addEventListener("click", function () {
  wishes = [];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(wishes));
  renderWishes();
});

renderWishes();
updateCountdown();
setInterval(updateCountdown, 1000);
const slider = document.getElementById("sliderWrapper");
const slides = slider ? Array.from(slider.querySelectorAll(".slide")) : [];
const sliderControls = document.querySelector(".slider-controls");
const slideIndicators = document.querySelector(".slide-indicators");
const backgroundMusic = document.getElementById("backgroundMusic");
const audioToggle = document.getElementById("audioToggle");
let currentSlide = slides.findIndex((slide) => slide.classList.contains("active"));
let pointerStartX = null;
let autoplayTimer;

if (backgroundMusic && audioToggle) {
  audioToggle.addEventListener("click", async () => {
    if (backgroundMusic.paused) {
      try {
        await backgroundMusic.play();
        audioToggle.classList.remove("is-muted");
        audioToggle.setAttribute("aria-label", "Tắt nhạc nền");
        audioToggle.setAttribute("aria-pressed", "true");
        audioToggle.title = "Tắt nhạc nền";
      } catch (error) {
        console.error("Không thể phát nhạc nền:", error);
        audioToggle.title = "Không thể phát nhạc. Kiểm tra kết nối mạng rồi thử lại.";
      }
      return;
    }

    backgroundMusic.pause();
    audioToggle.classList.add("is-muted");
    audioToggle.setAttribute("aria-label", "Bật nhạc nền");
    audioToggle.setAttribute("aria-pressed", "false");
    audioToggle.title = "Bật nhạc nền";
  });
}

if (slider && slides.length > 0) {
  if (currentSlide < 0) currentSlide = 0;

  function renderSlideIndicators() {
    if (!slideIndicators) return;

    const indicatorCount = Math.min(slides.length, 5);
    const firstIndex = Math.min(
      Math.max(currentSlide - Math.floor(indicatorCount / 2), 0),
      slides.length - indicatorCount
    );

    slideIndicators.replaceChildren();
    for (let index = firstIndex; index < firstIndex + indicatorCount; index += 1) {
      const indicator = document.createElement("button");
      indicator.type = "button";
      indicator.className = "slide-indicator";
      indicator.setAttribute("aria-label", `Xem ảnh ${index + 1}`);
      indicator.setAttribute("aria-current", String(index === currentSlide));
      indicator.dataset.slideIndex = String(index);
      slideIndicators.append(indicator);
    }
  }

  function scheduleAutoplay() {
    window.clearTimeout(autoplayTimer);
    if (slides.length > 1) {
      autoplayTimer = window.setTimeout(() => showSlide(currentSlide + 1), 4000);
    }
  }

  function showSlide(index) {
    currentSlide = (index + slides.length) % slides.length;
    slides.forEach((slide, slideIndex) => {
      const isActive = slideIndex === currentSlide;
      slide.classList.toggle("active", isActive);
      slide.setAttribute("aria-hidden", String(!isActive));
    });
    renderSlideIndicators();
    scheduleAutoplay();
  }

  renderSlideIndicators();
  scheduleAutoplay();

  slideIndicators?.addEventListener("click", (event) => {
    const indicator = event.target.closest("[data-slide-index]");
    if (indicator) showSlide(Number(indicator.dataset.slideIndex));
  });

  sliderControls?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-direction]");
    if (button) showSlide(currentSlide + Number(button.dataset.direction));
  });

  slider.addEventListener("pointerdown", (event) => {
    pointerStartX = event.clientX;
  });

  slider.addEventListener("pointerup", (event) => {
    if (pointerStartX === null) return;
    const distance = event.clientX - pointerStartX;
    pointerStartX = null;
    if (Math.abs(distance) >= 50) {
      showSlide(currentSlide + (distance < 0 ? 1 : -1));
    }
  });

  slider.addEventListener("pointercancel", () => {
    pointerStartX = null;
  });

  slider.addEventListener("keydown", (event) => {
    if (event.key === "ArrowLeft") showSlide(currentSlide - 1);
    if (event.key === "ArrowRight") showSlide(currentSlide + 1);
  });
}