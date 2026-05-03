# @allstak/otel

Beta standalone AllStak OpenTelemetry exporter for OTLP JSON traces.

This package is independently installable and does not depend on another `@allstak/*` SDK at runtime.

```sh
npm install @allstak/otel@beta
```

```ts
import { AllStakOtelExporter } from "@allstak/otel";

const exporter = new AllStakOtelExporter({
  dsn: process.env.ALLSTAK_DSN,
  endpoint: "https://api.allstak.sa",
  serviceName: "checkout-api",
  release: process.env.RELEASE,
  environment: process.env.NODE_ENV,
});
```
