package com.saferoute.chat.config;

import com.saferoute.chat.dto.user.PresenceEvent;
import com.saferoute.chat.entity.User;
import com.saferoute.chat.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Lazy;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionConnectedEvent;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;

import java.security.Principal;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class WebSocketEventListener {

    private static final Logger log = LoggerFactory.getLogger(WebSocketEventListener.class);

    private final UserRepository userRepository;
    private final SimpMessagingTemplate messagingTemplate;

    // Track sessions: email -> Set of sessionIds
    private final Map<String, Set<String>> userSessionMap = new ConcurrentHashMap<>();
    // Track sessions: sessionId -> email
    private final Map<String, String> sessionUserMap = new ConcurrentHashMap<>();

    public WebSocketEventListener(UserRepository userRepository,
                                  @Lazy SimpMessagingTemplate messagingTemplate) {
        this.userRepository = userRepository;
        this.messagingTemplate = messagingTemplate;
    }

    @EventListener
    public void handleSessionConnected(SessionConnectedEvent event) {
        StompHeaderAccessor accessor = StompHeaderAccessor.wrap(event.getMessage());
        String email = null;
        if (accessor.getUser() != null) {
            email = accessor.getUser().getName();
        } else if (accessor.getSessionAttributes() != null) {
            email = (String) accessor.getSessionAttributes().get("userEmail");
        }

        if (email == null && event.getUser() != null) {
            email = event.getUser().getName();
        }

        if (email == null) {
            return;
        }

        String sessionId = accessor.getSessionId();
        if (sessionId == null) {
            sessionId = event.getSessionId();
        }

        if (sessionId != null) {
            sessionUserMap.put(sessionId, email);
            userSessionMap.computeIfAbsent(email, k -> ConcurrentHashMap.newKeySet()).add(sessionId);

            log.info("WebSocket session connected: email={}, sessionId={}, activeSessions={}",
                    email, sessionId, userSessionMap.get(email).size());

            userRepository.findByEmail(email).ifPresent(user -> {
                user.setOnline(true);
                user.setUpdatedAt(LocalDateTime.now());
                userRepository.save(user);

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
                    log.warn("Failed to broadcast connect presence: {}", e.getMessage());
                }
            });
        }
    }

    @EventListener
    public void handleSessionDisconnect(SessionDisconnectEvent event) {
        String sessionId = event.getSessionId();
        String email = sessionId != null ? sessionUserMap.remove(sessionId) : null;

        if (email == null && event.getUser() != null) {
            email = event.getUser().getName();
        }
        if (email == null && event.getMessage() != null) {
            StompHeaderAccessor accessor = StompHeaderAccessor.wrap(event.getMessage());
            if (accessor.getSessionAttributes() != null) {
                email = (String) accessor.getSessionAttributes().get("userEmail");
            }
        }

        if (email != null) {
            Set<String> sessions = userSessionMap.get(email);
            if (sessions != null) {
                sessions.remove(sessionId);
                log.info("WebSocket session disconnected: email={}, sessionId={}, remainingSessions={}",
                        email, sessionId, sessions.size());

                if (sessions.isEmpty()) {
                    userSessionMap.remove(email);

                    // User has disconnected all sessions -> mark offline
                    final String userEmail = email;
                    userRepository.findByEmail(userEmail).ifPresent(user -> {
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
                            log.warn("Failed to broadcast disconnect presence: {}", e.getMessage());
                        }
                    });
                }
            }
        }
    }

    public void removeUserSession(String email) {
        Set<String> sessions = userSessionMap.remove(email);
        if (sessions != null) {
            for (String sId : sessions) {
                sessionUserMap.remove(sId);
            }
        }
    }
}
