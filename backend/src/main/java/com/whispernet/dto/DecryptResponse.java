package com.whispernet.dto;

public class DecryptResponse {

    private String secret;

    public DecryptResponse() {
    }

    public DecryptResponse(String secret) {
        this.secret = secret;
    }

    public String getSecret() {
        return secret;
    }

    public void setSecret(String secret) {
        this.secret = secret;
    }
}
