import type { RoseState } from "@shapex/rose";
import Rose from "@shapex/rose/runtime/deno";
import type { RouteParams } from "@shapex/rose/router";

// Define app state
type AppState = RoseState<"deno"> & {
  name: string | null;
};

// Create app instance with default state
const app = Rose<AppState>({
  name: null,
});

// Create routes that dispatch events
app.get("/hello/:who", "http.request.hello");

// Subscribe to events
app.subscribe(
  "http.request.hello",
  (state, params: RouteParams<{ who: string }>) => {
    return {
      state: {
        ...state,
        name: params.who,
      },
      dispatch: {
        to: "http.response.plain",
        with: {
          body: `Hello: ${params.who}`,
        },
      },
    };
  }
);

// Serve requests
app.serve({
  port: 3222,
});