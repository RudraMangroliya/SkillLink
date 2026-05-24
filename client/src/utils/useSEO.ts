import { useEffect } from "react";

export interface SEOProps {
  title: string;
  description?: string;
}

export function useSEO({ title, description }: SEOProps) {
  useEffect(() => {
    // Keep track of the original title and description
    const previousTitle = document.title;
    let metaDescription = document.querySelector('meta[name="description"]');
    const previousDescription = metaDescription ? metaDescription.getAttribute("content") : "";

    // Set dynamic page title
    document.title = title ? `${title} | SkillLink` : "SkillLink | AI-Powered Professional Networking";

    // Set dynamic meta description
    if (description) {
      if (metaDescription) {
        metaDescription.setAttribute("content", description);
      } else {
        metaDescription = document.createElement("meta");
        metaDescription.setAttribute("name", "description");
        metaDescription.setAttribute("content", description);
        document.head.appendChild(metaDescription);
      }
    }

    // Restore original values when component unmounts to prevent state leakage
    return () => {
      document.title = previousTitle;
      if (metaDescription && previousDescription !== null) {
        metaDescription.setAttribute("content", previousDescription);
      }
    };
  }, [title, description]);
}
