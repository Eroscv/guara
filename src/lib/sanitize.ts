import DOMPurify from "dompurify";

// Allowed iframe src prefixes (LinkedIn embed only for now)
const ALLOWED_IFRAME_PREFIXES = [
  "https://www.linkedin.com/embed/",
];

let hookInstalled = false;
function ensureHook() {
  if (hookInstalled || typeof window === "undefined") return;
  DOMPurify.addHook("uponSanitizeElement", (node, data) => {
    if (data.tagName === "iframe") {
      const src = (node as Element).getAttribute("src") || "";
      const ok = ALLOWED_IFRAME_PREFIXES.some((p) => src.startsWith(p));
      if (!ok) {
        (node as Element).parentNode?.removeChild(node as Element);
      }
    }
  });
  hookInstalled = true;
}

export function sanitizeHtml(html: string): string {
  ensureHook();
  return DOMPurify.sanitize(html, {
    ADD_TAGS: ["iframe"],
    ADD_ATTR: [
      "allow",
      "allowfullscreen",
      "frameborder",
      "src",
      "width",
      "height",
      "title",
      "loading",
      "referrerpolicy",
    ],
  });
}
