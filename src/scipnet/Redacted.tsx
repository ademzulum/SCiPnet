// Renders text, turning [[...]] into a redaction bar of similar length.
export default function Redacted({ text }: { text: string }) {
  return (
    <>
      {text.split(/\[\[(.+?)\]\]/).map((part, i) =>
        i % 2 ? (
          <span key={i} className="redact" title="Geschwärzt">
            {'█'.repeat(Math.max(4, part.length))}
          </span>
        ) : (
          part
        ),
      )}
    </>
  );
}
