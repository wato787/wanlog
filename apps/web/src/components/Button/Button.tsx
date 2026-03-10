import { Button as BaseButton } from "@base-ui/react/button";
import type { ComponentProps } from "react";
import styles from "./Button.module.css";

export type ButtonVariant = "primary" | "secondary";

export type ButtonProps = ComponentProps<typeof BaseButton> & {
  variant?: ButtonVariant;
};

export function Button({
  variant = "primary",
  type = "button",
  className,
  children,
  ...rest
}: ButtonProps) {
  return (
    <BaseButton
      type={type}
      className={[styles.root, styles[variant], className].filter(Boolean).join(" ")}
      {...rest}
    >
      {children}
    </BaseButton>
  );
}
