import { Fragment } from "react";
function Inline({ text }: { text: string }) {
  return (
    <>
      {text
        .split(/(\*\*[^*]+\*\*)/g)
        .map((part, i) =>
          part.startsWith("**") ? (
            <strong key={i}>{part.slice(2, -2)}</strong>
          ) : (
            <Fragment key={i}>{part}</Fragment>
          ),
        )}
    </>
  );
}
export function Markdown({ text }: { text: string }) {
  return (
    <div className="markdown">
      {text.split(/\n\s*\n/).map((paragraph, i) => {
        const lines = paragraph.split("\n");
        if (lines.every((l) => /^[-*] /.test(l)))
          return (
            <ul key={i}>
              {lines.map((line, j) => (
                <li key={j}>
                  <Inline text={line.slice(2)} />
                </li>
              ))}
            </ul>
          );
        return (
          <p key={i}>
            {lines.map((line, j) => (
              <Fragment key={j}>
                {j > 0 && <br />}
                <Inline text={line} />
              </Fragment>
            ))}
          </p>
        );
      })}
    </div>
  );
}
