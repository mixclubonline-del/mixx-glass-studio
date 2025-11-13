/* Mixx Club Studio - C++ Bindings */

#ifndef MIXX_CORE_H
#define MIXX_CORE_H

#include <stdarg.h>
#include <stdbool.h>
#include <stdint.h>
#include <stdlib.h>

typedef struct MixxEngineConfig {
  uint32_t sample_rate;
  uint32_t buffer_size;
  uint16_t channels;
  uint16_t reserved;
} MixxEngineConfig;

typedef struct MixxEngineStats {
  uint64_t total_callbacks;
  double average_callback_ns;
  uint64_t xruns;
  uint64_t last_callback_ns;
  uint64_t uptime_ms;
} MixxEngineStats;

typedef struct MixxEngineMetric {
  uint64_t timestamp_ns;
  uint64_t callback_ns;
  uint32_t frames_processed;
  uint32_t xruns;
} MixxEngineMetric;

bool mixx_engine_init(const struct MixxEngineConfig *config);

bool mixx_engine_start(void);

bool mixx_engine_stop(void);

void mixx_engine_shutdown(void);

bool mixx_engine_get_stats(struct MixxEngineStats *out_stats);

bool mixx_engine_pop_metric(struct MixxEngineMetric *out_metric);

const char *mixx_engine_last_error(void);

#endif /* MIXX_CORE_H */
