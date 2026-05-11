type JsonLdData = Record<string, unknown> | Array<Record<string, unknown>>;

/**
 * Server-rendered JSON-LD <script> tag. The escape on `<` prevents an attacker-
 * controlled value from breaking out of the script via `</script>` injection.
 */
export function JsonLd({ data }: { data: JsonLdData }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, '\\u003c'),
      }}
    />
  );
}
