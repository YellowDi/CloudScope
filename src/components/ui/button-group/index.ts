import type { VariantProps } from "class-variance-authority"
import { cva } from "class-variance-authority"

export { default as ButtonGroup } from "./ButtonGroup.vue"
export { default as ButtonGroupSeparator } from "./ButtonGroupSeparator.vue"
export { default as ButtonGroupText } from "./ButtonGroupText.vue"

export const buttonGroupVariants = cva(
  [
    "inline-flex isolate w-fit rounded-md shadow-xs",
    "data-[orientation=horizontal]:flex-row data-[orientation=horizontal]:[&>*:not(:first-child)]:-ml-px data-[orientation=horizontal]:[&>*:not(:first-child)]:rounded-l-none data-[orientation=horizontal]:[&>*:not(:last-child)]:rounded-r-none",
    "data-[orientation=vertical]:flex-col data-[orientation=vertical]:[&>*:not(:first-child)]:-mt-px data-[orientation=vertical]:[&>*:not(:first-child)]:rounded-t-none data-[orientation=vertical]:[&>*:not(:last-child)]:rounded-b-none",
    "[&>*]:relative [&>*]:shadow-none [&>*]:focus-visible:z-10",
  ].join(" "),
  {
    variants: {
      orientation: {
        horizontal: "",
        vertical: "",
      },
    },
    defaultVariants: {
      orientation: "horizontal",
    },
  },
)

export type ButtonGroupVariants = VariantProps<typeof buttonGroupVariants>
