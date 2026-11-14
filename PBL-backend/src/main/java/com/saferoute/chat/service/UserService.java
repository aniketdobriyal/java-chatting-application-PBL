package com.saferoute.chat.service;

import com.saferoute.chat.dto.user.PresenceEvent;
import com.saferoute.chat.dto.user.ProfileUpdateEvent;
import com.saferoute.chat.dto.user.UpdatePasswordRequest;
import com.saferoute.chat.dto.user.UpdateProfileRequest;
import com.saferoute.chat.dto.user.UpdateStatusRequest;
import com.saferoute.chat.dto.user.UserResponse;
import com.saferoute.chat.entity.User;
import com.saferoute.chat.exception.BadRequestException;
import com.saferoute.chat.exception.ResourceNotFoundException;
import com.saferoute.chat.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Lazy;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class UserService {

    private static final Logger log = LoggerFactory.getLogger(UserService.class);

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final SimpMessagingTemplate messagingTemplate;

    public UserService(UserRepository userRepository,
                       @Lazy PasswordEncoder passwordEncoder,
                       @Lazy SimpMessagingTemplate messagingTemplate) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.messagingTemplate = messagingTemplate;
    }

    public User getAuthenticatedUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Authenticated user not found"));
    }

    public UserResponse getCurrentUserProfile() {
        User currentUser = getAuthenticatedUser();
        return UserResponse.fromEntity(currentUser);
    }

    public UserResponse getUserById(String id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + id));
        return UserResponse.fromEntity(user);
    }

    public List<UserResponse> getAllUsers() {
        User currentUser = getAuthenticatedUser();
        return userRepository.findAllExcludingSelf(currentUser.getId())
                .stream()
                .map(UserResponse::fromEntity)
                .collect(Collectors.toList());
    }

    public List<UserResponse> searchUsers(String query) {
        if (query == null || query.trim().isEmpty()) {
            return getAllUsers();
        }
        User currentUser = getAuthenticatedUser();
        return userRepository.searchUsersExcludingSelf(query.trim(), currentUser.getId())
                .stream()
                .map(UserResponse::fromEntity)
                .collect(Collectors.toList());
    }

    public UserResponse updatePublicKey(String publicKey) {
        User currentUser = getAuthenticatedUser();
        currentUser.setPublicKey(publicKey.trim());
        currentUser.setUpdatedAt(LocalDateTime.now());
        User updated = userRepository.save(currentUser);
        log.info("Updated public key for user: userId={}", updated.getId());

        // Broadcast profile update event to all connected users including new public key
        ProfileUpdateEvent profileEvent = new ProfileUpdateEvent(
                updated.getId(),
                updated.getName(),
                updated.getEmail(),
                updated.getAvatar(),
                updated.getStatusMessage(),
                updated.getOnline(),
                updated.getPublicKey(),
                updated.getUpdatedAt()
        );
        try {
            messagingTemplate.convertAndSend("/topic/users/profile", profileEvent);
        } catch (Exception e) {
            log.warn("Failed to broadcast public key update: {}", e.getMessage());
        }

        return UserResponse.fromEntity(updated);
    }

    public UserResponse updateProfile(UpdateProfileRequest request) {
        User currentUser = getAuthenticatedUser();

        if (request.getName() != null && !request.getName().trim().isEmpty()) {
            currentUser.setName(request.getName().trim());
        }

        if (request.getAvatar() != null && !request.getAvatar().trim().isEmpty()) {
            currentUser.setAvatar(request.getAvatar().trim());
        }

        if (request.getStatusMessage() != null) {
            currentUser.setStatusMessage(request.getStatusMessage().trim());
        }

        if (request.getOnline() != null) {
            currentUser.setOnline(request.getOnline());
        }

        currentUser.setUpdatedAt(LocalDateTime.now());
        User updated = userRepository.save(currentUser);

        // Broadcast profile update event to all connected users
        ProfileUpdateEvent profileEvent = new ProfileUpdateEvent(
                updated.getId(),
                updated.getName(),
                updated.getEmail(),
                updated.getAvatar(),
                updated.getStatusMessage(),
                updated.getOnline(),
                updated.getPublicKey(),
                updated.getUpdatedAt()
        );
        try {
            messagingTemplate.convertAndSend("/topic/users/profile", profileEvent);
        } catch (Exception e) {
            log.warn("Failed to broadcast profile update: {}", e.getMessage());
        }

        // If online status changed, also broadcast presence event
        if (request.getOnline() != null) {
            PresenceEvent presenceEvent = new PresenceEvent(
                    updated.getId(),
                    updated.getEmail(),
                    updated.getOnline(),
                    updated.getStatusMessage(),
                    LocalDateTime.now()
            );
            try {
                messagingTemplate.convertAndSend("/topic/presence", presenceEvent);
            } catch (Exception e) {
                log.warn("Failed to broadcast presence update: {}", e.getMessage());
            }
        }

        log.info("Profile updated successfully for user: userId={}, name={}", updated.getId(), updated.getName());
        return UserResponse.fromEntity(updated);
    }

    public Map<String, Object> updatePassword(UpdatePasswordRequest request) {
        User currentUser = getAuthenticatedUser();

        if (!passwordEncoder.matches(request.getCurrentPassword(), currentUser.getPassword())) {
            throw new BadRequestException("Current password does not match");
        }

        if (request.getNewPassword().length() < 6) {
            throw new BadRequestException("New password must be at least 6 characters long");
        }

        currentUser.setPassword(passwordEncoder.encode(request.getNewPassword()));
        currentUser.setUpdatedAt(LocalDateTime.now());
        userRepository.save(currentUser);

        log.info("Password updated successfully for user: userId={}", currentUser.getId());
        return Map.of("success", true, "message", "Password updated successfully");
    }

    public UserResponse updateStatus(UpdateStatusRequest request) {
        User currentUser = getAuthenticatedUser();

        if (request.getOnline() != null) {
            currentUser.setOnline(request.getOnline());
        }

        if (request.getStatusMessage() != null) {
            currentUser.setStatusMessage(request.getStatusMessage().trim());
        }

        currentUser.setUpdatedAt(LocalDateTime.now());
        User updated = userRepository.save(currentUser);

        PresenceEvent presenceEvent = new PresenceEvent(
                updated.getId(),
                updated.getEmail(),
                updated.getOnline(),
                updated.getStatusMessage(),
                LocalDateTime.now()
        );
        try {
            messagingTemplate.convertAndSend("/topic/presence", presenceEvent);
        } catch (Exception e) {
            log.warn("Failed to broadcast presence update: {}", e.getMessage());
        }

        return UserResponse.fromEntity(updated);
    }
}
