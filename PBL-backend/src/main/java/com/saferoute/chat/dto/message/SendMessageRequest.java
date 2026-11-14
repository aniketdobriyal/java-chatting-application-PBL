package com.saferoute.chat.dto.message;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class SendMessageRequest {

    @NotBlank(message = "Ciphertext payload is required")
    @Size(max = 65536, message = "Ciphertext payload cannot exceed 64KB")
    private String ciphertext;

    @NotBlank(message = "Nonce / IV is required for authenticated encryption")
    @Size(max = 256, message = "Invalid nonce length")
    private String nonce;

    private String algorithm = "AES-256-GCM";

    private Integer encryptionVersion = 1;

    private String receiverId;

    public SendMessageRequest() {}

    public SendMessageRequest(String ciphertext, String nonce, String algorithm, Integer encryptionVersion, String receiverId) {
        this.ciphertext = ciphertext;
        this.nonce = nonce;
        this.algorithm = algorithm != null ? algorithm : "AES-256-GCM";
        this.encryptionVersion = encryptionVersion != null ? encryptionVersion : 1;
        this.receiverId = receiverId;
    }

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private String ciphertext;
        private String nonce;
        private String algorithm = "AES-256-GCM";
        private Integer encryptionVersion = 1;
        private String receiverId;

        public Builder ciphertext(String ciphertext) { this.ciphertext = ciphertext; return this; }
        public Builder nonce(String nonce) { this.nonce = nonce; return this; }
        public Builder algorithm(String algorithm) { this.algorithm = algorithm; return this; }
        public Builder encryptionVersion(Integer encryptionVersion) { this.encryptionVersion = encryptionVersion; return this; }
        public Builder receiverId(String receiverId) { this.receiverId = receiverId; return this; }

        public SendMessageRequest build() {
            return new SendMessageRequest(ciphertext, nonce, algorithm, encryptionVersion, receiverId);
        }
    }

    public String getCiphertext() { return ciphertext; }
    public void setCiphertext(String ciphertext) { this.ciphertext = ciphertext; }

    public String getNonce() { return nonce; }
    public void setNonce(String nonce) { this.nonce = nonce; }

    public String getAlgorithm() { return algorithm; }
    public void setAlgorithm(String algorithm) { this.algorithm = algorithm; }

    public Integer getEncryptionVersion() { return encryptionVersion; }
    public void setEncryptionVersion(Integer encryptionVersion) { this.encryptionVersion = encryptionVersion; }

    public String getReceiverId() { return receiverId; }
    public void setReceiverId(String receiverId) { this.receiverId = receiverId; }

    public void setContent(String content) {
        if (this.ciphertext == null) {
            this.ciphertext = content;
        }
    }

    public String getContent() {
        return this.ciphertext;
    }
}
