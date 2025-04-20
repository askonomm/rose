# ShapeX Rose

A JavaScript/TypeScript web framework for the [Deno](https://deno.com) runtime built on top of [ShapeX](https://github.com/tryshapex/shapex) event-driven application framework.

**Note:** still an early release so be aware that there could be potential bugs, and yes, the idea is to support more runtimes in the future.

## Example application

```typescript
import Rose, { type RoseState } from "@shapex/rose";
import type { RouteParams } from "@shapex/rose/router";

// Define app state
type AppState = RoseState & {
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
        eventName: "http.response.plain",
        args: [`Hello: ${params.who}`],
      },
    };
  }
);

// Serve requests
app.serve({
  port: 3222,
});
```

## Installation

Rose is available via [JSR](https://jsr.io/@shapex/rose), currently only for the [Deno](https://deno.com) runtime.

## Documentation

Rose does away with the classical MVC pattern for web backends and instead encourages the use of events and subscriptions. The idea being that if everything is an event or a subscription listening to an event, then it's easier to reason about the complexity of your application as you can focus on just that, without getting lost in the sea of terminology and different abstraction patterns. It's all just action and reaction.

### State

Much like using [ShapeX]() on its own, at the core of your application is state. You start by initiating with some initial state, which is an intersection type of `RoseState`:

```typescript
import Rose, { type RoseState } from "@shapex/rose";

type AppState = RoseState & {
  name: string | null;
};

const app = Rose<AppState>({
  name: null,
});
```

In other words, some of the state will be created and managed by Rose itself, which is `RoseState`, and your state will be an addition to `RoseState`.

### Routes

Routes in Rose dispatch [ShapeX events](https://github.com/tryshapex/shapex?tab=readme-ov-file#events). Routes are created like so:

```typescript
app.get("/hello/:who", "http.request.hello");
```

Route events will automatically get `RouteParams` passed to them, so if you subscribe to route events, you can receive the route params like so:

```typescript
app.subscribe(
  "http.request.hello",
  (state, params: RouteParams<{ who: string }>) => {
    return {
      state: {
        ...state,
        name: params.who,
      },
      dispatch: {
        eventName: "http.response.plain",
        args: [`Hello: ${params.who}`],
      },
    };
  }
);
```

Notice the `RouteParams` type definition here, which supports generics so you can specify exactly what shape of data you expect to get. Other than that, all subscriptions are just like [ShapeX subscriptions](https://github.com/tryshapex/shapex?tab=readme-ov-file#subscriptions).

### Request information

Rose stores request information in the `http` state key, so to access request information you'd do something like this:

```typescript
app.subscribe("my-event", (state) => {
  // log pathname
  console.log(state.http?.request.url.pathname);

  return {};
});
```

To see what else is available in the `http` state, check out `RoseState` type.

### Built-in events

Rose comes with some built-in events.

#### `http.response.plain`

Return a plain response with the `http.response.plain` event like so:

```typescript
app.subscribe("my-event", (state) => {
  return {
    dispatch: {
      eventName: "http.response.plain",
      args: ["Hello, World"],
    },
  };
});
```

Additionally you can also pass along the status code, like so:

```typescript
app.subscribe("my-event", (state) => {
  return {
    dispatch: {
      eventName: "http.response.plain",
      args: ["Hello, World", 200],
    },
  };
});
```

#### `http.response.json`

Return a JSON response with the `http.response.json` event like so:

```typescript
app.subscribe("my-event", (state) => {
  return {
    dispatch: {
      eventName: "http.response.json",
      args: [
        {
          hello: "world",
        },
      ],
    },
  };
});
```

Additionally you can also pass along the status code, like so:

```typescript
app.subscribe("my-event", (state) => {
  return {
    dispatch: {
      eventName: "http.response.plain",
      args: [
        {
          hello: "world",
        },
        200,
      ],
    },
  };
});
```
