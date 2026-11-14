package com.saferoute.chat.dto.user;

public class UpdateStatusRequest {

    private Boolean online;
    private String statusMessage;

    public UpdateStatusRequest() {}

    public UpdateStatusRequest(Boolean online, String statusMessage) {
        this.online = online;
        this.statusMessage = statusMessage;
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
}
