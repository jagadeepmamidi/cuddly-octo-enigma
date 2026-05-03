import type { Request as ExpressRequest, Response as ExpressResponse } from "express";

type HttpMethod = "GET" | "POST" | "PATCH" | "DELETE";

type RouteHandler = (
  request: Request,
  context: { params: Promise<any> }
) => Promise<Response> | Response;

type RouteModule = Partial<Record<HttpMethod, RouteHandler>>;

function toWebHeaders(headers: ExpressRequest["headers"]) {
  const webHeaders = new Headers();
  for (const [key, value] of Object.entries(headers)) {
    if (Array.isArray(value)) {
      value.forEach((item) => webHeaders.append(key, item));
    } else if (value !== undefined) {
      webHeaders.set(key, value);
    }
  }
  return webHeaders;
}

function readBody(req: ExpressRequest): Promise<Buffer | undefined> {
  if (req.method === "GET" || req.method === "HEAD") {
    return Promise.resolve(undefined);
  }

  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (chunk) => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)));
    req.on("end", () => resolve(chunks.length ? Buffer.concat(chunks) : undefined));
    req.on("error", reject);
  });
}

function buildUrl(req: ExpressRequest) {
  const protocol =
    req.headers["x-forwarded-proto"]?.toString().split(",")[0] ||
    req.protocol ||
    "http";
  const host = req.headers.host ?? `localhost:${process.env.PORT ?? 4000}`;
  return `${protocol}://${host}${req.originalUrl}`;
}

async function sendWebResponse(webResponse: Response, res: ExpressResponse) {
  res.status(webResponse.status);
  webResponse.headers.forEach((value, key) => {
    res.setHeader(key, value);
  });
  const body = Buffer.from(await webResponse.arrayBuffer());
  res.send(body);
}

export function adaptRoute(module: RouteModule) {
  return async (req: ExpressRequest, res: ExpressResponse) => {
    const method = req.method.toUpperCase() as HttpMethod;
    const handler = module[method];

    if (!handler) {
      res.status(405).json({
        ok: false,
        error: { code: "method_not_allowed", message: "HTTP method is not allowed." }
      });
      return;
    }

    const body = await readBody(req);
    const request = new Request(buildUrl(req), {
      method,
      headers: toWebHeaders(req.headers),
      body
    });

    const response = await handler(request, { params: Promise.resolve(req.params) });
    await sendWebResponse(response, res);
  };
}
