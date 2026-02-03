package com.example.stockmanager.auth;

import com.example.stockmanager.auth.dto.*;
import com.example.stockmanager.security.JwtConfig;
import com.example.stockmanager.user.*;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;

import static org.springframework.http.HttpStatus.*;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtConfig jwtConfig;
    private final JwtEncoder jwtEncoder;

    public void register(RegisterRequest req) {
        if (userRepository.existsByUsername(req.username())) {
            throw new ResponseStatusException(CONFLICT, "Username already exists");
        }

        User u = User.builder()
                .username(req.username())
                .passwordHash(passwordEncoder.encode(req.password()))
                .roles("ROLE_USER")
                .createdAt(Instant.now())
                .build();

        userRepository.save(u);
    }

    public String login(LoginRequest req) {
        var u = userRepository.findByUsername(req.username())
                .orElseThrow(() -> new ResponseStatusException(UNAUTHORIZED, "Invalid credentials"));

        if (!passwordEncoder.matches(req.password(), u.getPasswordHash())) {
            throw new ResponseStatusException(UNAUTHORIZED, "Invalid credentials");
        }

        Instant now = Instant.now();

        JwtClaimsSet claims = JwtClaimsSet.builder()
                .issuer(jwtConfig.issuer())
                .issuedAt(now)
                .expiresAt(jwtConfig.expiresAt(now))
                .subject(u.getUsername())
                .claim("roles", u.getRoles())
                .build();

        var params = JwtEncoderParameters.from(
                org.springframework.security.oauth2.jwt.JwsHeader
                        .with(org.springframework.security.oauth2.jose.jws.MacAlgorithm.HS256).build(),
                claims);

        return jwtEncoder.encode(params).getTokenValue();
    }
}
