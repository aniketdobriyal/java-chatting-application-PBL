package com.saferoute.chat.dto.message;

import com.saferoute.chat.entity.Message;

import java.time.LocalDateTime;

public class MessageResponse {

    private String id;
    private String conversationId;
    private String senderId;
    private String receiverId;
    private String ciphertext;
    private String nonce;
    private String algorithm;
    private Integer encryptionVersion;
    private LocalDateTime timestamp;
    private Boolean read;

    public MessageResponse() {}

    public MessageResponse(String id, String conversationId, String senderId, String receiverId, String ciphertext, String nonce, String algorithm, Integer encryptionVersion, LocalDateTime timestamp, Boolean read) {
        this.id = id;
        this.conversationId = conversationId;
        this.senderId = senderId;
        this.receiverId = receiverId;
        this.ciphertext = ciphertext;
        this.nonce = nonce;
        this.algorithm = algorithm;
        this.encryptionVersion = encryptionVersion;
        this.timestamp = timestamp;
        this.read = read;
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
        private LocalDateTime timestamp;
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

        public MessageResponse build() {
            return new MessageResponse(id, conversationId, senderId, receiverId, ciphertext, nonce, algorithm, encryptionVersion, timestamp, read);
        }
    }

    public static MessageResponse fromEntity(Message message) {
        if (message == null) return null;
        return MessageResponse.builder()
                .id(message.getId())
                .conversationId(message.getConversationId())
                .senderId(message.getSenderId())
                .receiverId(message.getReceiverId())
                .ciphertext(message.getCiphertext())
                .nonce(message.getNonce())
                .algorithm(message.getAlgorithm() != null ? message.getAlgorithm() : "AES-256-GCM")
                .encryptionVersion(message.getEncryptionVersion() != null ? message.getEncryptionVersion() : 1)
                .timestamp(message.getTimestamp())
                .read(message.getRead() != null ? message.getRead() : false)
                .build();
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
