/**
 * This module contains the Deno runtime implementation of the Rose framework.
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
import Bootstrap from "../rose.ts";

export type DenoRequest = RoseRequestBase & {
  body?: BodyInit | null;
};

export type DenoResponse = RoseResponseBase & {
  body?: BodyInit | null;
};

const init = <T extends RoseState<"deno">>($: ShapeXInstance<T>): void => {
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
            body: req.body,
          },
        },
      },
    };
  });

  $.subscribe("http.response.plain", (state, data?: DenoResponse) => {
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
              ...data?.headers,
            },
          },
        },
      },
    };
  });

  $.subscribe("http.response.json", (state, data?: DenoResponse) => {
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
              ...data?.headers,
            },
          },
        },
      },
    };
  });
};

const serve = <T extends RoseState<"deno">>(
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
        "Content-Type": "text/plain",
      },
    });
  });
};

const runtime: RosePlatformInstance<"deno"> = {
  init,
  serve,
};

export default function Rose<T extends RoseState<"deno"> = RoseState<"deno">>(
  state: T = {} as T
): RoseInstance<T> {
  return Bootstrap<"deno", T>(runtime as RosePlatformInstance<"deno">, state);
}

export { runtime };
