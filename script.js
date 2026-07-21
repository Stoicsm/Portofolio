const root = document.documentElement;
const navToggle = document.querySelector(".nav-toggle");
const navLinks = document.querySelector(".nav-links");
const themeToggle = document.querySelector(".theme-toggle");
const filters = document.querySelectorAll(".filter");
const cards = document.querySelectorAll(".project-card");
const form = document.querySelector(".contact-form");
const formStatus = document.querySelector(".form-status");
const year = document.querySelector("#year");
const modal = document.querySelector("#modal");
const modalTitle = modal.querySelector(".modal-title");
const modalDesc = modal.querySelector(".modal-desc");
const modalGallery = modal.querySelector(".modal-gallery");
const modalClose = modal.querySelector(".modal-close");

const CONTACT_API = "/api/contact";

const projectData = {
  "cert-ict": {
    title: "ICT Business Development",
    desc: "ICT Business Development merupakan salah satu rangkaian acara TED (Tech Enthusiast Day) 2024 yang diselenggarakan oleh divisi IPTEK di bawah naungan Keluarga Mahasiswa Departemen Teknik Elektro dan Informatika, Sekolah Vokasi, Universitas Gadjah Mada.",
    image: { src: "assets/projects/ICT.jpg", alt: "Sertifikat ICT Business Development" }
  },
  "cert-bmc": {
    title: "Business Model Canvas",
    desc: "Pelatihan penyusunan Business Model Canvas untuk pengembangan ide bisnis. Materi meliputi value proposition, customer segments, revenue streams, dan komponen BMC lainnya.",
    image: { src: "assets/projects/BMC.png", alt: "Sertifikat Business Model Canvas" }
  },
  "cert-idsc": {
    title: "International Data Science Competition",
    desc: "Keikutsertaan dalam kompetisi data science tingkat internasional IDSC (International Data Science Competition). Kompetisi ini menguji kemampuan analisis data, pemodelan machine learning, dan penyajian insight dari dataset nyata.",
    image: { src: "assets/projects/IDSC.jpg", alt: "Sertifikat IDSC" }
  }
};

const getStoredTheme = () => {
  try {
    return localStorage.getItem("theme");
  } catch {
    return null;
  }
};

const setStoredTheme = (theme) => {
  try {
    localStorage.setItem("theme", theme);
  } catch {}
};

const applyTheme = (theme) => {
  root.classList.toggle("dark", theme === "dark");
  themeToggle.textContent = theme === "dark" ? "Mode terang" : "Mode gelap";
};

const initialTheme = getStoredTheme() || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
applyTheme(initialTheme);
year.textContent = new Date().getFullYear();

navToggle.addEventListener("click", () => {
  const isOpen = navLinks.classList.toggle("open");
  navToggle.setAttribute("aria-expanded", String(isOpen));
});

navLinks.addEventListener("click", (event) => {
  if (event.target.matches("a")) {
    navLinks.classList.remove("open");
    navToggle.setAttribute("aria-expanded", "false");
  }
});

themeToggle.addEventListener("click", () => {
  const nextTheme = root.classList.contains("dark") ? "light" : "dark";
  applyTheme(nextTheme);
  setStoredTheme(nextTheme);
});

filters.forEach((button) => {
  button.addEventListener("click", () => {
    const filter = button.dataset.filter;
    filters.forEach((item) => item.classList.toggle("active", item === button));
    cards.forEach((card) => {
      const visible = filter === "all" || card.dataset.category.split(" ").includes(filter);
      card.hidden = !visible;
    });
  });
});

const openModal = (projectKey) => {
  const data = projectData[projectKey];
  if (!data) return;
  modalTitle.textContent = data.title;
  modalDesc.textContent = data.desc;
  modalGallery.innerHTML = "";
  const el = document.createElement("img");
  el.src = data.image.src;
  el.alt = data.image.alt;
  el.loading = "lazy";
  modalGallery.appendChild(el);
  modal.hidden = false;
  document.body.style.overflow = "hidden";
  modalClose.focus();
};

const closeModal = () => {
  modal.hidden = true;
  document.body.style.overflow = "";
};

cards.forEach((card) => {
  card.addEventListener("click", () => openModal(card.dataset.project));
  card.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      openModal(card.dataset.project);
    }
  });
});

modalClose.addEventListener("click", closeModal);

modal.addEventListener("click", (e) => {
  if (e.target === modal) closeModal();
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !modal.hidden) closeModal();
});

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  formStatus.textContent = "";
  formStatus.className = "form-status";

  const data = new FormData(form);
  const name = String(data.get("name") || "").trim();
  const email = String(data.get("email") || "").trim();
  const message = String(data.get("message") || "").trim();

  if (name.length < 2 || name.length > 80) {
    formStatus.textContent = "Nama harus 2-80 karakter.";
    formStatus.classList.add("error");
    return;
  }

  if (!emailPattern.test(email) || email.length > 120) {
    formStatus.textContent = "Email tidak valid.";
    formStatus.classList.add("error");
    return;
  }

  if (message.length < 10 || message.length > 800) {
    formStatus.textContent = "Pesan harus 10-800 karakter.";
    formStatus.classList.add("error");
    return;
  }

  const submitBtn = form.querySelector("[type=submit]");
  submitBtn.disabled = true;
  formStatus.textContent = "Mengirim...";

  try {
    const res = await fetch(CONTACT_API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, message })
    });

    if (res.ok) {
      formStatus.textContent = "Pesan terkirim! Saya akan segera membalas.";
      formStatus.classList.add("success");
      form.reset();
    } else {
      const body = await res.json().catch(() => ({}));
      formStatus.textContent = body.error || "Gagal mengirim. Coba lagi nanti.";
      formStatus.classList.add("error");
    }
  } catch {
    formStatus.textContent = "Tidak dapat terhubung ke server. Coba lagi nanti.";
    formStatus.classList.add("error");
  } finally {
    submitBtn.disabled = false;
  }
});

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.1, rootMargin: "0px 0px -40px 0px" }
);

document.querySelectorAll(".reveal").forEach((el) => revealObserver.observe(el));
