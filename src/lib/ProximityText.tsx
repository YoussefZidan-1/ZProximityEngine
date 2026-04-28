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
}

export const ProximityText: React.FC<ProximityTextProps> = ({
  text,
  splitBy = "letter",
  className = "",
  textClassName = "",
  fontFamily,
  lineHeight = 1.2,
  letterSpacing = 0,
  wordSpacing = 0.25,
  clipFix = "0.2em",
  ...proximityProps
}) => {
  const globalConfig = useProximityConfig();
  const actualFontFamily = fontFamily || globalConfig.defaultFont;

  const containerStyle = useMemo<CSSProperties>(() => {
    const base: CSSProperties = { 
      display: "flex", 
      fontFamily: actualFontFamily,
      lineHeight: lineHeight,
      letterSpacing: `${letterSpacing}em`,
      textAlign: "center",
      justifyContent: "center"
    };
    if (splitBy === "word") return { ...base, flexWrap: "wrap", columnGap: `${wordSpacing}em`, rowGap: "0.1em" };
    if (splitBy === "line") return { ...base, display: "block" };
    return { ...base, flexWrap: "wrap" };
  }, [splitBy, actualFontFamily, lineHeight, letterSpacing, wordSpacing]);

  const renderedContent = useMemo(() => {
    const itemStyle: CSSProperties = {
      display: "inline-block",
      userSelect: "none",
      willChange: "transform, filter, opacity",
      padding: clipFix,
      margin: clipFix ? `-${clipFix}` : "0",
    };

    const lines = text.split("\n");

    if (splitBy === "word") {
      return lines.map((line, lineIdx) => (
        <Fragment key={lineIdx}>
          {line.split(" ").map((word, i) => (
            <span key={i} aria-hidden="true" className={`prox-part ${textClassName}`} style={itemStyle}>{word}</span>
          ))}
          {lineIdx < lines.length - 1 && <div style={{ width: "100%" }} />}
        </Fragment>
      ));
    }

    if (splitBy === "line") {
      return lines.map((line, i) => (
        <Fragment key={i}>
          <span aria-hidden="true" className={`prox-part ${textClassName}`} style={itemStyle}>{line}</span>
          {i < lines.length - 1 && <br />}
        </Fragment>
      ));
    }

    return [...text].map((char, i) => {
      if (char === "\n") {
        return <div key={i} style={{ width: "100%", height: 0 }} />;
      }
      return (
        <span 
          aria-hidden="true" 
          key={i} 
          className={`prox-part ${textClassName}`} 
          style={{ ...itemStyle, whiteSpace: char === " " ? "pre" : "normal" }}
        >
          {char}
        </span>
      );
    });

  }, [text, splitBy, textClassName, clipFix]);

  return (
    <Proximity selector=".prox-part" className={className} {...proximityProps}>
      <div aria-label={text} role="img" style={containerStyle}>
        {renderedContent}
      </div>
    </Proximity>
  );
};