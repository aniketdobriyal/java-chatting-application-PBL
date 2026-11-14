package com.saferoute.chat.dto.user;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class UpdateProfileRequest {

    @NotBlank(message = "Name cannot be empty")
    @Size(min = 2, max = 50, message = "Name must be between 2 and 50 characters")
    private String name;

    private String avatar;

    @Size(max = 200, message = "Status message cannot exceed 200 characters")
    private String statusMessage;

    private Boolean online;

    public UpdateProfileRequest() {}

    public UpdateProfileRequest(String name, String avatar, String statusMessage, Boolean online) {
        this.name = name;
        this.avatar = avatar;
        this.statusMessage = statusMessage;
        this.online = online;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
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
}
