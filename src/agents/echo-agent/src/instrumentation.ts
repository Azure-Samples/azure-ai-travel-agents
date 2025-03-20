import { logs, NodeSDK } from "@opentelemetry/sdk-node";
import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";
import {
  LoggerProvider,
  LogRecord,
  SimpleLogRecordProcessor,
} from "@opentelemetry/sdk-logs";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-grpc";
import { OTLPMetricExporter } from "@opentelemetry/exporter-metrics-otlp-grpc";
import { OTLPLogExporter } from "@opentelemetry/exporter-logs-otlp-grpc";
import { PeriodicExportingMetricReader } from "@opentelemetry/sdk-metrics";
import { resourceFromAttributes } from "@opentelemetry/resources";
import {
  ATTR_SERVICE_NAME,
  ATTR_SERVICE_VERSION,
} from "@opentelemetry/semantic-conventions";
import { metrics, trace } from "@opentelemetry/api";
import { OTLPExporterConfigBase } from "@opentelemetry/otlp-exporter-base";

const otlpEndpoint = process.env.OTLP_ENDPOINT || "http://localhost:4317";
const otlpHeaders = process.env.OTLP_HEADERS || "x-otlp-header=header-value";
const otlpServiceName = process.env.OTLP_SERVICE_NAME || "echo-agent";
const otlpServiceVersion = process.env.OTLP_SERVICE_VERSION || "1.0";

const otlpOptions = {
  url: otlpEndpoint,
  headers: otlpHeaders.split(",").reduce((acc, header) => {
    const [key, value] = header.split("=");
    acc[key] = value;
    return acc;
  }, {} as Record<string, string>),
} as OTLPExporterConfigBase;

const resource = resourceFromAttributes({
  [ATTR_SERVICE_NAME]: otlpServiceName,
  [ATTR_SERVICE_VERSION]: otlpServiceVersion,
});

const sdk = new NodeSDK({
  resource,
  logRecordProcessor: new SimpleLogRecordProcessor(
    new OTLPLogExporter(otlpOptions)
  ),
  traceExporter: new OTLPTraceExporter(otlpOptions),
  metricReader: new PeriodicExportingMetricReader({
    exporter: new OTLPMetricExporter(otlpOptions),
  }),
  instrumentations: [getNodeAutoInstrumentations()],
});

sdk.start();

const loggerProvider = new LoggerProvider({ resource });
const logExporter = new OTLPLogExporter(otlpOptions);
loggerProvider.addLogRecordProcessor(new SimpleLogRecordProcessor(logExporter));

const tracer = trace.getTracer(otlpServiceName, otlpServiceVersion);
const meter = metrics.getMeter(otlpServiceName, otlpServiceVersion);

const logger = loggerProvider.getLogger(otlpServiceName);

function log(
  message: string,
  attributes: Record<string, any> = {},
  level: string = "INFO"
) {
  logger.emit({
    severityText: level,
    body: message,
    attributes: {
      service: otlpServiceName,
      version: otlpServiceVersion,
      ...attributes,
    },
  });
}

export { tracer, meter, log };
