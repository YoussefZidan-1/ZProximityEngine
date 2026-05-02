import React, { Fragment, useMemo, CSSProperties } from "react";
import { Proximity, ProximityProps } from "./Proximity";
import { useProximityConfig } from "./ProximityContext";

export interface ProximityTextProps extends ProximityProps {
  text: string;
  splitBy?: "letter" | "word" | "line";
  textClassName?: string;
  fontFamily?: string;
  lineHeight?: number;
  letterSpacing?: number;
  wordSpacing?: number;
  clipFix?: string;
  ignoreText?: (string | RegExp)[];
  textAlign?: 'left' | 'center' | 'right' | 'justify'; 
  justifyContent?: 'flex-start' | 'center' | 'flex-end' | 'space-between';
}

export const ProximityText: React.FC<ProximityTextProps> = ({
  text, splitBy = "letter", className = "", textClassName = "", fontFamily,
  lineHeight = 1.2, letterSpacing = 0, wordSpacing = 0.5, clipFix = "0.2em",
  ignoreText, textAlign, justifyContent, style, ...proximityProps
}) => {
  const globalConfig = useProximityConfig();
  const actualFontFamily = fontFamily || globalConfig.defaultFont;
  
  // Parity Logic: Check config object first, then direct prop
  const activeSplitBy = proximityProps.config?.splitBy ?? splitBy;

  const containerStyle = useMemo<CSSProperties>(() => {
    const base: CSSProperties = { 
      display: "flex", fontFamily: actualFontFamily, lineHeight: lineHeight,
      letterSpacing: `${letterSpacing}em`, textAlign: textAlign, justifyContent: justifyContent
    };
    if (activeSplitBy === "word") return { ...base, flexWrap: "wrap", columnGap: `${wordSpacing}em`, rowGap: "0.1em" };
    if (activeSplitBy === "line") return { ...base, display: "block" };
    return { ...base, flexWrap: "wrap", rowGap: "0.1em" }; 
  },[activeSplitBy, actualFontFamily, lineHeight, letterSpacing, wordSpacing, textAlign, justifyContent]);

  const renderedContent = useMemo(() => {
    const getStyles = (ignored: boolean): CSSProperties => ({
      display: "inline-block", userSelect: "none",
      willChange: ignored ? "auto" : "transform, filter, opacity",
      padding: clipFix, margin: clipFix ? `-${clipFix}` : "0",
    });

    const checkIgnore = (str: string) => {
      if (!ignoreText || !Array.isArray(ignoreText)) return false;
      return ignoreText.some((rule) => {
        if (typeof rule === "string") return rule === str;
        if (rule instanceof RegExp) return rule.test(str);
        return false;
      });
    };

    const lines = text.split("\n");

    if (activeSplitBy === "word") {
      return lines.map((line, lineIdx) => (
        <Fragment key={`line-group-${lineIdx}`}>
          {line.split(" ").map((word, i) => {
            const isIgnored = checkIgnore(word);
            const partClass = isIgnored ? textClassName : `prox-part ${textClassName}`.trim();
            return (
              <span key={`word-${lineIdx}-${i}`} aria-hidden="true" className={partClass} style={{ ...getStyles(isIgnored), whiteSpace: "nowrap" }}>
                {word}
              </span>
            );
          })}
          {lineIdx < lines.length - 1 && <div style={{ width: "100%", height: 0 }} />}
        </Fragment>
      ));
    }

    if (activeSplitBy === "line") {
      return lines.map((line, i) => {
        const isIgnored = checkIgnore(line);
        const partClass = isIgnored ? textClassName : `prox-part ${textClassName}`.trim();
        return (
          <Fragment key={`line-${i}`}>
            <span aria-hidden="true" className={partClass} style={{ ...getStyles(isIgnored), whiteSpace: "nowrap" }}>
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
            <span key={`word-wrapper-${lineIdx}-${wordIdx}`} style={{ display: "inline-block", whiteSpace: "nowrap" }}>
              {[...word].map((char, charIdx) => {
                const isIgnored = checkIgnore(char);
                const partClass = isIgnored ? textClassName : `prox-part ${textClassName}`.trim();
                return (
                  <span 
                    aria-hidden="true" 
                    key={`char-${charIdx}`} 
                    className={partClass} 
                    style={{ ...getStyles(isIgnored) }}
                  >
                    {char}
                  </span>
                );
              })}
              {wordIdx < words.length - 1 && (
                <span aria-hidden="true" className={textClassName} style={{ ...getStyles(true), whiteSpace: "pre" }}>
                  {" "}
                </span>
              )}
            </span>
          ))}
          {lineIdx < lines.length - 1 && <div style={{ width: "100%", height: 0 }} />}
        </Fragment>
      );
    });
  },[text, activeSplitBy, textClassName, clipFix, ignoreText]);

  return (
    <Proximity selector=".prox-part" className={className} {...proximityProps}>
      <div aria-label={text} role="img" style={containerStyle}>
        {renderedContent}
      </div>
    </Proximity>
  );
};