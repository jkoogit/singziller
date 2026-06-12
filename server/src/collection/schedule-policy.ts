export type CollectionSchedule = "weekly" | "monthly" | "mixed" | "paused";

export type SampleCollectionMetrics = {
  sampleDays: number;
  totalSampledRecords: number;
  changedRecords: number;
  newSongChangesDetected: number;
  parserFailureCount: number;
  blockingFailureCount: number;
};

export function decideCollectionSchedule(metrics: SampleCollectionMetrics): CollectionSchedule {
  if (metrics.blockingFailureCount > 0 || metrics.parserFailureCount > 0) {
    return "paused";
  }

  const changeRate = metrics.totalSampledRecords === 0 ? 0 : metrics.changedRecords / metrics.totalSampledRecords;

  if (metrics.newSongChangesDetected > 0 && changeRate < 0.01) {
    return "mixed";
  }
  if (changeRate >= 0.01) {
    return "weekly";
  }
  return "monthly";
}
