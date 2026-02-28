import * as React from "react"

import { cn } from "@/lib/utils"

type ContainerSize = "default" | "wide" | "narrow" | "full"

const sizeClassMap: Record<ContainerSize, string> = {
  default: "max-w-[1320px]",
  wide: "max-w-[1520px]",
  narrow: "max-w-5xl",
  full: "max-w-none",
}

function Container({
  className,
  size = "default",
  ...props
}: React.ComponentProps<"div"> & { size?: ContainerSize }) {
  return (
    <div
      className={cn("mx-auto w-full min-w-0 px-4 sm:px-6 lg:px-8", sizeClassMap[size], className)}
      {...props}
    />
  )
}

export { Container }
