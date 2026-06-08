import Image from "next/image"
import { getTeamFlagPath, getTeamViName } from "@/lib/team-data"
import { cn } from "@/lib/utils"

export function TeamFlag({
  team,
  size = "md",
  showName = true,
  align = "left",
  className,
}: {
  team: string
  size?: "sm" | "md" | "lg"
  showName?: boolean
  align?: "left" | "right"
  className?: string
}) {
  const sizeMap = {
    sm: { img: 20, cls: "size-5" },
    md: { img: 28, cls: "size-7" },
    lg: { img: 36, cls: "size-9" },
  }
  const { img, cls } = sizeMap[size]
  const viName = getTeamViName(team)

  return (
    <span
      className={cn(
        "inline-flex items-center gap-2",
        align === "right" && "flex-row-reverse text-right",
        className
      )}
    >
      <Image
        src={getTeamFlagPath(team)}
        alt={`Cờ ${viName}`}
        width={img}
        height={Math.round(img * 0.75)}
        className={cn(cls, "shrink-0 rounded-sm object-cover shadow-sm ring-1 ring-border/50")}
        unoptimized
      />
      {showName && (
        <span className="truncate font-semibold text-foreground">{viName}</span>
      )}
    </span>
  )
}
