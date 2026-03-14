package com.enterprise.iam.ai.tools;

import com.enterprise.iam.service.TelemetryService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.tool.annotation.Tool;
import org.springframework.stereotype.Component;

import java.util.Map;

@Component
@RequiredArgsConstructor
@Slf4j
public class TelemetryTools {

    private final TelemetryService telemetryService;

    public record GetMetricRequest(String metricName) {
    }

    @Tool(description = "Queries a specific application telemetry metric by name (e.g., 'system.cpu.usage', 'jvm.memory.used'). Use this when you need specific performance details.")
    public Map<String, Object> getMetricTool(GetMetricRequest request) {
        log.info("AI invoked getMetricTool for metric: {}", request.metricName());
        return telemetryService.getMetric(request.metricName());
    }

    public record GetSystemHealthRequest() {
    }

    @Tool(description = "Retrieves a high-level summary of the system's health, including basic CPU usage, Memory usage, and Uptime. Use this to quickly assess the environment state.")
    public Map<String, Object> getSystemHealthSummaryTool(GetSystemHealthRequest request) {
        log.info("AI invoked getSystemHealthSummaryTool");
        return telemetryService.getSystemHealthSummary();
    }
}
