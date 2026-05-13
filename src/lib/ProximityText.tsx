import React, { Fragment, useMemo, CSSProperties } from "react";
import { Proximity, ProximityProps, useDeepMemo } from "./Proximity";
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
  dir?: 'ltr' | 'rtl' | 'auto';
}

const ARABIC_NON_CONNECTING_LEFT = /[اأإآدذرزوؤءة\s]/;
const ARABIC_DIACRITICS = /[\u064B-\u065F\u0670]/;
const LAM = "\u0644";
const ALEFS = /[\u0622\u0623\u0625\u0627]/;
const ZWJ = "\u200D";

const getArabicSegments = (word: string) => {
  const segments: string[] =[];
  const characters = Array.from(word);
  let i = 0;
  
  while (i < characters.length) {
    let char = characters[i];
    
    if (char === LAM && i + 1 < characters.length) {
      let nextIdx = i + 1;
      let tempDiacritics = "";
      while (nextIdx < characters.length && ARABIC_DIACRITICS.test(characters[nextIdx])) {
        tempDiacritics += characters[nextIdx];
        nextIdx++;
      }
      if (nextIdx < characters.length && ALEFS.test(characters[nextIdx])) {
        char += tempDiacritics + characters[nextIdx];
        i = nextIdx;
      }
    }
    
    if (ARABIC_DIACRITICS.test(char) && segments.length > 0) {
      segments[segments.length - 1] += char;
    } else {
      segments.push(char);
    }
    i++;
  }
  return segments;
};

const doesSegmentConnectLeft = (seg: string) => {
  const baseStr = seg.replace(ARABIC_DIACRITICS, '');
  if (!baseStr) return false;
  return !ARABIC_NON_CONNECTING_LEFT.test(baseStr[baseStr.length - 1]);
};

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
  dir = "auto",
  style,
  ...proximityProps
}) => {
  const globalConfig = useProximityConfig();
  const actualFontFamily = fontFamily || globalConfig.defaultFont;

  const activeSplitBy = proximityProps.config?.splitBy ?? splitBy;
  const memoizedIgnoreText = useDeepMemo(ignoreText);

  const computedDir = useMemo(() => {
    if (dir !== "auto") return dir;
    return /[\u0600-\u06FF]/.test(text) ? "rtl" : undefined;
  }, [dir, text]);

  const containerStyle = useMemo<CSSProperties>(() => {
    const base: CSSProperties = {
      display: "flex",
      fontFamily: actualFontFamily,
      lineHeight: lineHeight,
      letterSpacing: `${textLetterSpacing}em`,
      textAlign: textAlign,
      justifyContent: justifyContent,
      direction: computedDir,
    };
    if (activeSplitBy === "word") {
      return { ...base, flexWrap: "wrap", columnGap: `${wordSpacing}em`, rowGap: "0.1em" };
    }
    if (activeSplitBy === "line") {
      return { ...base, display: "block" };
    }
    return { ...base, flexWrap: "wrap", rowGap: "0.1em" };
  }, [activeSplitBy, actualFontFamily, lineHeight, textLetterSpacing, wordSpacing, textAlign, justifyContent, computedDir]);

  const renderedContent = useMemo(() => {
    const checkIgnore = (str: string): boolean => {
      if (!memoizedIgnoreText || !Array.isArray(memoizedIgnoreText)) return false;
      return memoizedIgnoreText.some((rule) => {
        if (typeof rule === "string") return rule === str;
        if (rule instanceof RegExp) return rule.test(str);
        return false;
      });
    };

    const spanStyle = (ignored: boolean, isArabic = false, connectsRight = false, connectsLeft = false): CSSProperties => {
      const cf = clipFix || "0px";
      
      let pTop = cf, pBottom = cf, pRight = cf, pLeft = cf;
      let mTop = `calc(-1 * ${cf})`, mBottom = `calc(-1 * ${cf})`;
      let mRight = `calc(-1 * ${cf})`, mLeft = `calc(-1 * ${cf})`;

      if (isArabic) {
        if (connectsRight) {
          pRight = "0px";
          mRight = "0px";
        }
        
        if (connectsLeft) {
          pLeft = "0px";
          mLeft = "-0.04em"; 
        }
      }

      return {
        display: "inline-block",
        userSelect: "none",
        padding: `${pTop} ${pRight} ${pBottom} ${pLeft}`,
        margin: `${mTop} ${mRight} ${mBottom} ${mLeft}`,
        textRendering: isArabic ? "optimizeLegibility" : undefined,
        letterSpacing: isArabic ? "normal" : undefined, 
      };
    };

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
                style={{
                  display: "inline-block",
                  userSelect: "none",
                  padding: clipFix ? clipFix : undefined,
                  margin: clipFix ? `calc(-1 * ${clipFix})` : undefined,
                  whiteSpace: "nowrap"
                }}
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
              style={{
                display: "inline-block",
                userSelect: "none",
                padding: clipFix ? clipFix : undefined,
                margin: clipFix ? `calc(-1 * ${clipFix})` : undefined,
                whiteSpace: "nowrap"
              }}
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
          {words.map((word, wordIdx) => {
            const segments = getArabicSegments(word);
            return (
              <Fragment key={`word-wrapper-${lineIdx}-${wordIdx}`}>
                <span style={{ display: "inline-flex", flexWrap: "nowrap" }}>
                  {segments.map((segment, charIdx) => {
                    const isIgnored = checkIgnore(segment);
                    const partClass = isIgnored
                      ? textClassName
                      : `prox-part ${textClassName}`.trim();
                    
                    let displayChar = segment;
                    const isArabic = /[\u0600-\u06FF]/.test(segment);
                    
                    let connectsRight = false;
                    let connectsLeft = false;
                    
                    if (isArabic) {
                      const prevSeg = charIdx > 0 ? segments[charIdx - 1] : null;
                      connectsRight = prevSeg ? doesSegmentConnectLeft(prevSeg) : false;
                      connectsLeft = charIdx < segments.length - 1 ? doesSegmentConnectLeft(segment) : false;
                      
                      if (connectsRight) displayChar = ZWJ + displayChar;
                      if (connectsLeft) displayChar = displayChar + ZWJ;
                    }

                    return (
                      <span
                        aria-hidden="true"
                        key={`char-${charIdx}`}
                        className={partClass}
                        style={spanStyle(isIgnored, isArabic, connectsRight, connectsLeft)}
                      >
                        {displayChar}
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
            );
          })}
          {lineIdx < lines.length - 1 && (
            <div style={{ width: "100%", height: 0 }} />
          )}
        </Fragment>
      );
    });
  }, [text, activeSplitBy, textClassName, clipFix, memoizedIgnoreText, wordSpacing]);

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