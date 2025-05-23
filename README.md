<img src="https://github.com/user-attachments/assets/803506b1-759c-4142-bf75-141efa122641" width="75" height="75" />

# ShapeX Rosè

A JavaScript/TypeScript web framework for the [Deno](https://deno.com) and [Node](https://nodejs.org) runtime built on top of the [ShapeX](https://github.com/tryshapex/shapex) event-driven application framework.

## Example application

```typescript
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
```

## Installation

Rosè is available via [JSR](https://jsr.io/@shapex/rose).

## Documentation

Rosè does away with the classical MVC pattern for web backends and instead encourages the use of events and subscriptions. The idea being that if everything is an event or a subscription listening to an event, then it's easier to reason about the complexity of your application as you can focus on just that, without getting lost in the sea of terminology and different abstraction patterns. It's all just action and reaction.

### Platforms

Rosè works on both the [Deno](https://deno.com) and [Node](https://nodejs.org) runtimes with their own implementation abstraction.

**Deno example**:

```typescript
import type { RoseState } from "@shapex/rose";
import Rose from "@shapex/rose/runtime/deno";

// Define app state
type AppState = RoseState<"deno"> & {
  name: string | null;
};

// Create app instance with default state
const app = Rose<AppState>({
  name: null,
});
```

**Node.js example**:

```typescript
import type { RoseState } from "@shapex/rose";
import Rose from "@shapex/rose/runtime/node";

// Define app state
type AppState = RoseState<"node"> & {
  name: string | null;
};

// Create app instance with default state
const app = Rose<AppState>({
  name: null,
});
```

It really is as simple as just importing the right runtime.

### State

Much like using [ShapeX](https://github.com/tryshapex/shapex) on its own, at the core of your application is state. You start by initiating with some initial state, which is an intersection type of `RoseState`:

```typescript
import type { RoseState } from "@shapex/rose";
import Rose from "@shapex/rose/runtime/deno";

type AppState = RoseState<"deno"> & {
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
        to: "http.response.plain",
        with: {
          body: `Hello: ${params.who}`,
        },
      },
    };
  }
);
```

Notice the `RouteParams` type definition here, which supports generics so you can specify exactly what shape of data you expect to get. Other than that, all subscriptions are just like [ShapeX subscriptions](https://github.com/tryshapex/shapex?tab=readme-ov-file#subscriptions).

### Request information

Rosè stores request information in the `http` state key, so to access request information you'd do something like this:

```typescript
app.subscribe("my-event", (state) => {
  // log pathname
  console.log(state.http?.request.url.pathname);

  return {};
});
```

The `http.request` state consists of the following information:

```typescript
export type RoseRequest = {
  url: URL;
  method: string;
  body: unknown; // this differs based on runtime
};
```

**Note**: each runtime may also add additional information to the `RoseRequest`, which you will be able to see with the help of TypeScript LSP, or by checking the type definitions of each runtime.

### Built-in events

Rosè comes with some built-in events.

#### Responses

You can dispatch response events to return data to the client. All responses must conform to the `RoseResponse` type which looks like this:

```typescript
export type RoseResponse = {
  body?: unknown; // this differs based on runtime
  status?: number;
  headers?: {
    [key: string]: string;
  };
};
```

**Note**: each runtime may also add additional information to the `RoseResponse`, which you will be able to see with the help of TypeScript LSP, or by checking the type definitions of each runtime.

##### `http.response.plain`

Return a plain response with the `http.response.plain` event like so:

```typescript
app.subscribe("my-event", (state) => {
  return {
    dispatch: {
      to: "http.response.plain",
      with: {
        body: "Hello, World",
      },
    },
  };
});
```

##### `http.response.json`

Return a JSON response with the `http.response.json` event like so:

```typescript
app.subscribe("my-event", (state) => {
  return {
    dispatch: {
      to: "http.response.json",
      with: {
        body: {
          hello: "world",
        },
      },
    },
  };
});
```
