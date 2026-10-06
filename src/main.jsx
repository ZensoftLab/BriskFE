import { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import mainTemplate from "./templates/Main.html?raw";
import aboutTemplate from "./templates/about.html?raw";
import billPayTemplate from "./templates/bill-pay.html?raw";
import contactTemplate from "./templates/contact-page.html?raw";
import offerTemplate from "./templates/offer.html?raw";
import packageTemplate from "./templates/package.html?raw";
import packageFormTemplate from "./templates/package-form.html?raw";
import privacyTemplate from "./templates/privacy-policy.html?raw";
import termsTemplate from "./templates/terms-conditions.html?raw";
import Header from "./header.jsx";
import Footer from "./footer.jsx";
import BuisnessArea from "./buisnessarea.jsx";
import "./style.css";

const templates = {
  Main: mainTemplate,
  about: aboutTemplate,
  "bill-pay": billPayTemplate,
  "contact-page": contactTemplate,
  offer: offerTemplate,
  package: packageTemplate,
  "package-form": packageFormTemplate,
  "privacy-policy": privacyTemplate,
  "terms-conditions": termsTemplate,
};

const routes = {
  "/": "Main",
  "/contact": "contact-page",
  "/package/package-form": "package-form",
  "/buisnessarea": "buisnessarea",
  "/business-area": "buisnessarea",
};

function updateActiveNavigation(root, currentPath) {
  const navItems = root.querySelectorAll(
    ".primary-navigation .menu > li, .handheld-navigation .menu > li",
  );

  navItems.forEach((item) => {
    const link = item.querySelector(":scope > a");
    if (!link) return;

    const href = link.getAttribute("href");
    let linkPath = "";
    try {
      linkPath = new URL(href, window.location.origin).pathname.replace(/\/+$/, "") || "/";
    } catch {
      return;
    }

    // Match the normalized client routes used by the app, including legacy
    // WordPress URLs that are rewritten for Contact and Business Area.
    linkPath =
      linkPath === "/contact-page"
        ? "/contact"
        : linkPath === "/package/package-form"
          ? "/package-form"
          : linkPath === "/business-area"
            ? "/buisnessarea"
            : linkPath;

    const isBusinessArea =
      currentPath === "/buisnessarea" || currentPath === "/business-area";
    const matchesBusinessArea = linkPath === "/buisnessarea";
    const isActive = isBusinessArea
      ? matchesBusinessArea
      : linkPath === currentPath;

    item.classList.remove("current-menu-item", "current_page_item");
    item.classList.toggle("active-menu-item", isActive);
    link.setAttribute("aria-current", isActive ? "page" : "false");
  });
}

function normalizeSharedMarkup(markup) {
  return markup
    .replaceAll(
      "//briskinternet.net/wp-content/uploads/2025/06/",
      "/images/",
    )
    .replaceAll(
      "https://briskinternet.net/wp-content/uploads/2025/06/",
      "/images/",
    )
    .replaceAll(
      "https://briskinternet.net/wp-content/uploads/2022/06/",
      "/images/",
    )
    .replaceAll(
      "https://briskinternet.net/wp-content/uploads/2026/01/",
      "/images/",
    )
    .replace(/(["'=])images\//g, "$1/images/")
    .replace(/(^|,\s*)images\//g, "$1/images/")
    .replaceAll("https://briskinternet.net/package/package-form/", "/package-form/")
    .replaceAll("https://briskinternet.net/contact-page/", "/contact/")
    .replaceAll("https://briskinternet.net/buisnessarea/", "/buisnessarea/")
    .replaceAll("https://briskinternet.net/", "/");
}

const homepagePackageCardIds = {
  bronze: "0baf365",
  opal: "ccc10b7",
  pearl: "60b930f",
  platinum: "f148e96",
};

function applyPackageData(body, packageData, cardIdMap = {}) {
  if (!packageData?.packages?.length) return;

  for (const packageItem of packageData.packages) {
    const card = body.querySelector(
      `[data-id="${cardIdMap[packageItem.id] || packageItem.sourceElementId}"]`,
    );
    if (!card) continue;

    const headings = Array.from(card.querySelectorAll("h2"));
    const nameHeading = headings.find((heading) =>
      heading.textContent.trim().startsWith("🔥"),
    );
    const speedHeading = headings.find((heading) =>
      heading.textContent.includes(packageItem.speed.unit),
    );
    const priceHeading = headings.find((heading) =>
      heading.textContent.includes("/mo"),
    );
    const tagline = Array.from(
      card.querySelectorAll(".elementor-heading-title.elementor-size-default"),
    ).find((node) => node.textContent.includes("Choose a package"));
    const button = card.querySelector(".elementor-button-text");
    const featureList = card.querySelector(".elementor-icon-list-items");

    if (nameHeading) nameHeading.textContent = packageItem.displayName;
    if (speedHeading) speedHeading.textContent = packageItem.speed.display;
    if (priceHeading) {
      priceHeading.textContent = packageItem.price.display;
      const vat = document.createElement("p");
      const vatText = document.createElement("span");
      vatText.style.color = "gray";
      vatText.style.fontSize = "0.5em";
      vatText.textContent = packageItem.vat;
      vat.append(vatText);
      priceHeading.append(vat);
    }
    if (tagline) tagline.textContent = packageItem.tagline;
    if (button) {
      button.textContent = packageItem.cta.label;
      button.closest("a")?.setAttribute("href", packageItem.cta.href);
    }

    if (featureList) {
      const template = featureList.querySelector("li");
      featureList.replaceChildren();
      for (const feature of packageItem.features) {
        const item = template?.cloneNode(true) || document.createElement("li");
        const text = item.querySelector(".elementor-icon-list-text");
        if (text) text.textContent = feature;
        else item.textContent = feature;
        featureList.append(item);
      }
    }
  }
}

function SitePage({ page }) {
  const [markup, setMarkup] = useState("");
  const [footerMarkup, setFooterMarkup] = useState("");
  const [stylesReady, setStylesReady] = useState(false);
  const [packageData, setPackageData] = useState(null);
  const [heroIndex, setHeroIndex] = useState(0);
  const heroImages = [
    "/images/Banner-1.jpg",
    "/images/Banner-2.jpg",
  ];

  useEffect(() => {
    if (page !== "Main" && page !== "package") {
      setPackageData(null);
      return undefined;
    }

    const controller = new AbortController();
    fetch("/json/packages.json", {
      signal: controller.signal,
      cache: "no-store",
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Package data request failed: ${response.status}`);
        }
        const contentType = response.headers.get("content-type") || "";
        if (!contentType.includes("application/json")) {
          throw new Error(
            `Package data endpoint returned ${contentType || "an unknown content type"}`,
          );
        }
        return response.json();
      })
      .then((data) => setPackageData(data))
      .catch((error) => {
        if (error.name !== "AbortError") {
          console.error("Unable to load package data", error);
        }
      });

    return () => controller.abort();
  }, [page]);

  useEffect(() => {
    let cancelled = false;
    const cleanTemplate = (templates[page] || "").replace(/^\uFEFF/, "");
    const source = new DOMParser().parseFromString(
      cleanTemplate,
      "text/html",
    );
    document.title = source.title;
    document.body.className = source.body.className;
    document
      .querySelectorAll("[data-demo-style]")
      .forEach((node) => node.remove());

    for (const sourceStyle of source.querySelectorAll("style")) {
      const style = document.createElement("style");
      style.dataset.demoStyle = page;
      style.textContent = sourceStyle.textContent;
      document.head.append(style);
    }

    const body = source.body;
    body.querySelectorAll("script, noscript").forEach((node) => node.remove());

    if (page === "Main") {
      const heroImage = body.querySelector(".reference-hero img");
      if (heroImage) {
        heroImage.loading = "eager";
        heroImage.decoding = "async";
        heroImage.fetchPriority = "high";
      }
    }

    if (page === "package") {
      applyPackageData(body, packageData);
    }
    if (page === "Main") {
      applyPackageData(
        body,
        packageData
          ? { ...packageData, packages: packageData.packages.slice(0, 4) }
          : null,
        homepagePackageCardIds,
      );
    }

    body.querySelectorAll("img").forEach((img) => {
      if (!img.hasAttribute("loading")) {
        img.loading = "lazy";
      }
    });

    for (const element of body.querySelectorAll("*")) {
      for (const attribute of [
        "src",
        "srcset",
        "data-lazyload",
        "data-thumb",
      ]) {
        const value = element.getAttribute(attribute);
        if (!value) continue;
        element.setAttribute(
          attribute,
          value
            .replaceAll(
              "//briskinternet.net/wp-content/uploads/2025/06/",
              "/images/",
            )
            .replaceAll(
              "https://briskinternet.net/wp-content/uploads/2025/06/",
              "/images/",
            )
            .replaceAll(
              "https://briskinternet.net/wp-content/uploads/2022/06/",
              "/images/",
            )
            .replaceAll(
              "https://briskinternet.net/wp-content/uploads/2026/01/",
              "/images/",
            )
            .replace(/(^|,\s*)images\//g, `$1/images/`),
        );
      }
      const href = element.getAttribute("href");
      if (href?.startsWith("https://briskinternet.net/")) {
        const local = href.replace("https://briskinternet.net", "");
        element.setAttribute(
          "href",
          local === "/package/package-form/"
            ? "/package-form/"
            : local === "/contact-page/"
              ? "/contact/"
              : local,
        );
      }
    }

    for (const credit of body.querySelectorAll("a")) {
      if (
        credit.href.includes("webase.com.bd") ||
        credit.textContent.trim() === "Webase"
      ) {
        credit.href = "https://www.zensoftlab.com/";
        credit.textContent = "Zensoft Lab";
      }
    }

    if (page === "Main") {
      const slider = body.querySelector("#rev_slider_2_1_wrapper");
      if (slider) {
        slider.style.visibility = "visible";
        slider.style.height = "auto";
        slider.style.minHeight = "0";
        slider.style.display = "block";
        slider.innerHTML = `<div class="reference-hero"><img src="${heroImages[0]}" alt="Brisk Internet broadband service" loading="eager" fetchpriority="high" decoding="async" /></div>`;
      }
    }

    const currentPath = window.location.pathname.replace(/\/+$/, "") || "/";
    updateActiveNavigation(body, currentPath);

    if (!cancelled) {
      const pageNode = body.querySelector("#page");
      const pageHeader = pageNode?.querySelector(
        '[data-elementor-type="header"]',
      );
      const pageFooter = pageNode?.querySelector(
        '[data-elementor-type="footer"]',
      );
      const mobileNav = body.querySelector(".ekommart-mobile-nav");
      const overlay = body.querySelector(".ekommart-overlay");

      // Main.html is the single source of truth for the shared layout. This
      // keeps the header/footer (including the Business Area link) identical
      // across every legacy page template.
      const sharedSource = new DOMParser().parseFromString(
        mainTemplate.replace(/^\uFEFF/, ""),
        "text/html",
      );
      const sharedPage = sharedSource.querySelector("#page");
      const sharedFooter = sharedPage?.querySelector(
        '[data-elementor-type="footer"]',
      );

      setFooterMarkup(normalizeSharedMarkup(sharedFooter?.outerHTML || ""));
      pageHeader?.remove();
      pageFooter?.remove();
      mobileNav?.remove();
      overlay?.remove();

      setMarkup(pageNode?.outerHTML || body.innerHTML);
      setStylesReady(true);
    }

    return () => {
      cancelled = true;
      document.documentElement.classList.remove("mobile-nav-active");
      document
        .querySelectorAll(`[data-demo-style="${page}"]`)
        .forEach((node) => node.remove());
      document.body.className = "";
      setFooterMarkup("");
    };
  }, [page, packageData]);


  useEffect(() => {
    if (page === "Main")
      document
        .querySelector(".reference-hero img")
        ?.setAttribute("src", heroImages[heroIndex]);
  }, [page, heroIndex, markup]);

  useEffect(() => {
    if (page !== "Main" || !markup) return undefined;
    const carousel = document.querySelector(
      ".demo-page-Main .ekommart-carousel",
    );
    if (!carousel) return undefined;

    const originalItems = Array.from(
      carousel.querySelectorAll(".elementor-brand-item"),
    );
    if (!originalItems.length) return undefined;

    const totalOriginal = originalItems.length;

    const slickList = document.createElement("div");
    slickList.className = "slick-list draggable";

    const slickTrack = document.createElement("div");
    slickTrack.className = "slick-track";

    const cloneBefore = originalItems.map((item, idx) => {
      const clone = item.cloneNode(true);
      clone.classList.add("slick-slide", "slick-cloned");
      clone.dataset.slickIndex = String(-totalOriginal + idx);
      return clone;
    });

    const realSlides = originalItems.map((item, idx) => {
      item.classList.add("slick-slide");
      item.dataset.slickIndex = String(idx);
      return item;
    });

    const cloneAfter = originalItems.map((item, idx) => {
      const clone = item.cloneNode(true);
      clone.classList.add("slick-slide", "slick-cloned");
      clone.dataset.slickIndex = String(totalOriginal + idx);
      return clone;
    });

    carousel.innerHTML = "";
    slickTrack.append(...cloneBefore, ...realSlides, ...cloneAfter);
    slickList.append(slickTrack);
    carousel.append(slickList);

    const dotsUl = document.createElement("ul");
    dotsUl.className = "slick-dots";
    dotsUl.setAttribute("role", "tablist");

    const dotItems = [];
    for (let i = 0; i < totalOriginal; i += 1) {
      const li = document.createElement("li");
      li.setAttribute("role", "presentation");
      if (i === 0) li.classList.add("slick-active");

      const btn = document.createElement("button");
      btn.type = "button";
      btn.setAttribute("role", "tab");
      btn.textContent = String(i + 1);

      li.append(btn);
      dotsUl.append(li);
      dotItems.push(li);
    }
    carousel.append(dotsUl);

    carousel.classList.add("slick-initialized", "slick-slider", "slick-dotted");

    let virtualIndex = totalOriginal;
    let isTransitioning = false;
    let autoplayTimer = null;
    let isDragging = false;
    let startX = 0;
    let currentTranslateX = 0;
    let dragOffset = 0;
    let hasDragged = false;

    const allSlides = Array.from(slickTrack.children);

    const getVisibleCount = () => {
      const width = window.innerWidth;
      if (width <= 768) return 2;
      if (width <= 1024) return 3;
      return 5;
    };

    const getSlideWidth = () => {
      const listWidth =
        slickList.getBoundingClientRect().width ||
        carousel.getBoundingClientRect().width ||
        1200;
      return listWidth / getVisibleCount();
    };

    const updateDimensions = () => {
      const slideWidth = getSlideWidth();
      allSlides.forEach((slide) => {
        slide.style.width = `${slideWidth}px`;
      });
      slickTrack.style.width = `${slideWidth * allSlides.length}px`;
    };

    const setPosition = (vIndex, transition = true) => {
      const slideWidth = getSlideWidth();
      const tx = -vIndex * slideWidth;
      currentTranslateX = tx;

      if (transition) {
        slickTrack.style.transition =
          "transform 450ms cubic-bezier(0.25, 1, 0.5, 1)";
      } else {
        slickTrack.style.transition = "none";
      }
      slickTrack.style.transform = `translate3d(${tx}px, 0px, 0px)`;

      const activeDot =
        (((vIndex - totalOriginal) % totalOriginal) + totalOriginal) %
        totalOriginal;
      dotItems.forEach((dot, idx) => {
        dot.classList.toggle("slick-active", idx === activeDot);
      });
    };

    updateDimensions();
    setPosition(virtualIndex, false);

    const nextSlide = () => {
      if (isTransitioning) return;
      isTransitioning = true;
      virtualIndex += 1;
      setPosition(virtualIndex, true);
    };

    const prevSlide = () => {
      if (isTransitioning) return;
      isTransitioning = true;
      virtualIndex -= 1;
      setPosition(virtualIndex, true);
    };

    const goToSlide = (targetIndex) => {
      if (isTransitioning) return;
      isTransitioning = true;
      virtualIndex =
        totalOriginal +
        (((targetIndex % totalOriginal) + totalOriginal) % totalOriginal);
      setPosition(virtualIndex, true);
    };

    const handleTransitionEnd = (e) => {
      if (e.target !== slickTrack) return;
      isTransitioning = false;
      if (virtualIndex >= totalOriginal * 2) {
        virtualIndex = totalOriginal + (virtualIndex % totalOriginal);
        setPosition(virtualIndex, false);
      } else if (virtualIndex < totalOriginal) {
        virtualIndex = totalOriginal * 2 - (totalOriginal - virtualIndex);
        setPosition(virtualIndex, false);
      }
    };
    slickTrack.addEventListener("transitionend", handleTransitionEnd);

    dotItems.forEach((dot, idx) => {
      dot.addEventListener("click", () => {
        stopAutoplay();
        goToSlide(idx);
        startAutoplay();
      });
    });

    const startAutoplay = () => {
      stopAutoplay();
      autoplayTimer = window.setInterval(() => {
        nextSlide();
      }, 3000);
    };

    const stopAutoplay = () => {
      if (autoplayTimer) {
        window.clearInterval(autoplayTimer);
        autoplayTimer = null;
      }
    };

    carousel.addEventListener("mouseenter", stopAutoplay);
    carousel.addEventListener("mouseleave", startAutoplay);

    const onPointerDown = (e) => {
      if (isTransitioning) return;
      isDragging = true;
      hasDragged = false;
      startX = e.clientX ?? e.touches?.[0]?.clientX ?? 0;
      dragOffset = 0;
      stopAutoplay();
      slickTrack.style.transition = "none";
    };

    const onPointerMove = (e) => {
      if (!isDragging) return;
      const clientX = e.clientX ?? e.touches?.[0]?.clientX ?? 0;
      dragOffset = clientX - startX;
      if (Math.abs(dragOffset) > 5) {
        hasDragged = true;
      }
      slickTrack.style.transform = `translate3d(${currentTranslateX + dragOffset}px, 0px, 0px)`;
    };

    const onPointerUp = () => {
      if (!isDragging) return;
      isDragging = false;
      const threshold = 40;
      if (dragOffset < -threshold) {
        nextSlide();
      } else if (dragOffset > threshold) {
        prevSlide();
      } else {
        setPosition(virtualIndex, true);
      }
      startAutoplay();
    };

    const onCarouselClick = (e) => {
      if (hasDragged) {
        e.preventDefault();
        e.stopPropagation();
        hasDragged = false;
      }
    };

    carousel.addEventListener("click", onCarouselClick, true);
    slickList.addEventListener("mousedown", onPointerDown);
    window.addEventListener("mousemove", onPointerMove);
    window.addEventListener("mouseup", onPointerUp);

    slickList.addEventListener("touchstart", onPointerDown, { passive: true });
    slickList.addEventListener("touchmove", onPointerMove, { passive: true });
    slickList.addEventListener("touchend", onPointerUp);

    const onResize = () => {
      updateDimensions();
      setPosition(virtualIndex, false);
    };
    window.addEventListener("resize", onResize);

    startAutoplay();

    return () => {
      stopAutoplay();
      slickTrack.removeEventListener("transitionend", handleTransitionEnd);
      carousel.removeEventListener("mouseenter", stopAutoplay);
      carousel.removeEventListener("mouseleave", startAutoplay);
      carousel.removeEventListener("click", onCarouselClick, true);
      slickList.removeEventListener("mousedown", onPointerDown);
      window.removeEventListener("mousemove", onPointerMove);
      window.removeEventListener("mouseup", onPointerUp);
      slickList.removeEventListener("touchstart", onPointerDown);
      slickList.removeEventListener("touchmove", onPointerMove);
      slickList.removeEventListener("touchend", onPointerUp);
      window.removeEventListener("resize", onResize);
    };
  }, [page, markup]);

  useEffect(() => {
    if (page !== "Main") return undefined;
    const timer = window.setInterval(
      () => setHeroIndex((index) => (index + 1) % heroImages.length),
      5000,
    );
    return () => window.clearInterval(timer);
  }, [page, heroImages.length]);

  return (
    <>
      <Header />
      <div
        className={`demo-page demo-page-${page} ${stylesReady ? "is-styled" : "is-loading"}`}
        dangerouslySetInnerHTML={{ __html: markup }}
      />
      <Footer markup={footerMarkup} />
    </>
  );
}

function App() {
  const pathname = window.location.pathname.replace(/\/+$/, "") || "/";
  const page = routes[pathname] || pathname.slice(1);
  if (page === "buisnessarea") return <BuisnessArea />;
  if (templates[page]) return <SitePage page={page} />;
  return (
    <main className="not-found">
      <h1>Page not found</h1>
      <a href="/">Return home</a>
    </main>
  );
}

createRoot(document.getElementById("root")).render(<App />);
