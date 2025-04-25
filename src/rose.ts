import ShapeX, { type ShapeXInstance } from "@shapex/shapex";
import Router, { type Route } from "./router.ts";
import type { DenoRequest, DenoResponse } from "./runtime/deno.ts";
import type { NodeRequest, NodeResponse } from "./runtime/node.ts";

export type RoseRoute = Route & {
  dispatch: string;
};

export type RoseRequestBase = {
  url: URL;
  method: string;
};

export type RoseRequest<R extends RuntimeType = "deno"> = R extends "deno"
  ? DenoRequest
  : NodeRequest;

export type RoseResponseBase = {
  status?: number;
  headers?: {
    [key: string]: string;
  };
};

export type RoseResponse<R extends RuntimeType = "deno"> = R extends "deno"
  ? DenoResponse
  : NodeResponse;

export type RoseState<R extends RuntimeType = "deno"> = {
  http?: {
    request: RoseRequest<R>;
    response?: RoseResponse<R>;
  };
};

/**
 * Type of runtime platform supported by Rose. Either 'deno' or 'node'.
 */
export type RuntimeType = "deno" | "node";

/**
 * Platform instance interface for Rose runtimes.
 */
export type RosePlatformInstance<R extends RuntimeType> = {
  init: <T extends RoseState<R>>($: ShapeXInstance<T>) => void;
  serve: <T extends RoseState<R>>(
    $: ShapeXInstance<T>,
    opts?: { port?: number }
  ) => void;
};

/**
 * Rose instance with HTTP route methods and ShapeX instance methods.
 */
export type RoseInstance<T extends RoseState<RuntimeType>> =
  ShapeXInstance<T> & {
    serve: (opts?: RoseOpts) => void;
    get: (path: string, dispatch: string) => void;
    post: (path: string, dispatch: string) => void;
    put: (path: string, dispatch: string) => void;
    delete: (path: string, dispatch: string) => void;
    patch: (path: string, dispatch: string) => void;
    options: (path: string, dispatch: string) => void;
    head: (path: string, dispatch: string) => void;
    trace: (path: string, dispatch: string) => void;
    connect: (path: string, dispatch: string) => void;
  };

export type RoseOpts = {
  port?: number;
};

/**
 * Creates a Rose instance with the given runtime platform.
 */
export default function Bootstrap<
  R extends RuntimeType,
  T extends RoseState<R> = RoseState<R>
>(platformInstance: RosePlatformInstance<R>, state: T): RoseInstance<T> {
  const $ = ShapeX<T>(state);
  const routes = [] as RoseRoute[];

  $.subscribe("$.http.request", (state) => {
    // No HTTP state, nothing to do
    if (!state.http) return { state };

    const route = Router.route(
      routes,
      state.http?.request.url.pathname,
      state.http?.request.method
    );

    // No matching route found, set response to null
    if (!route) {
      return {
        state,
        http: {
          ...state.http,
          response: null,
        },
      };
    }

    // Route found, dispatch the route
    return {
      state,
      dispatch: {
        to: route.dispatch,
        with: Router.params(route, state.http?.request.url.pathname),
      },
    };
  });

  platformInstance.init($);

  // Create get routes
  const _get = (path: string, dispatch: string) => {
    routes.push({
      path,
      method: "GET",
      dispatch,
    });
  };

  const _post = (path: string, dispatch: string) => {
    routes.push({
      path,
      method: "POST",
      dispatch,
    });
  };

  const _put = (path: string, dispatch: string) => {
    routes.push({
      path,
      method: "PUT",
      dispatch,
    });
  };

  const _delete = (path: string, dispatch: string) => {
    routes.push({
      path,
      method: "DELETE",
      dispatch,
    });
  };

  const _patch = (path: string, dispatch: string) => {
    routes.push({
      path,
      method: "PATCH",
      dispatch,
    });
  };

  const _options = (path: string, dispatch: string) => {
    routes.push({
      path,
      method: "OPTIONS",
      dispatch,
    });
  };

  const _head = (path: string, dispatch: string) => {
    routes.push({
      path,
      method: "HEAD",
      dispatch,
    });
  };

  const _trace = (path: string, dispatch: string) => {
    routes.push({
      path,
      method: "TRACE",
      dispatch,
    });
  };

  const _connect = (path: string, dispatch: string) => {
    routes.push({
      path,
      method: "CONNECT",
      dispatch,
    });
  };

  // Start HTTP server
  const _serve = (opts?: RoseOpts) => {
    platformInstance.serve($, opts);
  };

  return {
    serve: _serve,
    get: _get,
    post: _post,
    put: _put,
    delete: _delete,
    patch: _patch,
    options: _options,
    head: _head,
    trace: _trace,
    connect: _connect,
    ...$,
  };
}
