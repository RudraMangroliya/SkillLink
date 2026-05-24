import { useSEO } from "../utils/useSEO";
import type { SEOProps } from "../utils/useSEO";

export default function SEO({ title, description }: SEOProps) {
  useSEO({ title, description });
  return null; // This component doesn't render any visible UI in the DOM
}
