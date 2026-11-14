package com.saferoute.chat.dto.conversation;

public class CreateConversationRequest {

    private String recipientId;
    private String userId;

    public CreateConversationRequest() {}

    public CreateConversationRequest(String recipientId, String userId) {
        this.recipientId = recipientId;
        this.userId = userId;
    }

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private String recipientId;
        private String userId;

        public Builder recipientId(String recipientId) { this.recipientId = recipientId; return this; }
        public Builder userId(String userId) { this.userId = userId; return this; }

        public CreateConversationRequest build() {
            return new CreateConversationRequest(recipientId, userId);
        }
    }

    public String getRecipientId() { return recipientId; }
    public void setRecipientId(String recipientId) { this.recipientId = recipientId; }

    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }

    public String getTargetUserId() {
        return recipientId != null ? recipientId : userId;
    }
}
