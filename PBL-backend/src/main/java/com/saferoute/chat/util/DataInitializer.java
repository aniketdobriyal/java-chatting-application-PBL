package com.saferoute.chat.util;

import com.saferoute.chat.entity.Conversation;
import com.saferoute.chat.entity.ConversationParticipant;
import com.saferoute.chat.entity.User;
import com.saferoute.chat.repository.ConversationParticipantRepository;
import com.saferoute.chat.repository.ConversationRepository;
import com.saferoute.chat.repository.MessageRepository;
import com.saferoute.chat.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Component
public class DataInitializer implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataInitializer.class);

    private final UserRepository userRepository;
    private final ConversationRepository conversationRepository;
    private final ConversationParticipantRepository participantRepository;
    private final MessageRepository messageRepository;
    private final PasswordEncoder passwordEncoder;

    public DataInitializer(UserRepository userRepository,
                           ConversationRepository conversationRepository,
                           ConversationParticipantRepository participantRepository,
                           MessageRepository messageRepository,
                           PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.conversationRepository = conversationRepository;
        this.participantRepository = participantRepository;
        this.messageRepository = messageRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) throws Exception {
        if (userRepository.count() > 0) {
            log.info("MongoDB database already initialized. Resetting stale online states to offline on startup...");
            userRepository.findAll().forEach(u -> {
                if (Boolean.TRUE.equals(u.getOnline())) {
                    u.setOnline(false);
                    userRepository.save(u);
                }
            });
            return;
        }

        log.info("Seeding initial development users and conversations into MongoDB Atlas / local MongoDB...");

        String defaultPassword = passwordEncoder.encode("password123");

        // 1. Create Users (initialized as offline until WebSocket session connects)
        User user1 = userRepository.save(User.builder()
                .name("Aniket Dobriyal")
                .email("aniket@example.com")
                .password(defaultPassword)
                .avatar("https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80")
                .online(false)
                .statusMessage("Senior Full-Stack & Security Engineer")
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build());

        User user2 = userRepository.save(User.builder()
                .name("Ashutosh Sharma")
                .email("ashutosh@example.com")
                .password(defaultPassword)
                .avatar("https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=200&q=80")
                .online(false)
                .statusMessage("Building secure distributed microservices")
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build());

        User user3 = userRepository.save(User.builder()
                .name("Ankit Verma")
                .email("ankit@example.com")
                .password(defaultPassword)
                .avatar("https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80")
                .online(false)
                .statusMessage("Architecting cloud systems")
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build());

        User user4 = userRepository.save(User.builder()
                .name("Abhijit Roy")
                .email("abhijit@example.com")
                .password(defaultPassword)
                .avatar("https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80")
                .online(false)
                .statusMessage("Coding non-stop 🚀")
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build());

        // 2. Conversation 1: Aniket <-> Ashutosh
        Conversation conv1 = conversationRepository.save(Conversation.builder()
                .participantIds(new ArrayList<>(List.of(user1.getId(), user2.getId())))
                .createdAt(LocalDateTime.now().minusMinutes(20))
                .updatedAt(LocalDateTime.now().minusMinutes(1))
                .build());

        participantRepository.save(ConversationParticipant.builder()
                .conversationId(conv1.getId())
                .userId(user1.getId())
                .joinedAt(LocalDateTime.now().minusMinutes(20))
                .build());

        participantRepository.save(ConversationParticipant.builder()
                .conversationId(conv1.getId())
                .userId(user2.getId())
                .joinedAt(LocalDateTime.now().minusMinutes(20))
                .build());

        // 3. Conversation 2: Aniket <-> Ankit
        Conversation conv2 = conversationRepository.save(Conversation.builder()
                .participantIds(new ArrayList<>(List.of(user1.getId(), user3.getId())))
                .createdAt(LocalDateTime.now().minusMinutes(60))
                .updatedAt(LocalDateTime.now().minusMinutes(10))
                .build());

        participantRepository.save(ConversationParticipant.builder()
                .conversationId(conv2.getId())
                .userId(user1.getId())
                .joinedAt(LocalDateTime.now().minusMinutes(60))
                .build());

        participantRepository.save(ConversationParticipant.builder()
                .conversationId(conv2.getId())
                .userId(user3.getId())
                .joinedAt(LocalDateTime.now().minusMinutes(60))
                .build());

        log.info("Development database seeding into MongoDB completed successfully.");
    }
}
