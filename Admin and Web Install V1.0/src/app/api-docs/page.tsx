import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default function ApiDocsPage() {
  const isDev = process.env.NEXT_PUBLIC_IS_DEVELOPMENT_MODE === "true";
  if (!isDev) redirect("/");

  return (
    <iframe
      src="/api/swagger-ui"
      title="API Documentation"
      style={{
        position:  "fixed",
        inset:     0,
        width:     "100%",
        height:    "100%",
        border:    "none",
        display:   "block",
        zIndex:    9999,
      }}
    />
  );
}
