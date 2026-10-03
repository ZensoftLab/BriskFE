import "./footer.css";

/** Shared site footer rendered by every page. */
export default function Footer({ markup }) {
  if (!markup) return null;

  return (
    <div
      className="shared-footer"
      dangerouslySetInnerHTML={{ __html: markup }}
    />
  );
}
