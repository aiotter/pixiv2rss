import * as xml from "https://deno.land/x/jsx4xml@v0.1.4/mod.ts";
import { serve } from "https://deno.land/std@0.127.0/http/server.ts";
import { RssFeed } from "./mod.tsx";

async function handler(request: Request): Promise<Response> {
  const requestUrl = new URL(request.url);
  const pathNames = requestUrl.pathname.split("/").slice(1);

  // GET /users/{userId}
  if (request.method === "GET" && pathNames[0] === "users") {
    return await getPixivFeed(pathNames[1]);
  }

  if (["GET", "HEAD"].includes(request.method)) {
    return new Response(null, { status: 404, statusText: "Not Found" });
  } else {
    return new Response(null, { status: 501, statusText: "Not Implemented" });
  }
}

async function getPixivFeed(userId: string) {
  const body = xml.renderWithDeclaration(await RssFeed({ userId }));
  return new Response(body, {
    status: 200,
    headers: { "Content-type": "text/xml; charset=utf-8" },
  });
}

console.log(`HTTP webserver running. Access it at: http://localhost:8080/`);
await serve(handler, { port: 8080 });
