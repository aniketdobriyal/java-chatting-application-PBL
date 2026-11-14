package com.saferoute.chat.config;

import com.saferoute.chat.entity.Conversation;
import com.saferoute.chat.entity.User;
import com.saferoute.chat.repository.ConversationParticipantRepository;
import com.saferoute.chat.repository.ConversationRepository;
import com.saferoute.chat.repository.UserRepository;
import com.saferoute.chat.security.CustomUserDetailsService;
import com.saferoute.chat.security.JwtService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Configuration
@EnableWebSocketMessageBroker
@Order(Ordered.HIGHEST_PRECEDENCE + 99)
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    private static final Logger log = LoggerFactory.getLogger(WebSocketConfig.class);

    private final JwtService jwtService;
    private final CustomUserDetailsService userDetailsService;
    private final UserRepository userRepository;
    private final ConversationRepository conversationRepository;
    private final ConversationParticipantRepository participantRepository;

    public WebSocketConfig(JwtService jwtService,
                           CustomUserDetailsService userDetailsService,
                           UserRepository userRepository,
                           ConversationRepository conversationRepository,
                           ConversationParticipantRepository participantRepository) {
        this.jwtService = jwtService;
        this.userDetailsService = userDetailsService;
        this.userRepository = userRepository;
        this.conversationRepository = conversationRepository;
        this.participantRepository = participantRepository;
    }

    private static final Pattern CONVERSATION_TOPIC_PATTERN = Pattern.compile("^/topic/conversations/([^/]+)(/.*)?$");
    private static final Pattern USER_TOPIC_PATTERN = Pattern.compile("^/topic/users/([^/]+)(/.*)?$");

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        // Native STOMP over WebSocket
        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns("*");

        // SockJS fallback STOMP endpoint
        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns("*")
                .withSockJS();
    }

    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        registry.enableSimpleBroker("/topic", "/queue");
        registry.setApplicationDestinationPrefixes("/app");
    }

    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
        registration.interceptors(new ChannelInterceptor() {
            @Override
            public Message<?> preSend(Message<?> message, MessageChannel channel) {
                StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
                if (accessor == null) {
                    return message;
                }

                // 1. Authenticate on CONNECT
                if (StompCommand.CONNECT.equals(accessor.getCommand())) {
                    String authHeader = accessor.getFirstNativeHeader("Authorization");
                    if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                        log.warn("STOMP connect attempt without valid Bearer token");
                        throw new AccessDeniedException("Authentication token required for WebSocket connection");
                    }

                    String jwt = authHeader.substring(7);
                    try {
                        String userEmail = jwtService.extractUsername(jwt);
                        if (userEmail != null) {
                            UserDetails userDetails = userDetailsService.loadUserByUsername(userEmail);
                            if (jwtService.isTokenValid(jwt, userDetails)) {
                                UsernamePasswordAuthenticationToken auth =
                                        new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());
                                accessor.setUser(auth);
                                if (accessor.getSessionAttributes() != null) {
                                    accessor.getSessionAttributes().put("userEmail", userEmail);
                                }
                            } else {
                                throw new AccessDeniedException("Expired or invalid JWT token");
                            }
                        }
                    } catch (Exception e) {
                        log.warn("STOMP JWT authentication failure: {}", e.getMessage());
                        throw new AccessDeniedException("Invalid authentication credentials");
                    }
                }

                // 2. Authorize SUBSCRIBE
                if (StompCommand.SUBSCRIBE.equals(accessor.getCommand())) {
                    String destination = accessor.getDestination();
                    if (destination != null) {
                        if (accessor.getUser() == null) {
                            throw new AccessDeniedException("Unauthenticated subscription denied");
                        }
                        String userEmail = accessor.getUser().getName();
                        User user = userRepository.findByEmail(userEmail)
                                .orElseThrow(() -> new AccessDeniedException("User not found"));

                        // Allow presence and public profile updates
                        if ("/topic/presence".equals(destination) || "/topic/users/profile".equals(destination)) {
                            return message;
                        }

                        // Check conversation topics
                        Matcher convMatcher = CONVERSATION_TOPIC_PATTERN.matcher(destination);
                        if (convMatcher.matches()) {
                            String conversationId = convMatcher.group(1);

                            // Enforce conversation membership
                            Conversation conversation = conversationRepository.findById(conversationId)
                                    .orElseThrow(() -> new AccessDeniedException("Conversation not found"));
                            boolean isParticipant = (conversation.getParticipantIds() != null && conversation.getParticipantIds().contains(user.getId()))
                                    || participantRepository.existsByConversationIdAndUserId(conversationId, user.getId());
                            if (!isParticipant) {
                                throw new AccessDeniedException("Unauthorized to subscribe to this conversation");
                            }
                            log.debug("STOMP subscription authorized for user {} to conversation {}", userEmail, conversationId);
                            return message;
                        }

                        // Check user-specific private topics (e.g. /topic/users/{userId}/messages)
                        Matcher userMatcher = USER_TOPIC_PATTERN.matcher(destination);
                        if (userMatcher.matches()) {
                            String targetUserId = userMatcher.group(1);
                            if (!user.getId().equals(targetUserId)) {
                                throw new AccessDeniedException("Unauthorized to subscribe to private user destination");
                            }
                            log.debug("STOMP private user subscription authorized for user {} to {}", userEmail, destination);
                            return message;
                        }
                    }
                }

                return message;
            }
        });
    }
}
