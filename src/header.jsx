import "./header.css";

/**
 * Shared site header.
 *
 * The legacy pages provide the rendered header markup to this component after
 * their page URLs and asset paths have been normalized by SitePage.
 */
export default function Header({ markup }) {
  if (!markup) return null;

  return (
    <div
      className="shared-header"
      dangerouslySetInnerHTML={{ __html: markup }}
    />
  );
}
