/*
  JAVASCRIPT CỦA THIỆP CƯỚI
  Các phần dưới đây điều khiển đếm ngược, lời chúc, nút nhạc và slideshow.
  Khi chỉnh HTML, giữ nguyên các id được truy vấn ở đây hoặc cập nhật selector tương ứng.
*/

// ĐỔI NGÀY CƯỚI: dùng định dạng YYYY-MM-DDTHH:mm theo giờ địa phương của thiết bị.
// Đồng bộ ngày này với ngày được ghi trong index.html và các mốc lịch trình.
const weddingDate = new Date("2026-11-29T09:00:00");

// Tính thời gian còn lại và cập nhật bốn ô có id days, hours, minutes, seconds trong index.html.
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

// LỜI CHÚC: đồng bộ tập trung qua Google Apps Script; localStorage chỉ dùng làm bộ nhớ dự phòng.
const STORAGE_KEY = "weddingGuestWishes";
const WISH_API_URL = "https://script.google.com/macros/s/AKfycbx-2cxdW13wD2l1ihONbb-HehNT7OAbq-DFeCg4BbuBTonjlxbj4lgYYxwtSshSXMPR/exec";
const wishForm = document.getElementById("wishForm");
const wishList = document.getElementById("wishList");
const summaryCount = document.getElementById("summaryCount");
const guestNameInput = document.getElementById("guestName");
const guestWishInput = document.getElementById("guestWish");

let wishes = [];
try {
  wishes = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  if (!Array.isArray(wishes)) wishes = [];
} catch (error) {
  wishes = [];
}

function saveWishCache() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(wishes));
  } catch (error) {
    console.warn("Không thể lưu bộ nhớ dự phòng trên trình duyệt", error);
  }
}

function renderWishes() {
  if (!wishes.length) {
    wishList.replaceChildren();
    const empty = document.createElement("div");
    empty.className = "empty-state";
    empty.textContent = "Chưa có lời chúc nào. Hãy là người đầu tiên gửi lời yêu thương nhé!";
    wishList.appendChild(empty);
    summaryCount.textContent = "0 lời chúc";
    return;
  }

  wishList.replaceChildren();
  wishes.forEach((item) => {
    const wishItem = document.createElement("div");
    wishItem.className = "wish-item";
    const name = document.createElement("strong");
    name.textContent = item.name || "";
    const message = document.createElement("p");
    message.textContent = item.message || "";
    wishItem.append(name, message);
    wishList.appendChild(wishItem);
  });

  summaryCount.textContent = `${wishes.length} lời chúc`;
}

