/**
 * This module contains the Node runtime implementation of the Rose framework.
 *
 * @module
 */
import type { ShapeXInstance } from "@shapex/shapex";
import type {
  RoseOpts,
  RoseState,
  RosePlatformInstance,
  RoseResponseBase,
  RoseRequestBase,
  RoseInstance,
} from "../rose.ts";
import http, { type IncomingMessage, type ServerResponse } from "node:http";
import { Buffer } from "node:buffer";
import Bootstrap from "../rose.ts";

export type NodeRequest = RoseRequestBase & {
  body?: null | string | object | Buffer;
};

export type NodeResponse = RoseResponseBase & {
  body?: null | string | object | Buffer;
};

const init = <T extends RoseState<"node">>($: ShapeXInstance<T>): void => {
  $.subscribe("set-http.request.body", (state, body?: Buffer) => {
    return {
      state: {
        ...state,
        http: {
          ...state.http,
          request: {
            ...state.http?.request,
            body,
          },
        },
      },
    };
  });

  $.subscribe("http.request", (state, req?: IncomingMessage) => {
    // No request, nothing to do
    if (!req) {
      return { state };
    }

    const bodyChunks: Buffer[] = [];

    req.on("data", (chunk: Buffer) => {
      bodyChunks.push(chunk);
    });

    req.on("end", () => {
      $.dispatch("set-http.request.body", Buffer.concat(bodyChunks));
    });

    return {
      state: {
        ...state,
        http: {
          request: {
            url: new URL(req.url ?? "", `http://${req.headers.host}`),
            method: req.method,
          },
        },
      },
    };
  });

  $.subscribe("http.response.plain", (state, data?: NodeResponse) => {
    return {
      state: {
        ...state,
        http: {
          ...state.http,
          response: {
            body: data?.body ?? "",
            status: data?.status ?? 200,
            headers: {
              "Content-Type": "text/plain",
            },
          },
        },
      },
    };
  });

  $.subscribe("http.response.json", (state, data?: NodeResponse) => {
    return {
      state: {
        ...state,
        http: {
          ...state.http,
          response: {
            body: data?.body ? JSON.stringify(data.body) : "{}",
            status: data?.status ?? 200,
            headers: {
              "Content-Type": "application/json",
            },
          },
        },
      },
    };
  });
};

const serve = <T extends RoseState<"node">>(
  $: ShapeXInstance<T>,
  opts?: RoseOpts
): void => {
  const server = http.createServer(
    (req: IncomingMessage, res: ServerResponse) => {
      $.dispatch("http.request", req);

      const response = $.state().http?.response;

      // If a response is set, return it
      if (response) {
        res.writeHead(response.status ?? 200, response.headers);
        res.end(response.body);

        return;
      }

      // Otherwise, return a 404 response
      res.writeHead(404, {
        "Content-Type": "text/plain",
      });

      res.end("Not found.");
    }
  );

  server.listen(opts?.port ?? 3000, () => {
    console.log(`Listening on http://0.0.0.0:${opts?.port ?? 3000}`);
  });
};

const runtime = {
  init,
  serve,
} as RosePlatformInstance<"node">;

export default function Rose<T extends RoseState<"node"> = RoseState<"node">>(
  state: T = {} as T
): RoseInstance<T> {
  return Bootstrap<"node", T>(runtime as RosePlatformInstance<"node">, state);
}

export { runtime };
