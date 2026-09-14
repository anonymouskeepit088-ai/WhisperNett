package com.whispernet.dto;

public class SecretMetadataResponse {

    private boolean exists;
    private Long expiresAt;

    public SecretMetadataResponse() {
    }

    public SecretMetadataResponse(boolean exists, Long expiresAt) {
        this.exists = exists;
        this.expiresAt = expiresAt;
    }

    public boolean isExists() {
        return exists;
    }

    public void setExists(boolean exists) {
        this.exists = exists;
    }

    public Long getExpiresAt() {
        return expiresAt;
    }

    public void setExpiresAt(Long expiresAt) {
        this.expiresAt = expiresAt;
    }
}
