# Rose

A JavaScript/TypeScript web framework for the [Deno](https://deno.com) runtime built on top of [ShapeX](https://github.com/askonomm/shapex) event-driven application framework.

**Note:** not ready for production use, and yes, the idea is to support more runtimes in the future. There's also no real docs yet, so you have to refer to the code for now.

## Example application

```typescript
import Rose, { type RoseState } from "@shapex/rose";

// Define app state
type AppState = RoseState & {
  counter: number;
};

// Create app instance
const app = Rose<AppState>({
  counter: 1,
});

// Create routes that dispatch events
app.get("/", "http.request.home");

// Subscribe to events
app.subscribe("http.request.home", (state) => {
  return {
    state,
    dispatch: {
      eventName: "http.response.plain",
      args: [`Current count is: ${state.counter}`],
    },
  };
});

// Serve requests
app.serve({
  port: 3222,
});
```
