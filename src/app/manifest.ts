import type { MetadataRoute } from "next";
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/app",
    name: "CivicBridge — Community problems and solutions",
    short_name: "CivicBridge",
    description:
      "Post local problems, propose practical solutions, and follow your community's progress.",
    start_url: "/app",
    scope: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#142d3a",
    lang: "en-IN",
    icons: [
      { src: "/icons/app-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/app-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/app-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      {
        name: "Post a problem",
        url: "/problems/new",
        description: "Report a local community issue",
      },
      {
        name: "Propose a solution",
        url: "/solutions/new",
        description: "Respond to an open challenge",
      },
    ],
  };
}
