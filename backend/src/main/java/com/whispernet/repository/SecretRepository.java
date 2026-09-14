package com.whispernet.repository;

import com.whispernet.model.SecretEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface SecretRepository extends JpaRepository<SecretEntity, String> {

    long deleteByExpiresAtLessThan(Long now);
}
