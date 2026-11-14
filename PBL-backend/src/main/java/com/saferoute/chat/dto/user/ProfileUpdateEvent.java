package com.saferoute.chat.dto.user;

import java.time.LocalDateTime;

public class ProfileUpdateEvent {

    private String userId;
    private String name;
    private String email;
    private String avatar;
    private String statusMessage;
    private Boolean online;
    private String publicKey;
    private LocalDateTime timestamp;

    public ProfileUpdateEvent() {}

    public ProfileUpdateEvent(String userId, String name, String email, String avatar, String statusMessage, Boolean online, LocalDateTime timestamp) {
        this(userId, name, email, avatar, statusMessage, online, null, timestamp);
    }

    public ProfileUpdateEvent(String userId, String name, String email, String avatar, String statusMessage, Boolean online, String publicKey, LocalDateTime timestamp) {
        this.userId = userId;
        this.name = name;
        this.email = email;
        this.avatar = avatar;
        this.statusMessage = statusMessage;
        this.online = online;
        this.publicKey = publicKey;
        this.timestamp = timestamp != null ? timestamp : LocalDateTime.now();
    }

    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getAvatar() {
        return avatar;
    }

    public void setAvatar(String avatar) {
        this.avatar = avatar;
    }

    public String getStatusMessage() {
        return statusMessage;
    }

    public void setStatusMessage(String statusMessage) {
        this.statusMessage = statusMessage;
    }

    public Boolean getOnline() {
        return online;
    }

    public void setOnline(Boolean online) {
        this.online = online;
    }

    public String getPublicKey() {
        return publicKey;
    }

    public void setPublicKey(String publicKey) {
        this.publicKey = publicKey;
    }

    public LocalDateTime getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(LocalDateTime timestamp) {
        this.timestamp = timestamp;
    }
}
