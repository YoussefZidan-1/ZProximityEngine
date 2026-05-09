import React, { Fragment, useMemo, CSSProperties } from "react";
import { Proximity, ProximityProps } from "./Proximity";
import { useProximityConfig } from "./ProximityContext";

export interface ProximityTextProps extends ProximityProps {
  text: string;
  splitBy?: "letter" | "word" | "line";
  textClassName?: string;
  fontFamily?: string;
  lineHeight?: number;
  textLetterSpacing?: number;
  wordSpacing?: number;
  clipFix?: string;
  ignoreText?: (string | RegExp)[];
  textAlign?: 'left' | 'center' | 'right' | 'justify';
  justifyContent?: 'flex-start' | 'center' | 'flex-end' | 'space-between';
}

export const ProximityText: React.FC<ProximityTextProps> = ({
  text,
  splitBy = "letter",
  className = "",
  textClassName = "",
  fontFamily,
  lineHeight = 1.2,
  textLetterSpacing = 0,
  wordSpacing = 0.5,
  clipFix = "0.15em",
  ignoreText,
  textAlign,
  justifyContent,
  style,
  ...proximityProps
}) => {
  const globalConfig = useProximityConfig();
  const actualFontFamily = fontFamily || globalConfig.defaultFont;

  const activeSplitBy = proximityProps.config?.splitBy ?? splitBy;

  const containerStyle = useMemo<CSSProperties>(() => {
    const base: CSSProperties = {
      display: "flex",
      fontFamily: actualFontFamily,
      lineHeight: lineHeight,
      letterSpacing: `${textLetterSpacing}em`,
      textAlign: textAlign,
      justifyContent: justifyContent,
    };
    if (activeSplitBy === "word") {
      return { ...base, flexWrap: "wrap", columnGap: `${wordSpacing}em`, rowGap: "0.1em" };
    }
    if (activeSplitBy === "line") {
      return { ...base, display: "block" };
    }
    return { ...base, flexWrap: "wrap", rowGap: "0.1em" };
  },[activeSplitBy, actualFontFamily, lineHeight, textLetterSpacing, wordSpacing, textAlign, justifyContent]);

  const renderedContent = useMemo(() => {
    const checkIgnore = (str: string): boolean => {
      if (!ignoreText || !Array.isArray(ignoreText)) return false;
      return ignoreText.some((rule) => {
        if (typeof rule === "string") return rule === str;
        if (rule instanceof RegExp) return rule.test(str);
        return false;
      });
    };

    const spanStyle = (ignored: boolean): CSSProperties => ({
      display: "inline-block",
      userSelect: "none",
      padding: clipFix ? clipFix : undefined,
      margin: clipFix ? `calc(-1 * ${clipFix})` : undefined,
    });

    const lines = text.split("\n");

    if (activeSplitBy === "word") {
      return lines.map((line, lineIdx) => (
        <Fragment key={`line-group-${lineIdx}`}>
          {line.split(" ").filter(w => w.length > 0).map((word, i) => {
            const isIgnored = checkIgnore(word);
            const partClass = isIgnored ? textClassName : `prox-part ${textClassName}`.trim();
            return (
              <span
                key={`word-${lineIdx}-${i}`}
                aria-hidden="true"
                className={partClass}
                style={{ ...spanStyle(isIgnored), whiteSpace: "nowrap" }}
              >
                {word}
              </span>
            );
          })}
          {lineIdx < lines.length - 1 && (
            <div style={{ width: "100%", height: 0 }} />
          )}
        </Fragment>
      ));
    }

    if (activeSplitBy === "line") {
      return lines.map((line, i) => {
        const isIgnored = checkIgnore(line);
        const partClass = isIgnored ? textClassName : `prox-part ${textClassName}`.trim();
        return (
          <Fragment key={`line-${i}`}>
            <span
              aria-hidden="true"
              className={partClass}
              style={{ ...spanStyle(isIgnored), whiteSpace: "nowrap" }}
            >
              {line}
            </span>
            {i < lines.length - 1 && <br />}
          </Fragment>
        );
      });
    }
    return lines.map((line, lineIdx) => {
      const words = line.split(" ");
      return (
        <Fragment key={`line-${lineIdx}`}>
          {words.map((word, wordIdx) => (
            <Fragment key={`word-wrapper-${lineIdx}-${wordIdx}`}>
              <span style={{ display: "inline-flex", flexWrap: "nowrap" }}>
                {[...word].map((char, charIdx) => {
                  const isIgnored = checkIgnore(char);
                  const partClass = isIgnored
                    ? textClassName
                    : `prox-part ${textClassName}`.trim();
                  return (
                    <span
                      aria-hidden="true"
                      key={`char-${charIdx}`}
                      className={partClass}
                      style={spanStyle(isIgnored)}
                    >
                      {char}
                    </span>
                  );
                })}
              </span>
              {wordIdx < words.length - 1 && (
                <span
                  aria-hidden="true"
                  style={{
                    display: "inline-block",
                    width: `${wordSpacing}em`,
                    flexShrink: 0,
                  }}
                />
              )}
            </Fragment>
          ))}
          {lineIdx < lines.length - 1 && (
            <div style={{ width: "100%", height: 0 }} />
          )}
        </Fragment>
      );
    });
  },[text, activeSplitBy, textClassName, clipFix, ignoreText, wordSpacing]);

  return (
    <Proximity selector=".prox-part" className={className} {...proximityProps}>
      <span
        style={{
          position: "absolute",
          width: "1px",
          height: "1px",
          padding: 0,
          margin: "-1px",
          overflow: "hidden",
          clip: "rect(0, 0, 0, 0)",
          whiteSpace: "nowrap",
          border: 0,
        }}
      >
        {text}
      </span>
      <div aria-hidden="true" style={containerStyle}>
        {renderedContent}
      </div>
    </Proximity>
  );
};