package com.saferoute.chat.entity;

import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.CompoundIndexes;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Document(collection = "messages")
@CompoundIndexes({
    @CompoundIndex(name = "conv_timestamp_idx", def = "{'conversationId': 1, 'timestamp': 1}"),
    @CompoundIndex(name = "conv_unread_idx", def = "{'conversationId': 1, 'receiverId': 1, 'read': 1}")
})
public class Message {

    @Id
    private String id;

    @Indexed
    private String conversationId;

    @Indexed
    private String senderId;

    @Indexed
    private String receiverId;

    private String ciphertext;

    private String nonce;

    private String algorithm = "AES-256-GCM";

    private Integer encryptionVersion = 1;

    @CreatedDate
    private LocalDateTime timestamp = LocalDateTime.now();

    private Boolean read = false;

    public Message() {}

    public Message(String id, String conversationId, String senderId, String receiverId, String ciphertext, String nonce, String algorithm, Integer encryptionVersion, LocalDateTime timestamp, Boolean read) {
        this.id = id;
        this.conversationId = conversationId;
        this.senderId = senderId;
        this.receiverId = receiverId;
        this.ciphertext = ciphertext;
        this.nonce = nonce;
        this.algorithm = algorithm != null ? algorithm : "AES-256-GCM";
        this.encryptionVersion = encryptionVersion != null ? encryptionVersion : 1;
        this.timestamp = timestamp != null ? timestamp : LocalDateTime.now();
        this.read = read != null ? read : false;
    }

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private String id;
        private String conversationId;
        private String senderId;
        private String receiverId;
        private String ciphertext;
        private String nonce;
        private String algorithm = "AES-256-GCM";
        private Integer encryptionVersion = 1;
        private LocalDateTime timestamp = LocalDateTime.now();
        private Boolean read = false;

        public Builder id(String id) { this.id = id; return this; }
        public Builder conversationId(String conversationId) { this.conversationId = conversationId; return this; }
        public Builder senderId(String senderId) { this.senderId = senderId; return this; }
        public Builder receiverId(String receiverId) { this.receiverId = receiverId; return this; }
        public Builder ciphertext(String ciphertext) { this.ciphertext = ciphertext; return this; }
        public Builder nonce(String nonce) { this.nonce = nonce; return this; }
        public Builder algorithm(String algorithm) { this.algorithm = algorithm; return this; }
        public Builder encryptionVersion(Integer encryptionVersion) { this.encryptionVersion = encryptionVersion; return this; }
        public Builder timestamp(LocalDateTime timestamp) { this.timestamp = timestamp; return this; }
        public Builder read(Boolean read) { this.read = read; return this; }

        public Message build() {
            return new Message(id, conversationId, senderId, receiverId, ciphertext, nonce, algorithm, encryptionVersion, timestamp, read);
        }
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getConversationId() { return conversationId; }
    public void setConversationId(String conversationId) { this.conversationId = conversationId; }

    public String getSenderId() { return senderId; }
    public void setSenderId(String senderId) { this.senderId = senderId; }

    public String getReceiverId() { return receiverId; }
    public void setReceiverId(String receiverId) { this.receiverId = receiverId; }

    public String getCiphertext() { return ciphertext; }
    public void setCiphertext(String ciphertext) { this.ciphertext = ciphertext; }

    public String getNonce() { return nonce; }
    public void setNonce(String nonce) { this.nonce = nonce; }

    public String getAlgorithm() { return algorithm; }
    public void setAlgorithm(String algorithm) { this.algorithm = algorithm; }

    public Integer getEncryptionVersion() { return encryptionVersion; }
    public void setEncryptionVersion(Integer encryptionVersion) { this.encryptionVersion = encryptionVersion; }

    public LocalDateTime getTimestamp() { return timestamp; }
    public void setTimestamp(LocalDateTime timestamp) { this.timestamp = timestamp; }

    public Boolean getRead() { return read; }
    public void setRead(Boolean read) { this.read = read; }
}
