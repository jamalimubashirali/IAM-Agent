package com.enterprise.iam.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;

import java.util.concurrent.Executor;

/**
 * Async thread pool configuration for background AI memory operations.
 *
 * <p>
 * Spring's default async executor uses a single unbounded thread per task via
 * {@code SimpleAsyncTaskExecutor} which creates a new thread for every call.
 * For memory write operations (Episodic, Semantic, Procedural) that may spike
 * under load,
 * a bounded pool prevents thread exhaustion.
 *
 * <p>
 * Sizing rationale:
 * <ul>
 * <li>Core pool (5): handles steady-state memory write throughput</li>
 * <li>Max pool (20): absorbs sudden bursts (e.g., batch user activity)</li>
 * <li>Queue (100): buffers requests during burst above max pool</li>
 * </ul>
 */
@Configuration
public class AsyncConfig {

    @Bean(name = "memoryWriteExecutor")
    public Executor memoryWriteExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(5);
        executor.setMaxPoolSize(20);
        executor.setQueueCapacity(100);
        executor.setThreadNamePrefix("iam-memory-");
        executor.setWaitForTasksToCompleteOnShutdown(true);
        executor.setAwaitTerminationSeconds(30); // Drain queue gracefully on shutdown
        executor.initialize();
        return executor;
    }
}
