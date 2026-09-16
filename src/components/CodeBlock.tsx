import * as React from 'react';
import { cx } from '../utils/cx';
import { Icon } from './Icon';

export interface CodeBlockProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  /** The code itself. Pass a template literal — whitespace is preserved verbatim. */
  code: string;
  /** Language chip in the header — "bash", "ts", "json", "python". */
  language?: string;
  /** Filename or context shown at the left of the header, e.g. `app/api/quote/route.ts`. */
  filename?: string;
  /** Light treatment for docs pages that are already on a white canvas. */
  tone?: 'dark' | 'light';
  /** Show the copy affordance. On by default — every snippet is meant to be taken. */
  copyable?: boolean;
}

/**
 * A snippet of code as a first-class piece of the interface — the unit of an API
 * reference, a quickstart, or an embed instruction. Kōvara sells infrastructure, so a
 * code block is product surface, not documentation decoration: give it the same weight
 * as a `Card`.
 *
 * @example
 * <CodeBlock
 *   language="bash"
 *   filename="Rate a contract"
 *   code={`curl https://api.kovara.ai/v1/quotes \\\n  -H "Authorization: Bearer $KOVARA_API_KEY" \\\n  -d vin=1HGCM82633A004352`}
 * />
 */
export const CodeBlock = React.forwardRef<HTMLDivElement, CodeBlockProps>(function CodeBlock(
  { code, language, filename, tone = 'dark', copyable = true, className, ...rest },
  ref
) {
  return (
    <div ref={ref} className={cx('kv-code', tone === 'light' && 'kv-code--light', className)} {...rest}>
      {filename || language || copyable ? (
        <div className="kv-code__head">
          <span className="kv-code__title">{filename}</span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            {language ? <span className="kv-code__lang">{language}</span> : null}
            {copyable ? (
              <button type="button" className="kv-code__copy">
                <Icon name="clipboard" size={12} />
                Copy
              </button>
            ) : null}
          </span>
        </div>
      ) : null}
      <pre className="kv-code__body">
        <code>{code}</code>
      </pre>
    </div>
  );
});
