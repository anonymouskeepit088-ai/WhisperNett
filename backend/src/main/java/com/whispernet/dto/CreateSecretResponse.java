package com.whispernet.dto;

public class CreateSecretResponse {

    private String id;
    private String token;
    private Long expiresAt;
    private String adminToken;

    public CreateSecretResponse() {
    }

    public CreateSecretResponse(String id, String token, Long expiresAt, String adminToken) {
        this.id = id;
        this.token = token;
        this.expiresAt = expiresAt;
        this.adminToken = adminToken;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getToken() {
        return token;
    }

    public void setToken(String token) {
        this.token = token;
    }

    public Long getExpiresAt() {
        return expiresAt;
    }

    public void setExpiresAt(Long expiresAt) {
        this.expiresAt = expiresAt;
    }

    public String getAdminToken() {
        return adminToken;
    }

    public void setAdminToken(String adminToken) {
        this.adminToken = adminToken;
    }
}
