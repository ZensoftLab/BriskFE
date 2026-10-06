import { useEffect, useState } from "react";
import mainTemplate from "./templates/Main.html?raw";
import Header from "./header.jsx";
import Footer from "./footer.jsx";
import BusinessCoverageMap from "./components/BusinessCoverageMap.jsx";
import "./buisnessarea.css";

function getSharedMarkup() {
  const source = new DOMParser().parseFromString(
    mainTemplate.replace(/^\uFEFF/, ""),
    "text/html",
  );
  const body = source.body;
  const pageNode = body.querySelector("#page");
  const footer = pageNode?.querySelector('[data-elementor-type="footer"]');
  footer?.removeAttribute("id");

  const normalizeMarkup = (markup) =>
    markup
      .replace(/(["'=])images\//g, "$1/images/")
      .replaceAll('src="images/', 'src="/images/')
      .replaceAll('srcset="images/', 'srcset="/images/')
      .replaceAll('href="images/', 'href="/images/')
      .replaceAll("https://briskinternet.net/buisnessarea/", "/buisnessarea/")
      .replaceAll("https://briskinternet.net/contact-page/", "/contact/")
      .replaceAll("https://briskinternet.net/", "/");

  return {
    footer: normalizeMarkup(footer?.outerHTML || ""),
  };
}

export default function BuisnessArea() {
  const [sharedLayout, setSharedLayout] = useState({ footer: "" });

  useEffect(() => {
    document.title = "Buisness Area – Brisk Internet";
    document.body.className =
      "wp-singular page page-template-elementor_header_footer elementor-default buisness-area-route";
    document.documentElement.classList.remove("mobile-nav-active");
    setSharedLayout(getSharedMarkup());

    return () => {
      document.documentElement.classList.remove("mobile-nav-active");
      document.body.className = "";
    };
  }, []);

  return (
    <>
      <Header />
      <main className="buisness-area-page">
        <section className="business-coverage-section" aria-labelledby="business-coverage-title">
          <div className="business-coverage-container">
            <BusinessCoverageMap />
          </div>
        </section>
      </main>
      <Footer markup={sharedLayout.footer} />
    </>
  );
}
