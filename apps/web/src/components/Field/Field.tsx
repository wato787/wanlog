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

function FieldErrorComponent({
  className,
  ...props
}: React.ComponentProps<typeof BaseField.Error>) {
  return (
    <BaseField.Error
      className={[styles.error, className].filter(Boolean).join(" ")}
      {...props}
    />
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
