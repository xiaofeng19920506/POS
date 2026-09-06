/** Central brand config — change here to rebrand from temporary "POS". */
export const brand = {
  displayName: "POS",
  tagline: "门店收银",
  primary: "#1B4D3E",
  accent: "#C4A35A",
  surface: "#F3EFE6",
  surfaceAlt: "#E7E0D2",
  ink: "#1A1A1A",
  muted: "#5C5C5C",
  logoPath: "/brand-mark.svg",
} as const;

export type BrandConfig = typeof brand;
