import localfont from "next/font/local";

import { DM_Sans, Syne, Fredoka } from "next/font/google";

export const syne = Syne({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
});

// Font based on marketing staff suggestion
export const larken = localfont({
  src: [
    {
      path: "../public/fonts/larken/LarkenDEMO-Regular.woff2",
      weight: "400",
      style: "normal"
    },
  ],
  variable: "--font-larken"
});

export const fredoka = Fredoka({
  subsets: ["latin"],
  weight: ["300", "400", "500"]
})
