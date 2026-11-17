import { initials, cn } from "@/lib/utils";

interface AvatarProps {
  name: string;
  image?: string | null;
  size?: "xs" | "sm" | "md" | "lg";
  colorKey?: string; // deterministic color seed
  className?: string;
}

const sizes = {
  xs: "w-6 h-6 text-[10px]",
  sm: "w-8 h-8 text-xs",
  md: "w-10 h-10 text-sm",
  lg: "w-12 h-12 text-base",
};

const palette = ["#4775EA", "#7959D9", "#13B5D1", "#16A085", "#F0A43A", "#E25563", "#14213D"];

function colorFor(key: string) {
  let hash = 0;
  for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) | 0;
  return palette[Math.abs(hash) % palette.length];
}

export function Avatar({ name, image, size = "md", colorKey, className }: AvatarProps) {
  const bg = colorFor(colorKey ?? name);
  if (image) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={image}
        alt={name}
        className={cn("rounded-full object-cover", sizes[size], className)}
      />
    );
  }
  return (
    <div
      className={cn(
        "rounded-full flex items-center justify-center text-white font-semibold shrink-0",
        sizes[size],
        className,
      )}
      style={{ background: bg }}
    >
      {initials(name)}
    </div>
  );
}
