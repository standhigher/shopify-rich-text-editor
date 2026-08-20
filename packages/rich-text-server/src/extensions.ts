import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Underline from "@tiptap/extension-underline";
import StarterKit from "@tiptap/starter-kit";

import { shopifyResourceServerExtension } from "./extensions/shopify-resource";

export const serverExtensions = [
  StarterKit.configure({
    heading: {
      levels: [1, 2, 3, 4]
    },
    link: false,
    underline: false
  }),
  Underline,
  Link.configure({
    HTMLAttributes: {
      rel: "noopener noreferrer",
      target: "_blank"
    },
    openOnClick: false
  }),
  Image,
  shopifyResourceServerExtension
];
