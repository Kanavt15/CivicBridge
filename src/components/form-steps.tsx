"use client";
import { ArrowLeft, ArrowRight, Check, LoaderCircle, Send } from "lucide-react";
import { Button } from "./ui/button";
import { Text } from "./i18n";
export function StepProgress({ step, labels }: { step: number; labels: string[] }) {
  return (
    <ol className="wizard-steps" aria-label="Progress">
      {labels.map((title, i) => (
        <li
          className={"wizard-step" + (i === step ? " active" : i < step ? " done" : "")}
          key={title}
          aria-current={i === step ? "step" : undefined}
        >
          <span>{i < step ? <Check size={13} /> : i + 1}</span>
          <Text>{title}</Text>
        </li>
      ))}
    </ol>
  );
}
export function stepValid(form: HTMLFormElement | null, step: number) {
  if (!form) return false;
  const fields = form.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>(
    'fieldset[data-step="' +
      step +
      '"] input,fieldset[data-step="' +
      step +
      '"] select,fieldset[data-step="' +
      step +
      '"] textarea',
  );
  for (const field of fields) {
    if (!field.checkValidity()) {
      field.reportValidity();
      return false;
    }
  }
  return true;
}
export function WizardActions({
  step,
  onNext,
  onBack,
  busy,
  submitLabel,
}: {
  step: number;
  onNext: () => void;
  onBack: () => void;
  busy: boolean;
  submitLabel: string;
}) {
  return (
    <div className="wizard-footer">
      {step > 0 ? (
        <Button type="button" variant="ghost" disabled={busy} onClick={onBack}>
          <ArrowLeft size={15} />
          <Text>Back</Text>
        </Button>
      ) : (
        <span>
          <Text>Your choice stays editable.</Text>
        </span>
      )}
      {step < 2 ? (
        <Button
          key="continue"
          type="button"
          disabled={busy}
          onClick={(event) => {
            event.preventDefault();
            onNext();
          }}
        >
          <Text>Continue</Text>
          <ArrowRight size={16} />
        </Button>
      ) : (
        <Button key="submit" type="submit" disabled={busy}>
          {busy ? <LoaderCircle className="spin" size={15} /> : <Send size={15} />}
          <Text>{busy ? "Submitting…" : submitLabel}</Text>
        </Button>
      )}
    </div>
  );
}
