package com.saferoute.chat.dto.user;

import jakarta.validation.constraints.NotBlank;

public class UpdatePublicKeyRequest {

    @NotBlank(message = "Public key is required")
    private String publicKey;

    public UpdatePublicKeyRequest() {}

    public UpdatePublicKeyRequest(String publicKey) {
        this.publicKey = publicKey;
    }

    public String getPublicKey() { return publicKey; }
    public void setPublicKey(String publicKey) { this.publicKey = publicKey; }
}
