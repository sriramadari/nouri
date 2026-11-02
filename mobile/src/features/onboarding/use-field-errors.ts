import { useState } from 'react';

/**
 * Errors stay hidden until the first Continue press, then update live as the person types.
 * Nobody likes being told off before they have finished typing.
 */
export function useFieldErrors<TField extends string>(
  validate: () => Partial<Record<TField, string | null>>,
) {
  const [submitted, setSubmitted] = useState(false);
  const errors = validate();
  const hasErrors = Object.values(errors).some(Boolean);

  const noErrors: Partial<Record<TField, string | null>> = {};

  return {
    errors: submitted ? errors : noErrors,
    /** Shows the errors and returns true when the step may continue. */
    submit: () => {
      setSubmitted(true);
      return !hasErrors;
    },
  };
}
