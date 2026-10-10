import { Fragment, type ReactNode } from 'react';

/** Replace the \u0000 placeholder in a translated string with a React node. */
export function interp(text: string, node: ReactNode): ReactNode {
  const parts = text.split('\u0000');
  return parts.map((p, i) => (
    <Fragment key={i}>
      {p}
      {i < parts.length - 1 && node}
    </Fragment>
  ));
}
