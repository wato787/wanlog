import type { InputHTMLAttributes, Ref } from "react";
import styles from "./Input.module.css";

export type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  ref?: Ref<HTMLInputElement>;
};

export function Input({ className, ref, ...rest }: InputProps) {
  return (
    <input
      ref={ref}
      className={[styles.input, className].filter(Boolean).join(" ")}
      {...rest}
    />
  );
}
