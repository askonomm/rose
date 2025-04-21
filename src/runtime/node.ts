/**
 * This module contains the Node runtime implementation of the Rose framework.
 *
 * @module
 */
import type { ShapeXInstance } from "@shapex/shapex";
import type { RoseOpts, RoseState } from "../rose.ts";
import http, { type IncomingMessage, type ServerResponse } from "node:http";

const init = <T extends RoseState>($: ShapeXInstance<T>): void => {
  $.subscribe("http.request", (state, req?: IncomingMessage) => {
    // No request, nothing to do
    if (!req) {
      return { state };
    }

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

  $.subscribe(
    "http.response.plain",
    (state, data?: { body?: unknown; status?: number }) => {
      return {
        state: {
          ...state,
          http: {
            ...state.http,
            response: {
              body: data?.body ?? "",
              status: data?.status ?? 200,
              headers: {
                "Content-Type": "text/plain; charset=utf-8",
              },
            },
          },
        },
      };
    }
  );

  $.subscribe(
    "http.response.json",
    (state, data?: { body: unknown; status?: number }) => {
      return {
        state: {
          ...state,
          http: {
            ...state.http,
            response: {
              body: data?.body,
              status: data?.status ?? 200,
              headers: {
                "Content-Type": "application/json; charset=utf-8",
              },
            },
          },
        },
      };
    }
  );
};

const serve = <T extends RoseState>(
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
        "Content-Type": "text/plain; charset=utf-8",
      });

      res.end("Not found.");
    }
  );

  server.listen(opts?.port ?? 3000, () => {
    console.log(`Listening on http://0.0.0.0:${opts?.port ?? 3000}`);
  });
};

export default {
  init,
  serve,
};
