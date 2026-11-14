package com.saferoute.chat.service;

import com.saferoute.chat.dto.auth.AuthResponse;
import com.saferoute.chat.dto.auth.LoginRequest;
import com.saferoute.chat.dto.auth.RegisterRequest;
import com.saferoute.chat.dto.user.PresenceEvent;
import com.saferoute.chat.dto.user.UserResponse;
import com.saferoute.chat.entity.User;
import com.saferoute.chat.exception.BadRequestException;
import com.saferoute.chat.repository.UserRepository;
import com.saferoute.chat.security.CustomUserDetailsService;
import com.saferoute.chat.security.JwtService;
import com.saferoute.chat.security.LoginRateLimiter;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Lazy;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
public class AuthService {

    private static final Logger log = LoggerFactory.getLogger(AuthService.class);

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;
    private final CustomUserDetailsService userDetailsService;
    private final LoginRateLimiter rateLimiter;
    private final SimpMessagingTemplate messagingTemplate;

    public AuthService(UserRepository userRepository,
                       PasswordEncoder passwordEncoder,
                       JwtService jwtService,
                       AuthenticationManager authenticationManager,
                       CustomUserDetailsService userDetailsService,
                       LoginRateLimiter rateLimiter,
                       @Lazy SimpMessagingTemplate messagingTemplate) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.authenticationManager = authenticationManager;
        this.userDetailsService = userDetailsService;
        this.rateLimiter = rateLimiter;
        this.messagingTemplate = messagingTemplate;
    }

    public AuthResponse register(RegisterRequest request) {
        String normalizedEmail = request.getEmail().toLowerCase().trim();

        if (userRepository.existsByEmail(normalizedEmail)) {
            throw new BadRequestException("An account with this email address already exists.");
        }

        User user = User.builder()
                .name(request.getName().trim())
                .email(normalizedEmail)
                .password(passwordEncoder.encode(request.getPassword()))
                .avatar("https://api.dicebear.com/7.x/avataaars/svg?seed=" + encodeUrl(request.getName().trim()))
                .online(true)
                .statusMessage("Hey there! I am using Chat App.")
                .publicKey(request.getPublicKey() != null && !request.getPublicKey().isBlank() ? request.getPublicKey().trim() : null)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        User savedUser = userRepository.save(user);

        UserDetails userDetails = userDetailsService.loadUserByUsername(savedUser.getEmail());
        String token = jwtService.generateToken(userDetails);

        log.info("User registered successfully: userId={}", savedUser.getId());

        // Broadcast presence
        PresenceEvent presence = new PresenceEvent(
                savedUser.getId(),
                savedUser.getEmail(),
                true,
                savedUser.getStatusMessage(),
                LocalDateTime.now()
        );
        try {
            messagingTemplate.convertAndSend("/topic/presence", presence);
        } catch (Exception e) {
            log.warn("Failed to broadcast register presence: {}", e.getMessage());
        }

        return AuthResponse.builder()
                .token(token)
                .user(UserResponse.fromEntity(savedUser))
                .build();
    }

    public AuthResponse login(LoginRequest request) {
        String normalizedEmail = request.getEmail().toLowerCase().trim();

        if (rateLimiter.isBlocked(normalizedEmail)) {
            log.warn("Rate limit exceeded for login attempts: {}", normalizedEmail);
            throw new BadRequestException("Too many login attempts. Please wait 1 minute before trying again.");
        }

        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(normalizedEmail, request.getPassword())
            );
        } catch (BadCredentialsException e) {
            rateLimiter.recordFailedAttempt(normalizedEmail);
            throw new BadRequestException("Invalid email or password");
        }

        User user = userRepository.findByEmail(normalizedEmail)
                .orElseThrow(() -> {
                    rateLimiter.recordFailedAttempt(normalizedEmail);
                    return new BadRequestException("Invalid email or password");
                });

        rateLimiter.resetAttempts(normalizedEmail);

        user.setOnline(true);
        user.setUpdatedAt(LocalDateTime.now());
        userRepository.save(user);

        // Broadcast presence
        PresenceEvent presence = new PresenceEvent(
                user.getId(),
                user.getEmail(),
                true,
                user.getStatusMessage(),
                LocalDateTime.now()
        );
        try {
            messagingTemplate.convertAndSend("/topic/presence", presence);
        } catch (Exception e) {
            log.warn("Failed to broadcast login presence: {}", e.getMessage());
        }

        UserDetails userDetails = userDetailsService.loadUserByUsername(user.getEmail());
        String token = jwtService.generateToken(userDetails);

        log.info("User logged in successfully: userId={}", user.getId());

        return AuthResponse.builder()
                .token(token)
                .user(UserResponse.fromEntity(user))
                .build();
    }

    public void logout() {
        try {
            var auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth != null && auth.getName() != null) {
                String email = auth.getName();
                userRepository.findByEmail(email).ifPresent(user -> {
                    user.setOnline(false);
                    user.setUpdatedAt(LocalDateTime.now());
                    userRepository.save(user);

                    PresenceEvent presence = new PresenceEvent(
                            user.getId(),
                            user.getEmail(),
                            false,
                            user.getStatusMessage(),
                            LocalDateTime.now()
                    );
                    try {
                        messagingTemplate.convertAndSend("/topic/presence", presence);
                    } catch (Exception e) {
                        log.warn("Failed to broadcast logout presence: {}", e.getMessage());
                    }
                });
            }
        } catch (Exception e) {
            log.warn("Error during logout: {}", e.getMessage());
        }
    }

    private String encodeUrl(String value) {
        try {
            return java.net.URLEncoder.encode(value, java.nio.charset.StandardCharsets.UTF_8.name());
        } catch (Exception e) {
            return value;
        }
    }
}
