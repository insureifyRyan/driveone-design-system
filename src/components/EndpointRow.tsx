import * as React from 'react';
import { cx } from '../utils/cx';

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface EndpointRowProps extends React.HTMLAttributes<HTMLDivElement> {
  method: HttpMethod;
  /** The route. Wrap path params in braces — `/v1/policies/{policy_id}` — and they are tinted. */
  path: string;
  /** What the endpoint does, in one line. */
  description?: React.ReactNode;
  /** Trailing slot — an auth `Badge`, a version chip, a "Try it" `Button`. */
  end?: React.ReactNode;
  /** Drop the card frame so rows stack into a flush reference list. */
  bare?: boolean;
}

/**
 * One route in an API reference. The method chip colors are the conventional ones, so a
 * developer can scan a list of endpoints without reading them.
 *
 * Stack them with `bare` inside a `Card padding="none"` to build a reference section.
 *
 * @example
 * <EndpointRow method="POST" path="/v1/quotes" description="Rate a contract across every appointed carrier" />
 * @example
 * <EndpointRow method="GET" path="/v1/policies/{policy_id}" description="Retrieve a bound contract" bare />
 */
export const EndpointRow = React.forwardRef<HTMLDivElement, EndpointRowProps>(function EndpointRow(
  { method, path, description, end, bare = false, className, ...rest },
  ref
) {
  const parts = path.split(/(\{[^}]+\})/g);
  return (
    <div ref={ref} className={cx('kv-endpoint', bare && 'kv-endpoint--bare', className)} {...rest}>
      <span className={cx('kv-endpoint__method', `kv-endpoint__method--${method.toLowerCase()}`)}>{method}</span>
      <div className="kv-endpoint__body">
        <span className="kv-endpoint__path">
          {parts.map((part, i) => (part.startsWith('{') ? <em key={i}>{part}</em> : <React.Fragment key={i}>{part}</React.Fragment>))}
        </span>
        {description ? <span className="kv-endpoint__description">{description}</span> : null}
      </div>
      {end ? <div className="kv-endpoint__end">{end}</div> : null}
    </div>
  );
});
