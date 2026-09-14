package com.whispernet.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class SecretControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    @DisplayName("Complete Lifecycle: Create secret -> check metadata -> decrypt -> verify burnOnRead")
    void testCompleteSecretLifecycle() throws Exception {
        // 1. Create Secret
        String createPayload = """
            {
                "secret": "MySuperSecretValue123",
                "expiration": "3600",
                "passphrase": "testpassphrase",
                "burnOnRead": true
            }
            """;

        MvcResult createResult = mockMvc.perform(post("/api/secrets")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(createPayload))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").exists())
                .andExpect(jsonPath("$.token").exists())
                .andExpect(jsonPath("$.adminToken").exists())
                .andReturn();

        JsonNode createNode = objectMapper.readTree(createResult.getResponse().getContentAsString());
        String id = createNode.get("id").asText();
        String token = createNode.get("token").asText();

        // 2. Metadata check
        mockMvc.perform(get("/api/secrets/" + id))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.exists").value(true));

        // 3. Decrypt Secret
        String decryptPayload = String.format("""
            {
                "token": "%s",
                "passphrase": "testpassphrase"
            }
            """, token);

        MvcResult decryptResult = mockMvc.perform(post("/api/secrets/" + id + "/decrypt")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(decryptPayload))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.secret").value("MySuperSecretValue123"))
                .andReturn();

        // 4. Since burnOnRead is true, subsequent metadata or decrypt should return 404
        mockMvc.perform(get("/api/secrets/" + id))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("Manage Secret: Pause and Resume secret decryption")
    void testPauseAndResume() throws Exception {
        // 1. Create Secret
        String createPayload = """
            {
                "secret": "PauseTestSecret",
                "expiration": "3600",
                "burnOnRead": false
            }
            """;

        MvcResult createResult = mockMvc.perform(post("/api/secrets")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(createPayload))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode createNode = objectMapper.readTree(createResult.getResponse().getContentAsString());
        String id = createNode.get("id").asText();
        String token = createNode.get("token").asText();
        String adminToken = createNode.get("adminToken").asText();

        // 2. Pause secret
        String pausePayload = String.format("""
            {
                "adminToken": "%s",
                "action": "pause"
            }
            """, adminToken);

        mockMvc.perform(post("/api/secrets/" + id + "/manage")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(pausePayload))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.isPaused").value(true));

        // 3. Attempt to decrypt while paused -> Expect 403
        String decryptPayload = String.format("""
            {
                "token": "%s"
            }
            """, token);

        mockMvc.perform(post("/api/secrets/" + id + "/decrypt")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(decryptPayload))
                .andExpect(status().isForbidden());

        // 4. Resume secret
        String resumePayload = String.format("""
            {
                "adminToken": "%s",
                "action": "resume"
            }
            """, adminToken);

        mockMvc.perform(post("/api/secrets/" + id + "/manage")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(resumePayload))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.isPaused").value(false));

        // 5. Attempt decrypt again -> Expect 200
        mockMvc.perform(post("/api/secrets/" + id + "/decrypt")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(decryptPayload))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.secret").value("PauseTestSecret"));
    }
}
