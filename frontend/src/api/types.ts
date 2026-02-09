/** A song in the library */
export interface Song {
  id: number;
  title: string;
  artist: string | null;
  durationSeconds: number | null;
  fingerprintCount: number;
  indexedAt: string;
}

/** A single match result from the /api/match endpoint */
export interface MatchResult {
  songId: number;
  title: string;
  artist: string;
  confidence: number;
  alignedMatches: number;
  totalMatches: number;
  timeOffsetSeconds: number;
}

/** Response from the /api/match endpoint */
export interface MatchResponse {
  results: MatchResult[];
  queryFingerprints: number;
  queryDurationSeconds: number;
}

/** Response from the /api/stats endpoint */
export interface Stats {
  totalSongs: number;
  totalFingerprints: number;
  averageFingerprintsPerSong: number | null;
}
