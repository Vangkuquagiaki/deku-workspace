import { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://deku-workspace.vercel.app";
  const now = new Date();

  return [
    {
      url: baseUrl,
      lastModified: now,
    },
    {
      url: `${baseUrl}/base`,
      lastModified: now,
    },
    {
      url: `${baseUrl}/download`,
      lastModified: now,
    },
    {
      url: `${baseUrl}/test-bot`,
      lastModified: now,
    },
    {
      url: `${baseUrl}/meetings`,
      lastModified: now,
    },
    {
      url: `${baseUrl}/sign-in`,
      lastModified: now,
    },
  ];
}
