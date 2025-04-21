/**
 * This module contains the Deno runtime implementation of the Rose framework.
 *
 * @module
 */
import type { ShapeXInstance } from "@shapex/shapex";
import type { RoseOpts, RoseResponse, RoseState } from "../rose.ts";

const init = <T extends RoseState>($: ShapeXInstance<T>): void => {
  $.subscribe("http.request", (state, req?: Request) => {
    // No request, nothing to do
    if (!req) {
      return { state };
    }

    return {
      state: {
        ...state,
        http: {
          request: {
            url: new URL(req.url),
            method: req.method,
          },
        },
      },
    };
  });

  $.subscribe("http.response.plain", (state, data?: RoseResponse) => {
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
              ...data?.headers,
            },
          },
        },
      },
    };
  });

  $.subscribe("http.response.json", (state, data?: RoseResponse) => {
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
              ...data?.headers,
            },
          },
        },
      },
    };
  });
};

const serve = <T extends RoseState>(
  $: ShapeXInstance<T>,
  opts?: RoseOpts
): void => {
  Deno.serve({ port: opts?.port ?? 3000 }, (req) => {
    $.dispatch("http.request", req);

    const response = $.state().http?.response;

    // If a response is set, return it
    if (response) {
      return new Response(response.body as BodyInit | null, {
        status: response.status,
        headers: response.headers,
      });
    }

    // Otherwise, return a 404 response
    return new Response("Not found.", {
      status: 404,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
      },
    });
  });
};

export default {
  init,
  serve,
};
