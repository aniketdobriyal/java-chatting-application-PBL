package com.saferoute.chat.controller;

import org.bson.Document;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

@RestController
public class HealthController {

    private final MongoTemplate mongoTemplate;

    public HealthController(MongoTemplate mongoTemplate) {
        this.mongoTemplate = mongoTemplate;
    }

    @GetMapping("/")
    public ResponseEntity<Map<String, Object>> root() {
        return checkHealth();
    }

    @GetMapping("/api/health")
    public ResponseEntity<Map<String, Object>> health() {
        return checkHealth();
    }

    private ResponseEntity<Map<String, Object>> checkHealth() {
        Map<String, Object> status = new HashMap<>();
        status.put("status", "UP");
        status.put("service", "SafeRoute Chat Backend");

        try {
            mongoTemplate.getDb().runCommand(new Document("ping", 1));
            status.put("database", "CONNECTED");
            return ResponseEntity.ok(status);
        } catch (Exception e) {
            status.put("database", "ERROR: " + e.getMessage());
            return ResponseEntity.status(503).body(status);
        }
    }
}
