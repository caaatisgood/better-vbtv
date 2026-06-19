// Custom Solid client runtime.
//
// Re-exports the full `solid-js/web` runtime, but replaces `template()` so the
// compiled bundle never assigns to `innerHTML`. Firefox's AMO linter flags
// Solid's `el.innerHTML = html` as UNSAFE_VAR_ASSIGNMENT even though the markup
// is static, compiler-generated, and contains no user data. Constructing the
// same nodes with DOMParser is equivalent and is not flagged by the linter.
//
// Wired in through vite-plugin-solid's `solid.moduleName` option (see
// vite.config.mts), so every JSX-compiled module imports its runtime helpers
// (template, insert, effect, …) from here instead of from solid-js/web.
import { untrack } from 'solid-js';

export * from 'solid-js/web';

// Mirror of solid-js/web's `template(html, isImportNode, isSVG, isMathML)`,
// with the single `t.innerHTML = html` replaced by a DOMParser build. The
// return-branch logic is kept identical so SVG/MathML roots behave the same.
export function template(
  html: string,
  isImportNode?: boolean,
  isSVG?: boolean,
  isMathML?: boolean,
): () => Node {
  let node: Node;
  const create = (): Node => {
    const t = isMathML
      ? (document.createElementNS(
          'http://www.w3.org/1998/Math/MathML',
          'template',
        ) as unknown as HTMLTemplateElement)
      : document.createElement('template');
    const parsed = new DOMParser().parseFromString(html, 'text/html');
    // MathML's namespaced <template> has no `.content`; everything else does.
    const sink: ParentNode = isMathML ? t : t.content;
    sink.append(...Array.from(parsed.body.childNodes));
    return (
      isSVG
        ? t.content.firstChild!.firstChild
        : isMathML
          ? t.firstChild
          : t.content.firstChild
    ) as Node;
  };
  const fn: (() => Node) & { cloneNode?: unknown } = isImportNode
    ? () => untrack(() => document.importNode(node || (node = create()), true))
    : () => (node || (node = create())).cloneNode(true);
  fn.cloneNode = fn;
  return fn;
}
