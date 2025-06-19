import { StaticImageData } from "next/image";

export type Product = {
  title: string;
  description: string;
  thumbnail: StaticImageData | string;
  href: string;
  stack?: string[];
};
