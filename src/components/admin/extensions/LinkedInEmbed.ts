import { Node, mergeAttributes } from "@tiptap/core";

export interface LinkedInEmbedOptions {
  HTMLAttributes: Record<string, any>;
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    linkedInEmbed: {
      setLinkedInEmbed: (src: string) => ReturnType;
    };
  }
}

export const LinkedInEmbed = Node.create<LinkedInEmbedOptions>({
  name: "linkedInEmbed",
  group: "block",
  atom: true,
  draggable: true,
  selectable: true,

  addOptions() {
    return { HTMLAttributes: {} };
  },

  addAttributes() {
    return {
      src: { default: null },
      height: { default: 542 },
      width: { default: 504 },
    };
  },

  parseHTML() {
    return [
      {
        tag: "div.linkedin-embed[data-src]",
        getAttrs: (el) => ({
          src: (el as HTMLElement).getAttribute("data-src"),
          height: Number((el as HTMLElement).getAttribute("data-height")) || 542,
          width: Number((el as HTMLElement).getAttribute("data-width")) || 504,
        }),
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    const { src, height, width } = HTMLAttributes as { src: string; height: number; width: number };
    return [
      "div",
      mergeAttributes(this.options.HTMLAttributes, {
        class: "linkedin-embed",
        "data-src": src,
        "data-height": String(height),
        "data-width": String(width),
      }),
      [
        "iframe",
        {
          src,
          height: String(height),
          width: String(width),
          frameborder: "0",
          allowfullscreen: "",
          title: "Publicação incorporada",
          loading: "lazy",
        },
      ],
    ];
  },

  addCommands() {
    return {
      setLinkedInEmbed:
        (src: string) =>
        ({ commands }) =>
          commands.insertContent({ type: this.name, attrs: { src } }),
    };
  },
});

export default LinkedInEmbed;
