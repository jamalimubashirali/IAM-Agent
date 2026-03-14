package com.enterprise.iam.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.jdbc.core.JdbcTemplate;

/**
 * Ensures the {@code ai_memory_store} pgvector table has the correct embedding
 * dimension before Spring AI's PgVectorStore tries to use it.
 *
 * <p>Background: Spring AI's {@code initialize-schema: true} only runs
 * {@code CREATE TABLE IF NOT EXISTS} — it will NOT alter an existing table
 * whose {@code vector(N)} column has the wrong dimension. If the table was
 * previously created with 1536 dims (text-embedding-ada-002) and we have now
 * switched to a 2048-dim model, every embedding call will throw a dimension
 * mismatch error.
 *
 * <p>This runner detects the mismatch at startup and drops+recreates the table
 * so Spring AI's subsequent {@code initialize-schema} run creates it fresh with
 * the correct dimension. Data loss is acceptable here — the memory store is a
 * cache of AI context, not business-critical data.
 */
@Configuration
@Slf4j
public class VectorStoreDimensionGuard {

    @Bean
    ApplicationRunner vectorStoreDimensionCheck(
            JdbcTemplate jdbc,
            @Value("${EMBEDDING_DIMENSIONS:2048}") int requiredDimensions) {

        return args -> {
            try {
                // Query the actual dimension stored in pg_attribute for the
                // embedding column.  atttypmod for vector(N) encodes N directly.
                Integer actualDimensions = jdbc.queryForObject(
                        """
                        SELECT atttypmod
                        FROM   pg_attribute
                        JOIN   pg_class ON pg_class.oid = pg_attribute.attrelid
                        WHERE  pg_class.relname = 'ai_memory_store'
                          AND  pg_attribute.attname = 'embedding'
                          AND  pg_attribute.attnum > 0
                        """,
                        Integer.class);

                if (actualDimensions == null) {
                    // Table doesn't exist yet — Spring AI will create it correctly.
                    log.info("VectorStoreDimensionGuard: ai_memory_store does not exist yet, skipping check.");
                    return;
                }

                if (actualDimensions != requiredDimensions) {
                    log.warn(
                        "VectorStoreDimensionGuard: ai_memory_store has dimension {} but {} is required. " +
                        "Dropping and recreating table (memory data will be lost).",
                        actualDimensions, requiredDimensions);

                    jdbc.execute("DROP TABLE IF EXISTS ai_memory_store CASCADE");
                    log.info("VectorStoreDimensionGuard: ai_memory_store dropped. " +
                             "Spring AI will recreate it with dimension {}.", requiredDimensions);
                } else {
                    log.info("VectorStoreDimensionGuard: ai_memory_store dimension {} is correct, no action needed.",
                             actualDimensions);
                }
            } catch (Exception e) {
                // Non-fatal — if the check fails we log and continue; Spring AI
                // will surface the mismatch error on first use instead.
                log.warn("VectorStoreDimensionGuard: dimension check failed ({}), continuing startup.", e.getMessage());
            }
        };
    }
}
