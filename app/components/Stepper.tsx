import { Fragment } from "react";
import { IconCheck } from "./icons";

const STEPS = ["Choose document", "Pick schedule", "Review & submit"];

export default function Stepper({ current }: { current: 1 | 2 | 3 }) {
  return (
    <ol className="kb-stepper" aria-label="Request progress">
      {STEPS.map((label, i) => {
        const n = i + 1;
        const state = n < current ? "is-done" : n === current ? "is-active" : "";
        return (
          <Fragment key={label}>
            {i > 0 && <li aria-hidden="true" className={`kb-step-line ${n <= current ? "is-done" : ""}`} />}
            <li className={`kb-step ${state}`} aria-current={n === current ? "step" : undefined}>
              <span className="kb-step-num">{n < current ? <IconCheck size={14} /> : n}</span>
              <span className="kb-step-label">{label}</span>
            </li>
          </Fragment>
        );
      })}
    </ol>
  );
}