function loadWishes() {
  return new Promise((resolve) => {
    const callbackName = `wishesCallback_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const script = document.createElement("script");

    window[callbackName] = function (data) {
      if (Array.isArray(data)) {
        wishes = data.map((item) => ({
          name: String(item.name || ""),
          message: String(item.message || "")
        })).filter((item) => item.name && item.message);
        saveWishCache();
      }
      renderWishes();
      delete window[callbackName];
      script.remove();
      resolve();
    };

    script.onerror = function () {
      console.warn("Không thể tải lời chúc từ Google Sheets");
      delete window[callbackName];
      script.remove();
      renderWishes();
      resolve();
    };

    script.src = `${WISH_API_URL}?callback=${callbackName}&cache=${Date.now()}`;
    document.body.appendChild(script);
  });
}

wishForm.addEventListener("submit", async function (event) {
  event.preventDefault();

  const name = guestNameInput.value.trim();
  const message = guestWishInput.value.trim();
  if (!name || !message) return;

  const submitButton = wishForm.querySelector('button[type="submit"]');
  submitButton.disabled = true;
  submitButton.textContent = "Đang gửi...";

  try {
    await fetch(WISH_API_URL, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ name, message })
    });
    wishes.unshift({ name, message });
    saveWishCache();
    renderWishes();

    wishForm.reset();
    guestNameInput.focus();
    setTimeout(loadWishes, 1500);
  } catch (error) {
    console.error("Không thể gửi lời chúc lên Google Sheets", error);
    alert("Không thể gửi lời chúc. Vui lòng thử lại hoặc kiểm tra quyền truy cập của Apps Script.");
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = "Gửi lời chúc";
  }
});

// Làm mới danh sách từ Google Sheets; không xóa dữ liệu chung trên hệ thống.
document.getElementById("clearWishes").addEventListener("click", async function () {
  await loadWishes();
});

// Khôi phục lời chúc đã lưu, đồng bộ Google Sheets và bắt đầu cập nhật đồng hồ mỗi giây.
renderWishes();
loadWishes();
updateCountdown();
setInterval(updateCountdown, 1000);

// SLIDESHOW:
// Mỗi phần tử .slide trong #sliderWrapper là một ảnh. Thêm/xóa .slide trong index.html,
// dấu chấm sẽ tự cập nhật; tối đa 5 dấu chấm được hiển thị cùng lúc.
const slider = document.getElementById("sliderWrapper");
const slides = slider ? Array.from(slider.querySelectorAll(".slide")) : [];
const sliderControls = document.querySelector(".slider-controls");
const slideIndicators = document.querySelector(".slide-indicators");
const backgroundMusic = document.getElementById("backgroundMusic");
const audioToggle = document.getElementById("audioToggle");
let currentSlide = slides.findIndex((slide) => slide.classList.contains("active"));
let pointerStartX = null;
let autoplayTimer;

// NHẠC NỀN: trạng thái chỉ đổi sau khi thao tác phát/dừng thành công.
// Đổi tệp nhạc bằng thuộc tính src của #backgroundMusic trong index.html.
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

  // Tạo nút chọn ảnh từ danh sách slide; nếu ảnh nhiều hơn 5 thì hiển thị nhóm gần ảnh hiện tại.
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

  // Tự chuyển ảnh sau 4 giây. Gọi lại sau mỗi lần đổi ảnh để thời gian bắt đầu lại từ đầu.
  // Đổi số 4000 (mili giây) nếu muốn điều chỉnh tốc độ; ví dụ 6000 tương đương 6 giây.
  function scheduleAutoplay() {
    window.clearTimeout(autoplayTimer);
    if (slides.length > 1) {
      autoplayTimer = window.setTimeout(() => showSlide(currentSlide + 1), 4000);
    }
  }

  // Hiển thị ảnh theo chỉ số, cập nhật trạng thái trợ năng và dấu chấm, sau đó đặt lịch ảnh kế tiếp.
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

  // Cho phép bấm vào dấu chấm để mở trực tiếp ảnh tương ứng.
  slideIndicators?.addEventListener("click", (event) => {
    const indicator = event.target.closest("[data-slide-index]");
    if (indicator) showSlide(Number(indicator.dataset.slideIndex));
  });

  // Nút mũi tên máy tính: data-direction="-1" là ảnh trước, "1" là ảnh kế tiếp.
  sliderControls?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-direction]");
    if (button) showSlide(currentSlide + Number(button.dataset.direction));
  });

  // Lưu vị trí bắt đầu để nhận biết thao tác vuốt ngang trên màn hình cảm ứng/chuột.
  slider.addEventListener("pointerdown", (event) => {
    pointerStartX = event.clientX;
  });

  slider.addEventListener("pointerup", (event) => {
    if (pointerStartX === null) return;
    const distance = event.clientX - pointerStartX;
    pointerStartX = null;
    // Ngưỡng 50px giúp tránh đổi ảnh khi khách chỉ chạm nhẹ; trái/phải chọn ảnh tương ứng.
    if (Math.abs(distance) >= 50) {
      showSlide(currentSlide + (distance < 0 ? 1 : -1));
    }
  });

  // Hủy trạng thái vuốt nếu trình duyệt ngắt pointer giữa chừng.
  slider.addEventListener("pointercancel", () => {
    pointerStartX = null;
  });

  // Cho phép dùng phím mũi tên khi khung slideshow đang được focus bằng bàn phím.
  slider.addEventListener("keydown", (event) => {
    if (event.key === "ArrowLeft") showSlide(currentSlide - 1);
    if (event.key === "ArrowRight") showSlide(currentSlide + 1);
  });
}