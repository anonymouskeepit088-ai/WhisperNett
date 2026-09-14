package com.whispernet.service;

import com.whispernet.dto.*;
import com.whispernet.model.SecretEntity;
import com.whispernet.repository.SecretRepository;
import org.springframework.http.HttpStatus;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class SecretService {

    private final SecretRepository secretRepository;
    private final CryptoService cryptoService;

    public SecretService(SecretRepository secretRepository, CryptoService cryptoService) {
        this.secretRepository = secretRepository;
        this.cryptoService = cryptoService;
    }

    @Transactional
    public CreateSecretResponse createSecret(CreateSecretRequest request) {
        if (request.getSecret() == null || request.getSecret().trim().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Secret is required");
        }

        try {
            String id = cryptoService.generateId();
            String token = cryptoService.generateToken();
            String adminToken = cryptoService.generateAdminToken();

            byte[] salt = cryptoService.generateRandomBytes(32);
            String keyMaterial = (request.getPassphrase() != null && !request.getPassphrase().isEmpty())
                    ? token + request.getPassphrase()
                    : token;

            byte[] key = cryptoService.deriveKey(keyMaterial, salt);
            byte[] iv = cryptoService.generateRandomBytes(12);

            CryptoService.EncryptionResult result = cryptoService.encrypt(request.getSecret(), key, iv);

            long now = System.currentTimeMillis();
            long expiresAt = now + (request.getExpirationSeconds() * 1000L);

            SecretEntity entity = new SecretEntity(
                    id,
                    result.getEncrypted(),
                    cryptoService.toHex(iv),
                    cryptoService.toHex(salt),
                    result.getAuthTag(),
                    expiresAt,
                    request.getBurnOnRead(),
                    adminToken,
                    false,
                    now
            );

            secretRepository.save(entity);

            return new CreateSecretResponse(id, token, expiresAt, adminToken);
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to encrypt secret", e);
        }
    }

    @Transactional
    public SecretMetadataResponse getMetadata(String id) {
        SecretEntity entity = secretRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Not found"));

        if (entity.getExpiresAt() < System.currentTimeMillis()) {
            secretRepository.delete(entity);
            throw new ResponseStatusException(HttpStatus.GONE, "Expired");
        }

        return new SecretMetadataResponse(true, entity.getExpiresAt());
    }

    @Transactional
    public DecryptResponse decryptSecret(String id, DecryptRequest request) {
        SecretEntity entity = secretRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Secret not found or already destroyed"));

        if (entity.isPaused()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "This secret is currently paused by the sender");
        }

        if (entity.getExpiresAt() < System.currentTimeMillis()) {
            secretRepository.delete(entity);
            throw new ResponseStatusException(HttpStatus.GONE, "Secret expired");
        }

        try {
            String keyMaterial = (request.getPassphrase() != null && !request.getPassphrase().isEmpty())
                    ? request.getToken() + request.getPassphrase()
                    : request.getToken();

            byte[] salt = cryptoService.fromHex(entity.getSalt());
            byte[] key = cryptoService.deriveKey(keyMaterial, salt);
            byte[] iv = cryptoService.fromHex(entity.getIv());

            String plainText = cryptoService.decrypt(entity.getEncrypted(), entity.getAuthTag(), key, iv);

            if (entity.isBurnOnRead()) {
                secretRepository.delete(entity);
            }

            return new DecryptResponse(plainText);
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid token or passphrase");
        }
    }

    @Transactional
    public ManageResponse manageSecret(String id, ManageRequest request) {
        if (request.getAdminToken() == null || request.getAdminToken().trim().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Admin token required");
        }

        SecretEntity entity = secretRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Secret not found or expired"));

        if (!entity.getAdminToken().equals(request.getAdminToken())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Unauthorized");
        }

        String action = request.getAction() != null ? request.getAction().trim().toLowerCase() : "";
        switch (action) {
            case "pause":
                entity.setPaused(true);
                secretRepository.save(entity);
                return ManageResponse.pauseResult(true);
            case "resume":
                entity.setPaused(false);
                secretRepository.save(entity);
                return ManageResponse.pauseResult(false);
            case "delete":
                secretRepository.delete(entity);
                return ManageResponse.deleteResult();
            default:
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid action");
        }
    }

    @Scheduled(fixedRate = 60000)
    @Transactional
    public void cleanExpiredSecrets() {
        secretRepository.deleteByExpiresAtLessThan(System.currentTimeMillis());
    }
}
