import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const isDev = process.env.NEXT_PUBLIC_IS_DEVELOPMENT_MODE === "true";
  if (!isDev) {
    return new NextResponse("Not found", { status: 404 });
  }

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>6amStudio API Docs</title>
  <meta name="robots" content="noindex, nofollow" />
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5.18.2/swagger-ui.css" />
  <style>
    * { box-sizing: border-box; }
    html, body { margin: 0; padding: 0; height: 100%; background: #fff; }

    /* ── Topbar ── */
    .swagger-ui .topbar {
      background-color: #1b1b1b;
      padding: 10px 16px;
    }
    .swagger-ui .topbar .download-url-wrapper { display: none; }
    .swagger-ui .topbar-wrapper { gap: 12px; }
    .swagger-ui .topbar-wrapper .link { display: none; }
    .swagger-ui .topbar-wrapper::before {
      content: "6amStudio  /  API Documentation";
      color: #fff;
      font-size: 15px;
      font-weight: 600;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      letter-spacing: -0.2px;
      white-space: nowrap;
    }

    /* Version badge */
    .swagger-ui .topbar-wrapper::after {
      content: "v1.0.0";
      color: rgba(255,255,255,0.55);
      font-size: 11px;
      font-family: monospace;
      background: rgba(255,255,255,0.08);
      border-radius: 999px;
      padding: 2px 10px;
      margin-left: auto;
    }
  </style>
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5.18.2/swagger-ui-bundle.js"></script>
  <script>
    window.onload = function () {
      SwaggerUIBundle({
        url: "/api/openapi.json",
        dom_id: "#swagger-ui",
        presets: [
          SwaggerUIBundle.presets.apis,
          SwaggerUIBundle.SwaggerUIStandalonePreset
        ],
        plugins: [SwaggerUIBundle.plugins.DownloadUrl],
        layout: "BaseLayout",
        deepLinking: true,
        displayRequestDuration: true,
        tryItOutEnabled: true,
        persistAuthorization: true,
        defaultModelsExpandDepth: 1,
        defaultModelExpandDepth: 1,
        docExpansion: "list",
      });
    };
  </script>
</body>
</html>`;

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
