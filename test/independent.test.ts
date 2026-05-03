import { describe, expect, it, vi } from 'vitest';
import { AllStakOtelExporter } from '../src/index';

describe('@allstak/otel standalone package', () => {
  it('exports OTLP JSON to dev without another AllStak SDK dependency', async () => {
    const fetchSpy = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal('fetch', fetchSpy);
    const exporter = new AllStakOtelExporter({
      apiKey: 'ask_dev_test',
      host: 'https://api.dev.allstak.sa',
      serviceName: 'otel-test',
      environment: 'development',
      release: 'tier1-test',
    });
    exporter.export([{
      name: 'GET /otel',
      spanContext: () => ({ traceId: '0'.repeat(32), spanId: '1'.repeat(16) }),
      startTime: [1, 0],
      endTime: [1, 10_000_000],
      attributes: { 'http.method': 'GET' },
      status: { code: 1 },
    }]);
    await vi.waitFor(() => expect(fetchSpy).toHaveBeenCalled());
    expect(fetchSpy.mock.calls[0][0]).toBe('https://api.dev.allstak.sa/ingest/v1/otel/v1/traces');
    const body = JSON.parse(fetchSpy.mock.calls[0][1].body);
    expect(body.resourceSpans[0].scopeSpans[0].spans[0].name).toBe('GET /otel');
  });
});
