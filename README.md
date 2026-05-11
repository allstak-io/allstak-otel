# @allstak/otel

**Send OpenTelemetry traces to AllStak with a single exporter.**

[![npm version](https://img.shields.io/npm/v/@allstak/otel.svg)](https://www.npmjs.com/package/@allstak/otel)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-ready-blue.svg)](https://www.typescriptlang.org/)

> **Beta** -- actively evolving. API may change between minor versions.

AllStak OpenTelemetry exporter -- converts OTel spans to OTLP JSON and sends them to the AllStak ingest API. Zero `@allstak/*` runtime dependencies.

## Installation

```sh
npm install @allstak/otel @opentelemetry/sdk-node @opentelemetry/auto-instrumentations-node
```

## Quick Start

```ts
import { NodeSDK } from "@opentelemetry/sdk-node";
import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";
import { AllStakOtelExporter } from "@allstak/otel";

const sdk = new NodeSDK({
  traceExporter: new AllStakOtelExporter({
    apiKey: process.env.ALLSTAK_API_KEY!,
    serviceName: "my-api",
    environment: process.env.NODE_ENV ?? "development",
    release: process.env.RELEASE,
  }),
  instrumentations: [getNodeAutoInstrumentations()],
});

sdk.start();
```

Traces appear in your [AllStak dashboard](https://app.allstak.sa) within seconds.

## Configuration

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `apiKey` | `string` | *required* | AllStak project API key |
| `host` | `string` | `https://api.allstak.sa` | Ingest API base URL |
| `serviceName` | `string` | `""` | Logical service name for filtering |
| `environment` | `string` | `""` | Environment tag (`production`, `staging`, etc.) |
| `release` | `string` | `""` | Release/version identifier |

## How It Works

The exporter implements the OpenTelemetry `SpanExporter` interface:

1. Your OTel SDK batches finished spans and calls `export(spans)`.
2. `AllStakOtelExporter` converts each span to OTLP JSON format.
3. The payload is POSTed to `{host}/ingest/v1/otel/v1/traces`.
4. Errors are reported via the OTel callback -- the exporter never throws.

## Fail-Open

Network failures and HTTP errors are caught and reported to the OTel SDK via the export callback. Your application is never affected by exporter failures.

## Standalone Usage

If you already have OTel spans as objects, you can convert them directly:

```ts
import { toOtlpJson } from "@allstak/otel";

const payload = toOtlpJson(spans, {
  apiKey: "...",
  serviceName: "my-api",
  environment: "production",
});
```

## License

MIT
