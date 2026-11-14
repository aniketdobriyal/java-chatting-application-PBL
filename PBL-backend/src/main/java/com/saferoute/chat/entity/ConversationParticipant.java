package com.saferoute.chat.entity;

import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Document(collection = "conversation_participants")
@CompoundIndex(name = "conv_user_idx", def = "{'conversationId': 1, 'userId': 1}", unique = true)
public class ConversationParticipant {

    @Id
    private String id;

    @Indexed
    private String conversationId;

    @Indexed
    private String userId;

    @CreatedDate
    private LocalDateTime joinedAt = LocalDateTime.now();

    public ConversationParticipant() {}

    public ConversationParticipant(String id, String conversationId, String userId, LocalDateTime joinedAt) {
        this.id = id;
        this.conversationId = conversationId;
        this.userId = userId;
        this.joinedAt = joinedAt != null ? joinedAt : LocalDateTime.now();
    }

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private String id;
        private String conversationId;
        private String userId;
        private LocalDateTime joinedAt = LocalDateTime.now();

        public Builder id(String id) { this.id = id; return this; }
        public Builder conversationId(String conversationId) { this.conversationId = conversationId; return this; }
        public Builder userId(String userId) { this.userId = userId; return this; }
        public Builder joinedAt(LocalDateTime joinedAt) { this.joinedAt = joinedAt; return this; }

        public ConversationParticipant build() {
            return new ConversationParticipant(id, conversationId, userId, joinedAt);
        }
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getConversationId() { return conversationId; }
    public void setConversationId(String conversationId) { this.conversationId = conversationId; }

    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }

    public LocalDateTime getJoinedAt() { return joinedAt; }
    public void setJoinedAt(LocalDateTime joinedAt) { this.joinedAt = joinedAt; }
}
