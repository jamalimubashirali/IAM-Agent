package com.enterprise.iam.config;

import io.micrometer.observation.ObservationRegistry;
import org.springframework.ai.document.MetadataMode;
import org.springframework.ai.openai.OpenAiEmbeddingModel;
import org.springframework.ai.openai.OpenAiEmbeddingOptions;
import org.springframework.ai.openai.api.OpenAiApi;
import org.springframework.ai.retry.RetryUtils;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;

/**
 * Explicitly wires the {@link OpenAiEmbeddingModel} to OpenRouter instead of
 * letting Spring AI's autoconfiguration inherit the top-level
 * {@code spring.ai.openai.base-url} (which points at Azure AI Foundry for chat).
 *
 * <p>In Spring AI M6 the per-model {@code spring.ai.openai.embedding.base-url}
 * property is silently ignored when a root {@code spring.ai.openai.base-url} is
 * also present. Defining an explicit {@code @Bean} is the reliable workaround.
 *
 * <p>All values are resolved from {@code application.yml}, which in turn reads
 * from environment variables.  The resolution chain for every field is:
 * <pre>
 *   env var  →  application.yml default  →  @Value fallback
 * </pre>
 * Nothing is hardcoded here — the strings after {@code :} in each
 * {@code @Value} expression are last-resort safe defaults that prevent a
 * NullPointerException if a property is somehow missing from the environment.
 */
@Configuration
public class EmbeddingModelConfig {

    /**
     * Resolved from {@code spring.ai.openai.embedding.base-url} in application.yml,
     * which reads {@code $\{OPENROUTER_EMBEDDING_BASE_URL\}}.
     */
    @Value("${spring.ai.openai.embedding.base-url:https://openrouter.ai/api}")
    private String baseUrl;

    /**
     * Resolved from {@code spring.ai.openai.embedding.api-key} in application.yml,
     * which reads {@code $\{OPENROUTER_API_KEY\}}.
     */
    @Value("${spring.ai.openai.embedding.api-key:placeholder}")
    private String apiKey;

    /**
     * Resolved from {@code spring.ai.openai.embedding.options.model} in application.yml,
     * which reads {@code $\{OPENROUTER_EMBEDDING_MODEL\}}.
     */
    @Value("${spring.ai.openai.embedding.options.model:nvidia/llama-nemotron-embed-vl-1b-v2:free}")
    private String model;

    /**
     * Resolved from {@code spring.ai.vectorstore.pgvector.dimensions} in application.yml,
     * which reads {@code $\{EMBEDDING_DIMENSIONS\}}.
     */
    @Value("${spring.ai.vectorstore.pgvector.dimensions:1536}")
    private int dimensions;

    @Bean
    @Primary
    public OpenAiEmbeddingModel embeddingModel() {
        // Build a dedicated OpenAiApi that points exclusively at OpenRouter.
        // The fields above are populated from application.yml, not hardcoded here.
        OpenAiApi openRouterApi = OpenAiApi.builder()
                .baseUrl(baseUrl)
                .apiKey(apiKey)
                .build();

        OpenAiEmbeddingOptions options = OpenAiEmbeddingOptions.builder()
                .model(model)
                .dimensions(dimensions)
                .build();

        return new OpenAiEmbeddingModel(
                openRouterApi,
                MetadataMode.EMBED,
                options,
                RetryUtils.DEFAULT_RETRY_TEMPLATE,
                ObservationRegistry.NOOP
        );
    }
}
