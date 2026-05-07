// Viessmann brand wordmark + program label.
//
// The SVG path is the official VIESSMANN lettermark (viewBox 128×27).
// It uses `fill=currentColor` so the colour comes from the surrounding
// CSS — we always render it in `--vie-red`.
//
// `subtitle` is the program / context label shown next to the wordmark
// (e.g. "Loyalty" on installer pages, "Admin" on admin pages).
//
// Sizes:
//   sm  →  20 px tall   (compact headers)
//   md  →  24 px tall   (standard headers)
//   lg  →  32 px tall   (landing page)

export type BrandSize = "sm" | "md" | "lg";

interface BrandProps {
  subtitle?: string;
  size?: BrandSize;
  className?: string;
}

const HEIGHT: Record<BrandSize, string> = {
  sm: "h-[18px]",
  md: "h-[22px]",
  lg: "h-[28px]",
};

export function Brand({ subtitle = "Loyalty", size = "md", className = "" }: BrandProps) {
  const subtitleSize = size === "lg" ? "text-base" : size === "md" ? "text-sm" : "text-[13px]";
  return (
    <span className={`inline-flex items-center gap-2.5 leading-none ${className}`}>
      <ViessmannWordmark className={`${HEIGHT[size]} w-auto text-[var(--vie-red)]`} />
      {subtitle && (
        <>
          <span className="text-[var(--vie-line-strong)] font-light text-lg select-none" aria-hidden="true">
            |
          </span>
          <span className={`font-semibold text-[var(--vie-ink)] tracking-tight ${subtitleSize}`}>
            {subtitle}
          </span>
        </>
      )}
    </span>
  );
}

export function ViessmannWordmark({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 128 27"
      fill="currentColor"
      role="img"
      aria-label="Viessmann"
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M47.78 4.63h5.596s4.202.11 4.202 3.816c0 4.305-4.202 4.145-4.202 4.145h-9.873V9.286h9.529s.78 0 .78-.705c0-.814-.778-.814-.778-.814l-5.905.009s-3.899.088-3.899-3.85C43.23.092 47.13 0 47.13 0l9.937.006v3.237h-9.287s-.869 0-.869.682c0 .706.87.706.87.706m20.749 6.653c-.153.412-.198 1.201-.198 1.201s-.066-.8-.216-1.2l-1.857-4.99-6.057-.002-.006 12.056 3.888-.001v-7.171s0 .425.165.809l2.754 6.363h2.658l2.751-6.51c.164-.387.164-.812.164-.812v7.321h3.906V6.293h-6.08zm-48.426 7.064h4.507V6.293l-4.507-.001zm12.854-4.888 6.763.001v-2.714h-6.763V9.253h8.232v-2.96H28.686v12.054h12.831v-3.214h-8.56zm-23.796.979s0-.426.187-.805l3.659-7.337 5.383.029-6.511 12.047-5.418-.01L0 6.292h5.423l3.547 7.33c.19.39.19.816.19.816m44.215 4.6H47.78s-.87 0-.87-.706c0-.682.87-.682.87-.682h9.286V14.38l-9.937.025s-3.899.095-3.899 3.926c0 3.94 3.899 3.866 3.899 3.866l5.905-.023s.779 0 .779.87c0 .648-.781.648-.781.648h-9.529v3.305l9.873.001s4.202.16 4.202-4.146c0-3.706-4.202-3.814-4.202-3.814m32.521-8.492c-.187.372-1.276 2.52-1.276 2.52l2.938.013-1.282-2.532c-.19-.373-.19-.8-.19-.8s0 .427-.19.8m-2.19-4.252h4.76l6.124 12.054h-.413.001-4.348l-1.132-2.23h-5.223l-1.132 2.23h-4.762zm22.158 6.617s0-.426-.28-.75l-5.055-5.868h-4.483v12.054h4.483V11.73s0 .425.268.748l4.869 5.872 4.452-.002V6.293h-4.254zm17.881.002V6.295H128v12.054l-4.452.002-4.869-5.872c-.267-.324-.267-.748-.267-.748v6.618h-4.483V6.295h4.483l5.055 5.868c.279.324.279.75.279.75"
      />
    </svg>
  );
}
