// The fixture behind demo/composer.html and test/browser.mjs: the composer the
// way an app mounts it, with stub transports so the checks are deterministic.
import { createRoot } from "react-dom/client";
import { ArticleComposer } from "../src/react/index.js";

const params = new URLSearchParams(location.search);
const signedIn = params.get("anon") === null;
const published: unknown[] = [];
(window as unknown as { published: unknown[] }).published = published;

function Fixture() {
  return (
    <div style={{ maxWidth: 760, margin: "0 auto", padding: 16 }}>
      <ArticleComposer
        draftKey="demo:draft:new:u1"
        anonymousDraftKey="demo:draft:new:anon"
        signedIn={signedIn}
        signInHref="/sign-in"
        authorName="Ana"
        voice={{ transcribeUrl: "/api/transcribe" }}
        photos={(pick) => (
          <button
            type="button"
            className="wk-btn"
            onClick={() =>
              pick({
                alt: "A dam",
                src: "https://example.org/dam.jpg",
                credit: "Ann",
                license: "CC BY",
              })
            }
          >
            Use the dam photo
          </button>
        )}
        extraActions={
          <a className="wk-btn" href="/cancel">
            Cancel
          </a>
        }
        transport={{
          assist: async (req) => {
            await new Promise((r) => setTimeout(r, 60));
            if (/fail/i.test(req.instruction)) return null;
            if (req.mode === "draft")
              return {
                title: "Drafted title",
                body: `Drafted from: ${req.instruction}`,
              };
            return {
              title: `${req.title} (new)`,
              body: `${req.body} [${req.instruction}]`,
            };
          },
          publish: async (status, content) => {
            if (/boom/.test(content.body)) throw new Error("offline");
            if (/short/.test(content.body))
              return { problems: ["The article is too short."] };
            published.push({ status, ...content });
          },
        }}
      />
    </div>
  );
}

createRoot(document.getElementById("composer-fixture")!).render(<Fixture />);
