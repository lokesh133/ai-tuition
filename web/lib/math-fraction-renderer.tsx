import React from 'react';

/**
 * Checks if a string contains mixed fractions (e.g. 4 2/5, 2 4/5)
 * or simple fractions (e.g. 2/5, 1/2) that should be rendered vertically.
 */
export function hasMathFraction(text: string): boolean {
  if (!text) return false;
  // Mixed fraction: whole number + space + numerator/denominator (e.g. 4 2/5)
  // Or simple fraction: numerator/denominator (e.g. 2/5) excluding dates (e.g. 25/10/2026)
  return /(\b\d+\s+\d+\/\d+\b|(?<!\d\/)\b\d+\/\d+\b(?!\/\d))/.test(text);
}

/**
 * Renders mathematical mixed fractions and simple fractions
 * with textbook-style vertical stacking (numerator, fraction bar line, denominator)
 * exactly as printed in school textbooks.
 *
 * Example:
 * "4 2/5 kg" -> 4 [ 2 over 5 ] kg
 */
export function renderMathFractions(content: React.ReactNode): React.ReactNode {
  if (typeof content !== 'string') {
    if (React.isValidElement(content)) {
      const props = content.props as any;
      if (props && props.children) {
        if (typeof props.children === 'string') {
          return React.cloneElement(content, { ...props, children: renderMathFractions(props.children) });
        } else if (Array.isArray(props.children)) {
          return React.cloneElement(content, {
            ...props,
            children: React.Children.map(props.children, renderMathFractions),
          });
        }
      }
    }
    return content;
  }

  const str = content;
  // Match mixed fractions: e.g. "4 2/5" or simple fractions: e.g. "2/5"
  const fractionRegex = /(\b\d+\s+\d+\/\d+\b|(?<!\d\/)\b\d+\/\d+\b(?!\/\d))/g;
  if (!fractionRegex.test(str)) {
    return str;
  }

  const parts = str.split(fractionRegex);

  return (
    <>
      {parts.map((part, pIdx) => {
        // Check for mixed fraction: e.g. "4 2/5" or "2 4/5"
        const mixedMatch = part.match(/^(\d+)\s+(\d+)\/(\d+)$/);
        if (mixedMatch) {
          const whole = mixedMatch[1];
          const num = mixedMatch[2];
          const den = mixedMatch[3];
          return (
            <span
              key={pIdx}
              className="inline-flex items-center gap-1 mx-1 align-middle font-sans select-text"
              title={`${whole} and ${num}/${den}`}
            >
              <span className="font-extrabold text-[1.15em] leading-none">{whole}</span>
              <span className="inline-flex flex-col text-center text-[0.78em] leading-none -translate-y-[1px]">
                <span className="border-b-2 border-current pb-[1.5px] font-black px-0.5">{num}</span>
                <span className="pt-[1.5px] font-black px-0.5">{den}</span>
              </span>
            </span>
          );
        }

        // Check for simple fraction: e.g. "2/5"
        const simpleMatch = part.match(/^(\d+)\/(\d+)$/);
        if (simpleMatch) {
          const num = simpleMatch[1];
          const den = simpleMatch[2];
          return (
            <span
              key={pIdx}
              className="inline-flex flex-col text-center text-[0.78em] leading-none mx-0.5 align-middle font-sans select-text -translate-y-[1px]"
              title={`${num}/${den}`}
            >
              <span className="border-b-2 border-current pb-[1.5px] font-black px-0.5">{num}</span>
              <span className="pt-[1.5px] font-black px-0.5">{den}</span>
            </span>
          );
        }

        return part;
      })}
    </>
  );
}

export default renderMathFractions;
