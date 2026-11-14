package com.saferoute.chat.dto.user;

import com.saferoute.chat.entity.User;

public class UserResponse {

    private String id;
    private String name;
    private String email;
    private String avatar;
    private Boolean online;
    private String statusMessage;
    private String publicKey;

    public UserResponse() {}

    public UserResponse(String id, String name, String email, String avatar, Boolean online, String statusMessage, String publicKey) {
        this.id = id;
        this.name = name;
        this.email = email;
        this.avatar = avatar;
        this.online = online;
        this.statusMessage = statusMessage;
        this.publicKey = publicKey;
    }

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private String id;
        private String name;
        private String email;
        private String avatar;
        private Boolean online;
        private String statusMessage;
        private String publicKey;

        public Builder id(String id) { this.id = id; return this; }
        public Builder name(String name) { this.name = name; return this; }
        public Builder email(String email) { this.email = email; return this; }
        public Builder avatar(String avatar) { this.avatar = avatar; return this; }
        public Builder online(Boolean online) { this.online = online; return this; }
        public Builder statusMessage(String statusMessage) { this.statusMessage = statusMessage; return this; }
        public Builder publicKey(String publicKey) { this.publicKey = publicKey; return this; }

        public UserResponse build() {
            return new UserResponse(id, name, email, avatar, online, statusMessage, publicKey);
        }
    }

    public static UserResponse fromEntity(User user) {
        if (user == null) return null;
        return UserResponse.builder()
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .avatar(user.getAvatar())
                .online(user.getOnline() != null ? user.getOnline() : false)
                .statusMessage(user.getStatusMessage())
                .publicKey(user.getPublicKey())
                .build();
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getAvatar() { return avatar; }
    public void setAvatar(String avatar) { this.avatar = avatar; }

    public Boolean getOnline() { return online; }
    public void setOnline(Boolean online) { this.online = online; }

    public String getStatusMessage() { return statusMessage; }
    public void setStatusMessage(String statusMessage) { this.statusMessage = statusMessage; }

    public String getPublicKey() { return publicKey; }
    public void setPublicKey(String publicKey) { this.publicKey = publicKey; }
}
