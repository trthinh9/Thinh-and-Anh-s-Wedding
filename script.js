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
