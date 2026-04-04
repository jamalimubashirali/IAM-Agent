package com.enterprise.iam.service;

import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.search.MeterNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class TelemetryService {

    private final MeterRegistry meterRegistry;

    /**
     * Retrieves the current value of a specific metric.
     * 
     * @param metricName the Name of the metric (e.g., "system.cpu.usage",
     *                   "jvm.memory.used")
     * @return a map containing the metric value or an error message
     */
    public Map<String, Object> getMetric(String metricName) {
        Map<String, Object> result = new HashMap<>();
        try {
            double value = meterRegistry.get(metricName).meter().measure().iterator().next().getValue();
            result.put("metric", metricName);
            result.put("value", value);
            result.put("status", "SUCCESS");
        } catch (MeterNotFoundException e) {
            log.warn("Metric not found: {}", metricName);
            result.put("metric", metricName);
            result.put("error", "Metric not found");
            result.put("status", "ERROR");
        } catch (Exception e) {
            log.error("Error retrieving metric {}", metricName, e);
            result.put("metric", metricName);
            result.put("error", e.getMessage());
            result.put("status", "ERROR");
        }
        return result;
    }

    /**
     * Summarizes key system health metrics.
     * 
     * @return a map of key metrics
     */
    public Map<String, Object> getSystemHealthSummary() {
        Map<String, Object> summary = new HashMap<>();
        try {
            summary.put("cpu_usage", meterRegistry.get("system.cpu.usage").gauge().value());
        } catch (Exception e) {
            summary.put("cpu_usage", "unavailable");
        }

        try {
            summary.put("jvm_memory_used",
                    meterRegistry.get("jvm.memory.used").meter().measure().iterator().next().getValue());
        } catch (Exception e) {
            summary.put("jvm_memory_used", "unavailable");
        }

        try {
            summary.put("process_uptime", meterRegistry.get("process.uptime").timeGauge().value());
        } catch (Exception e) {
            summary.put("process_uptime", "unavailable");
        }

        return summary;
    }
}
