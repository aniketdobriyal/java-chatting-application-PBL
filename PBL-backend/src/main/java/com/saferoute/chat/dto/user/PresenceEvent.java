package com.saferoute.chat.dto.user;

import java.time.LocalDateTime;

public class PresenceEvent {

    private String userId;
    private String email;
    private Boolean online;
    private String statusMessage;
    private LocalDateTime timestamp;

    public PresenceEvent() {}

    public PresenceEvent(String userId, String email, Boolean online, String statusMessage, LocalDateTime timestamp) {
        this.userId = userId;
        this.email = email;
        this.online = online;
        this.statusMessage = statusMessage;
        this.timestamp = timestamp != null ? timestamp : LocalDateTime.now();
    }

    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public Boolean getOnline() {
        return online;
    }

    public void setOnline(Boolean online) {
        this.online = online;
    }

    public String getStatusMessage() {
        return statusMessage;
    }

    public void setStatusMessage(String statusMessage) {
        this.statusMessage = statusMessage;
    }

    public LocalDateTime getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(LocalDateTime timestamp) {
        this.timestamp = timestamp;
    }
}
