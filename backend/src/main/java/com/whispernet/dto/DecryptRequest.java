package com.whispernet.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.validation.constraints.NotBlank;

@JsonIgnoreProperties(ignoreUnknown = true)
public class DecryptRequest {

    @NotBlank(message = "Token is required")
    private String token;

    private String passphrase;

    public DecryptRequest() {
    }

    public DecryptRequest(String token, String passphrase) {
        this.token = token;
        this.passphrase = passphrase;
    }

    public String getToken() {
        return token;
    }

    public void setToken(String token) {
        this.token = token;
    }

    public String getPassphrase() {
        return passphrase;
    }

    public void setPassphrase(String passphrase) {
        this.passphrase = passphrase;
    }
}
