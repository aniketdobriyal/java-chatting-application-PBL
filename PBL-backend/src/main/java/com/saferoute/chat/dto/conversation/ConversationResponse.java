package com.saferoute.chat.dto.conversation;

import com.saferoute.chat.dto.message.MessageResponse;
import com.saferoute.chat.dto.user.UserResponse;

public class ConversationResponse {

    private String id;
    private UserResponse participant;
    private MessageResponse lastMessage;
    private long unreadCount;

    public ConversationResponse() {}

    public ConversationResponse(String id, UserResponse participant, MessageResponse lastMessage, long unreadCount) {
        this.id = id;
        this.participant = participant;
        this.lastMessage = lastMessage;
        this.unreadCount = unreadCount;
    }

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private String id;
        private UserResponse participant;
        private MessageResponse lastMessage;
        private long unreadCount;

        public Builder id(String id) { this.id = id; return this; }
        public Builder participant(UserResponse participant) { this.participant = participant; return this; }
        public Builder lastMessage(MessageResponse lastMessage) { this.lastMessage = lastMessage; return this; }
        public Builder unreadCount(long unreadCount) { this.unreadCount = unreadCount; return this; }

        public ConversationResponse build() {
            return new ConversationResponse(id, participant, lastMessage, unreadCount);
        }
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public UserResponse getParticipant() { return participant; }
    public void setParticipant(UserResponse participant) { this.participant = participant; }

    public MessageResponse getLastMessage() { return lastMessage; }
    public void setLastMessage(MessageResponse lastMessage) { this.lastMessage = lastMessage; }

    public long getUnreadCount() { return unreadCount; }
    public void setUnreadCount(long unreadCount) { this.unreadCount = unreadCount; }
}
