import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Underline from "@tiptap/extension-underline";
import StarterKit from "@tiptap/starter-kit";

import { shopifyResourceExtension } from "./shopify-resource";

export const baseExtensions = [
  StarterKit.configure({
    heading: {
      levels: [1, 2, 3, 4]
    },
    link: false,
    underline: false
  }),
  Underline,
  Link.configure({
    autolink: true,
    HTMLAttributes: {
      rel: "noopener noreferrer",
      target: "_blank"
    },
    openOnClick: false
  }),
  Image.configure({
    allowBase64: false
  }),
  shopifyResourceExtension
];
