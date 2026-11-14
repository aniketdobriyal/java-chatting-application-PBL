package com.saferoute.chat.security;

import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * In-memory rate limiter to protect against login brute-force attacks and credential stuffing.
 */
@Component
public class LoginRateLimiter {

    private static final int MAX_ATTEMPTS = 5;
    private static final long LOCKOUT_DURATION_MS = 60_000; // 1 minute window

    private static class AttemptRecord {
        int count;
        long lastAttemptTimestamp;

        AttemptRecord(int count, long timestamp) {
            this.count = count;
            this.lastAttemptTimestamp = timestamp;
        }
    }

    private final Map<String, AttemptRecord> attemptsMap = new ConcurrentHashMap<>();

    public boolean isBlocked(String key) {
        AttemptRecord record = attemptsMap.get(key);
        if (record == null) {
            return false;
        }
        long now = Instant.now().toEpochMilli();
        if (now - record.lastAttemptTimestamp > LOCKOUT_DURATION_MS) {
            attemptsMap.remove(key);
            return false;
        }
        return record.count >= MAX_ATTEMPTS;
    }

    public void recordFailedAttempt(String key) {
        long now = Instant.now().toEpochMilli();
        attemptsMap.compute(key, (k, record) -> {
            if (record == null || (now - record.lastAttemptTimestamp > LOCKOUT_DURATION_MS)) {
                return new AttemptRecord(1, now);
            }
            record.count++;
            record.lastAttemptTimestamp = now;
            return record;
        });
    }

    public void resetAttempts(String key) {
        attemptsMap.remove(key);
    }
}
