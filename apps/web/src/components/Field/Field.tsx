import { createContext, useContext } from "react";
import { Field as BaseField } from "@base-ui/react/field";
import styles from "./Field.module.css";
import inputStyles from "../Input/Input.module.css";

type FieldContextValue = { required?: boolean };
const FieldContext = createContext<FieldContextValue>({});

function FieldRoot({
  className,
  required,
  ...props
}: React.ComponentProps<typeof BaseField.Root> & { required?: boolean }) {
  return (
    <FieldContext.Provider value={{ required }}>
      <BaseField.Root
        className={[styles.root, className].filter(Boolean).join(" ")}
        {...props}
      />
    </FieldContext.Provider>
  );
}

function FieldLabelComponent({
  className,
  children,
  ...props
}: React.ComponentProps<typeof BaseField.Label>) {
  const { required } = useContext(FieldContext);
  return (
    <BaseField.Label
      className={[styles.label, className].filter(Boolean).join(" ")}
      {...props}
    >
      {children}
      {required && <span aria-hidden> ※</span>}
    </BaseField.Label>
  );
}

function FieldInputComponent(
  props: React.ComponentProps<typeof BaseField.Control>
) {
  const { required: _required, ...controlProps } = props;
  return (
    <BaseField.Control
      className={[inputStyles.input, controlProps.className].filter(Boolean).join(" ")}
      {...controlProps}
    />
  );
}

function errorToMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (error != null && typeof error === "object" && "message" in error && typeof (error as { message: unknown }).message === "string") {
    return (error as { message: string }).message;
  }
  if (error != null) return String(error);
  return "エラーが発生しました";
}

type FieldErrorProps = React.ComponentProps<typeof BaseField.Error> & {
  /** 渡すと表示の有無とメッセージをここから導出する（match / children は省略可） */
  error?: unknown;
};

function FieldErrorComponent({ className, error, match, children, ...props }: FieldErrorProps) {
  const showByError = error !== undefined && error !== null;
  const message = error !== undefined && error !== null ? errorToMessage(error) : children;
  return (
    <BaseField.Error
      className={[styles.error, className].filter(Boolean).join(" ")}
      match={match ?? (showByError ? true : undefined)}
      {...props}
    >
      {message}
    </BaseField.Error>
  );
}

/** フォームフィールドのルート。Field.Label / Field.Input / Field.Error と組み合わせて使う。 */
export const Field = Object.assign(FieldRoot, {
  Label: FieldLabelComponent,
  Control: BaseField.Control,
  Input: FieldInputComponent,
  Error: FieldErrorComponent,
});

export const FieldLabel = Field.Label;
export const FieldError = Field.Error;
export const FieldControl = Field.Control;
export const FieldInput = Field.Input;
