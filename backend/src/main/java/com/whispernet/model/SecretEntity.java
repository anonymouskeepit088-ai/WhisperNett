package com.whispernet.model;

import jakarta.persistence.*;

@Entity
@Table(name = "secrets", indexes = {
    @Index(name = "idx_secrets_expires_at", columnList = "expiresAt")
})
public class SecretEntity {

    @Id
    @Column(nullable = false, length = 64)
    private String id;

    @Lob
    @Column(nullable = false, columnDefinition = "TEXT")
    private String encrypted;

    @Column(nullable = false, length = 64)
    private String iv;

    @Column(nullable = false, length = 128)
    private String salt;

    @Column(nullable = false, length = 64)
    private String authTag;

    @Column(nullable = false)
    private Long expiresAt;

    @Column(nullable = false)
    private boolean burnOnRead;

    @Column(nullable = false, length = 64)
    private String adminToken;

    @Column(nullable = false)
    private boolean isPaused;

    @Column(nullable = false)
    private Long createdAt;

    public SecretEntity() {
    }

    public SecretEntity(String id, String encrypted, String iv, String salt, String authTag,
                        Long expiresAt, boolean burnOnRead, String adminToken, boolean isPaused, Long createdAt) {
        this.id = id;
        this.encrypted = encrypted;
        this.iv = iv;
        this.salt = salt;
        this.authTag = authTag;
        this.expiresAt = expiresAt;
        this.burnOnRead = burnOnRead;
        this.adminToken = adminToken;
        this.isPaused = isPaused;
        this.createdAt = createdAt;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getEncrypted() {
        return encrypted;
    }

    public void setEncrypted(String encrypted) {
        this.encrypted = encrypted;
    }

    public String getIv() {
        return iv;
    }

    public void setIv(String iv) {
        this.iv = iv;
    }

    public String getSalt() {
        return salt;
    }

    public void setSalt(String salt) {
        this.salt = salt;
    }

    public String getAuthTag() {
        return authTag;
    }

    public void setAuthTag(String authTag) {
        this.authTag = authTag;
    }

    public Long getExpiresAt() {
        return expiresAt;
    }

    public void setExpiresAt(Long expiresAt) {
        this.expiresAt = expiresAt;
    }

    public boolean isBurnOnRead() {
        return burnOnRead;
    }

    public void setBurnOnRead(boolean burnOnRead) {
        this.burnOnRead = burnOnRead;
    }

    public String getAdminToken() {
        return adminToken;
    }

    public void setAdminToken(String adminToken) {
        this.adminToken = adminToken;
    }

    public boolean isPaused() {
        return isPaused;
    }

    public void setPaused(boolean paused) {
        isPaused = paused;
    }

    public Long getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Long createdAt) {
        this.createdAt = createdAt;
    }
}
