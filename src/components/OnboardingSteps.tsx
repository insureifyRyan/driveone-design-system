import * as React from 'react';
import { cx } from '../utils/cx';
import { Icon } from './Icon';

export type OnboardingStepState = 'complete' | 'current' | 'pending' | 'blocked';

export interface OnboardingStep {
  /** What the step is — "Verify licensing", "Connect DMS", "Sign dealer agreement". */
  title: string;
  /** What is needed, or what happened. */
  description?: React.ReactNode;
  state?: OnboardingStepState;
  /** Who it is waiting on — "Kōvara", "Compliance", the dealer's name. */
  owner?: string;
}

export interface OnboardingStepsProps extends React.HTMLAttributes<HTMLOListElement> {
  steps: OnboardingStep[];
  /** Lay the steps out in a row — for a wizard header rather than a checklist panel. */
  orientation?: 'vertical' | 'horizontal';
}

/**
 * The progress checklist for automated onboarding — a new dealer, credit union branch
 * or agency going live. Name the `owner` on every incomplete step; onboarding stalls
 * are almost always an ownership question, not a system one.
 *
 * @example
 * <OnboardingSteps steps={[
 *   { title: 'Licensing verified', state: 'complete', owner: 'Kōvara' },
 *   { title: 'Connect CDK Drive', description: 'Waiting on store credentials', state: 'current', owner: 'Beacon Auto Group' },
 *   { title: 'Product pricing approved', state: 'pending', owner: 'Compliance' },
 * ]} />
 */
export const OnboardingSteps = React.forwardRef<HTMLOListElement, OnboardingStepsProps>(function OnboardingSteps(
  { steps, orientation = 'vertical', className, ...rest },
  ref
) {
  return (
    <ol ref={ref} className={cx('kv-steps', orientation === 'horizontal' && 'kv-steps--horizontal', className)} {...rest}>
      {steps.map((step, i) => {
        const state = step.state ?? 'pending';
        return (
          <li key={step.title} className={cx('kv-steps__item', `kv-steps__item--${state}`)}>
            <span className="kv-steps__marker">
              {state === 'complete' ? (
                <Icon name="check" size={13} strokeWidth={2.5} />
              ) : state === 'blocked' ? (
                <Icon name="alert-triangle" size={12} />
              ) : (
                i + 1
              )}
            </span>
            <div className="kv-steps__content">
              <span className="kv-steps__title">{step.title}</span>
              {step.description ? <span className="kv-steps__description">{step.description}</span> : null}
              {step.owner ? (
                <span className="kv-steps__owner">
                  <Icon name={step.owner.toLowerCase().includes('kōvara') ? 'sparkles' : 'user'} size={11} />
                  {step.owner}
                </span>
              ) : null}
            </div>
          </li>
        );
      })}
    </ol>
  );
});
