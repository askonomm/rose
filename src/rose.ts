/**
 * This module contains the generic Rose instance implementation.
 *
 * @module
 */
import ShapeX, { type ShapeXInstance } from "@shapex/shapex";
import Router, { type Route } from "./router.ts";

export type RoseRoute = Route & {
  dispatch: string;
};

export type RoseRequest = {
  url: URL;
  method: string;
};

export type RoseResponse = {
  body?: unknown;
  status?: number;
  headers?: {
    [key: string]: string;
  };
};

export type RoseState = {
  http?: {
    request: RoseRequest;
    response?: RoseResponse;
  };
};

export type RosePlatformInstance = {
  init: <T extends RoseState>($: ShapeXInstance<T>) => void;
  serve: <T extends RoseState>(
    $: ShapeXInstance<T>,
    opts?: { port?: number }
  ) => void;
};

export type RoseInstance<T> = ShapeXInstance<T> & {
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

export default function Rose<T extends RoseState>(
  platformInstance: RosePlatformInstance,
  state: T
): RoseInstance<T> {
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
