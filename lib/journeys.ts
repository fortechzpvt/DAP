// lib/journeys.ts
// PLACEHOLDER content, replace image paths with real photos once available.
export type Journey = {
  slug: string;
  title: string;
  location: string;
  elevation?: string;
  summary: string;
  image: string;
  videoUrl?: string;
};

export const journeys: Journey[] = [
  {
    slug: "ladakh-bike-tour",
    title: "Ladakh - Bike Tour",
    location: "Ladakh, India",
    summary:
      "A multi-part motorcycle expedition riding through the snowy mountains and high-altitude passes of Ladakh, India.",
    image: "/assets/gallery/ladakh-bike-tour.jpg",
    videoUrl: "https://www.youtube.com/watch?v=DKWM5VZ9xlE&list=PLFe-raEZgNAPTEWyNGcellWzBRM6_tS8O",
  },
  {
    slug: "annapurna-circuit-trek",
    title: "Annapurna Circuit Trek",
    location: "Annapurna, Nepal",
    summary:
      "A challenging trek series along the famous Annapurna Circuit in Nepal, journeying along one of the world's highest and most scenic mountain routes to find the highest lake in the world.",
    image: "/assets/gallery/thorong-la-pass.jpg",
    videoUrl: "https://www.youtube.com/watch?v=a1qp9iB6wVU&list=PLFe-raEZgNAO71JvEftmfCUDpKcQj9PJg",
  },
  {
    slug: "everest-base-camp-trek",
    title: "Mount Everest Base Camp Trek",
    location: "Khumbu, Nepal",
    elevation: "Kala Patthar · 5,644 m",
    summary:
      "A massive multi-part series documenting the trek to the base of the world's highest peak, from landing at the \"world's most dangerous airport\" to braving freezing temperatures to witness the sunrise from Kala Patthar.",
    image: "/assets/gallery/everest-base-camp-trek.jpg",
    videoUrl: "https://www.youtube.com/watch?v=fuTuIdFdk_g&list=PLFe-raEZgNANbXVXy2OdtkD35T-PQPxqM",
  },
];
