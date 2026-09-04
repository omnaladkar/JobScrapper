import { getInitials } from "@/lib/filters";

export default function CompanyLogo({
  name,
  src,
  size = 44,
}: {
  name: string;
  src: string | null;
  size?: number;
}) {
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-lg border border-gray-200 bg-gray-50 font-semibold text-gray-500"
      style={{ width: size, height: size, fontSize: size * 0.36 }}
      aria-hidden="true"
    >
      {getInitials(name)}
    </span>
  );
}
