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
};

function SitePage({ page }) {
  const [markup, setMarkup] = useState("");
  const [stylesReady, setStylesReady] = useState(false);
  const [heroIndex, setHeroIndex] = useState(0);
  const heroImages = [
    "/reference/Main/images/Banner-1.jpg",
    "/reference/Main/images/Banner-2.jpg",
  ];

  useEffect(() => {
    let cancelled = false;
    const source = new DOMParser().parseFromString(
      templates[page],
      "text/html",
    );
    document.title = source.title;
    document.body.className = source.body.className;
    document
      .querySelectorAll("[data-demo-stylesheet], [data-demo-style]")
      .forEach((node) => node.remove());

    const stylesheetLoads = [];
    for (const stylesheet of source.querySelectorAll(
      'link[rel="stylesheet"]',
    )) {
      const filename = stylesheet.getAttribute("href")?.split("/").pop();
      if (!filename?.endsWith(".css")) continue;
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = `/reference/${page}/css/${filename}`;
      link.dataset.demoStylesheet = page;
      stylesheetLoads.push(
        new Promise((resolve) => {
          link.addEventListener("load", resolve, { once: true });
          link.addEventListener("error", resolve, { once: true });
        }),
      );
      document.head.append(link);
    }

    for (const sourceStyle of source.querySelectorAll("style")) {
      const style = document.createElement("style");
      style.dataset.demoStyle = page;
      style.textContent = sourceStyle.textContent;
      document.head.append(style);
    }

    const toggleMobileMenu = (event) => {
      const control = event.target.closest(
        ".menu-mobile-nav-button, .mobile-nav-close, .ekommart-overlay",
      );
      if (!control) return;
      event.preventDefault();
      document.documentElement.classList.toggle("mobile-nav-active");
    };
    document.addEventListener("click", toggleMobileMenu);

    const body = source.body;
    body.querySelectorAll("script, noscript").forEach((node) => node.remove());
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
              "/reference/Main/images/",
            )
            .replaceAll(
              "https://briskinternet.net/wp-content/uploads/2025/06/",
              "/reference/Main/images/",
            )
            .replace(/(^|,\s*)images\//g, `$1/reference/${page}/images/`),
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
        slider.style.height = "700px";
        slider.style.display = "block";
        slider.innerHTML = `<div class="reference-hero"><img src="${heroImages[0]}" alt="Brisk Internet broadband service" loading="eager" fetchpriority="high" decoding="async" /></div>`;
      }
    }

    Promise.all(stylesheetLoads).then(() => {
      if (cancelled) return;
      setMarkup(body.innerHTML);
      setStylesReady(true);
    });

    return () => {
      cancelled = true;
      document.removeEventListener("click", toggleMobileMenu);
      document.documentElement.classList.remove("mobile-nav-active");
      document
        .querySelectorAll(
          `[data-demo-stylesheet="${page}"], [data-demo-style="${page}"]`,
        )
        .forEach((node) => node.remove());
      document.body.className = "";
    };
  }, [page]);

  useEffect(() => {
    if (page === "Main")
      document
        .querySelector(".reference-hero img")
        ?.setAttribute("src", heroImages[heroIndex]);
  }, [page, heroIndex, markup]);

  useEffect(() => {
    if (page !== "Main") return undefined;
    const timer = window.setInterval(
      () => setHeroIndex((index) => (index + 1) % heroImages.length),
      5000,
    );
    return () => window.clearInterval(timer);
  }, [page, heroImages.length]);

  return (
    <div
      className={`demo-page demo-page-${page} ${stylesReady ? "is-styled" : "is-loading"}`}
      dangerouslySetInnerHTML={{ __html: markup }}
    />
  );
}

function App() {
  const pathname = window.location.pathname.replace(/\/+$/, "") || "/";
  const page = routes[pathname] || pathname.slice(1);
  if (templates[page]) return <SitePage page={page} />;
  return (
    <main className="not-found">
      <h1>Page not found</h1>
      <a href="/">Return home</a>
    </main>
  );
}

createRoot(document.getElementById("root")).render(<App />);
