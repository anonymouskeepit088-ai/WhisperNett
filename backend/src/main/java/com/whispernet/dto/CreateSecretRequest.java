package com.whispernet.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.validation.constraints.NotBlank;

@JsonIgnoreProperties(ignoreUnknown = true)
public class CreateSecretRequest {

    @NotBlank(message = "Secret is required")
    private String secret;

    private Object expiration; // handles both String ("3600") and Number (3600)
    private String passphrase;
    private Boolean burnOnRead;

    public CreateSecretRequest() {
    }

    public CreateSecretRequest(String secret, Object expiration, String passphrase, Boolean burnOnRead) {
        this.secret = secret;
        this.expiration = expiration;
        this.passphrase = passphrase;
        this.burnOnRead = burnOnRead;
    }

    public String getSecret() {
        return secret;
    }

    public void setSecret(String secret) {
        this.secret = secret;
    }

    public Object getExpiration() {
        return expiration;
    }

    public void setExpiration(Object expiration) {
        this.expiration = expiration;
    }

    public long getExpirationSeconds() {
        if (expiration == null) {
            return 3600L;
        }
        try {
            return Long.parseLong(expiration.toString().trim());
        } catch (NumberFormatException e) {
            return 3600L;
        }
    }

    public String getPassphrase() {
        return passphrase;
    }

    public void setPassphrase(String passphrase) {
        this.passphrase = passphrase;
    }

    public Boolean getBurnOnRead() {
        return burnOnRead != null && burnOnRead;
    }

    public void setBurnOnRead(Boolean burnOnRead) {
        this.burnOnRead = burnOnRead;
    }
}
