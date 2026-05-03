const DEFAULT_HOST = 'https://api.allstak.sa';

export interface AllStakOtelExporterConfig {
  apiKey: string;
  host?: string;
  serviceName?: string;
  environment?: string;
  release?: string;
}

type ExportCallback = (result: { code: number; error?: Error }) => void;

export class AllStakOtelExporter {
  private endpoint: string;

  constructor(private config: AllStakOtelExporterConfig) {
    this.endpoint = `${(config.host || DEFAULT_HOST).replace(/\/$/, '')}/ingest/v1/otel/v1/traces`;
  }

  export(spans: unknown[], callback?: ExportCallback): void {
    void this.send(spans)
      .then(() => callback?.({ code: 0 }))
      .catch((error) => callback?.({ code: 1, error: error instanceof Error ? error : new Error(String(error)) }));
  }

  async shutdown(): Promise<void> {}
  async forceFlush(): Promise<void> {}

  private async send(spans: unknown[]): Promise<void> {
    const response = await fetch(this.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-AllStak-Key': this.config.apiKey,
      },
      body: JSON.stringify(toOtlpJson(spans, this.config)),
    });
    if (!response.ok) throw new Error(`AllStak OTLP export failed: HTTP ${response.status}`);
  }
}

export function toOtlpJson(spans: unknown[], config: AllStakOtelExporterConfig): unknown {
  return {
    resourceSpans: [{
      resource: {
        attributes: [
          attr('service.name', config.serviceName),
          attr('deployment.environment.name', config.environment),
          attr('service.version', config.release),
        ].filter(Boolean),
      },
      scopeSpans: [{
        scope: { name: '@allstak/otel' },
        spans: spans.map(toOtlpSpan),
      }],
    }],
  };
}

function toOtlpSpan(span: unknown): Record<string, unknown> {
  const item = span as Record<string, unknown>;
  const context = typeof item.spanContext === 'function' ? item.spanContext() as Record<string, string> : {};
  const start = Array.isArray(item.startTime) ? hrToNano(item.startTime as [number, number]) : Date.now() * 1_000_000;
  const end = Array.isArray(item.endTime) ? hrToNano(item.endTime as [number, number]) : Date.now() * 1_000_000;
  const status = item.status && typeof item.status === 'object' ? item.status as Record<string, unknown> : {};
  return {
    traceId: str(context.traceId),
    spanId: str(context.spanId),
    parentSpanId: str(item.parentSpanId),
    name: str(item.name) || 'otel.span',
    startTimeUnixNano: String(start),
    endTimeUnixNano: String(end),
    attributes: Object.entries((item.attributes as Record<string, unknown>) || {})
      .map(([key, value]) => attr(key, String(value)))
      .filter(Boolean),
    status: {
      code: status.code === 2 ? 'STATUS_CODE_ERROR' : 'STATUS_CODE_OK',
      message: str(status.message),
    },
  };
}

function attr(key: string, value?: string): { key: string; value: { stringValue: string } } | null {
  return value ? { key, value: { stringValue: value } } : null;
}

function str(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function hrToNano(value: [number, number]): number {
  return value[0] * 1_000_000_000 + value[1];
}
