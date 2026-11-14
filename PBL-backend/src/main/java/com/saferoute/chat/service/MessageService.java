package com.saferoute.chat.service;

import com.saferoute.chat.dto.message.MessageResponse;
import com.saferoute.chat.dto.message.SendMessageRequest;
import com.saferoute.chat.entity.Conversation;
import com.saferoute.chat.entity.Message;
import com.saferoute.chat.entity.User;
import com.saferoute.chat.exception.BadRequestException;
import com.saferoute.chat.exception.ResourceNotFoundException;
import com.saferoute.chat.exception.UnauthorizedException;
import com.saferoute.chat.repository.ConversationParticipantRepository;
import com.saferoute.chat.repository.ConversationRepository;
import com.saferoute.chat.repository.MessageRepository;
import com.saferoute.chat.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Lazy;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class MessageService {

    private static final Logger log = LoggerFactory.getLogger(MessageService.class);

    private final MessageRepository messageRepository;
    private final ConversationRepository conversationRepository;
    private final ConversationParticipantRepository participantRepository;
    private final UserRepository userRepository;
    private final UserService userService;
    private final SimpMessagingTemplate messagingTemplate;
    private final MongoTemplate mongoTemplate;

    public MessageService(MessageRepository messageRepository,
                          ConversationRepository conversationRepository,
                          ConversationParticipantRepository participantRepository,
                          UserRepository userRepository,
                          UserService userService,
                          @Lazy SimpMessagingTemplate messagingTemplate,
                          MongoTemplate mongoTemplate) {
        this.messageRepository = messageRepository;
        this.conversationRepository = conversationRepository;
        this.participantRepository = participantRepository;
        this.userRepository = userRepository;
        this.userService = userService;
        this.messagingTemplate = messagingTemplate;
        this.mongoTemplate = mongoTemplate;
    }

    public List<MessageResponse> getConversationMessages(String conversationId, int page, int size) {
        User currentUser = userService.getAuthenticatedUser();
        verifyParticipant(conversationId, currentUser.getId());

        int safeSize = (size <= 0 || size > 200) ? 100 : size;
        int safePage = Math.max(page, 0);

        PageRequest pageRequest = PageRequest.of(safePage, safeSize, Sort.by(Sort.Direction.ASC, "timestamp"));

        return messageRepository.findByConversationIdOrderByTimestampAsc(conversationId, pageRequest)
                .stream()
                .map(MessageResponse::fromEntity)
                .collect(Collectors.toList());
    }

    public List<MessageResponse> getConversationMessages(String conversationId) {
        return getConversationMessages(conversationId, 0, 100);
    }

    public MessageResponse sendMessage(String conversationId, SendMessageRequest request) {
        User currentUser = userService.getAuthenticatedUser();
        verifyParticipant(conversationId, currentUser.getId());

        if (request.getCiphertext() == null || request.getCiphertext().trim().isEmpty()) {
            throw new BadRequestException("Ciphertext payload cannot be empty");
        }
        if (request.getNonce() == null || request.getNonce().trim().isEmpty()) {
            throw new BadRequestException("Nonce / IV is required for authenticated E2EE message");
        }

        Conversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new ResourceNotFoundException("Conversation not found with ID: " + conversationId));

        String receiverId = conversation.getParticipantIds().stream()
                .filter(id -> !id.equals(currentUser.getId()))
                .findFirst()
                .orElseGet(() -> {
                    if (request.getReceiverId() != null && !request.getReceiverId().isBlank()) {
                        return request.getReceiverId();
                    }
                    throw new BadRequestException("Could not determine message receiver");
                });

        Message message = Message.builder()
                .conversationId(conversationId)
                .senderId(currentUser.getId())
                .receiverId(receiverId)
                .ciphertext(request.getCiphertext().trim())
                .nonce(request.getNonce().trim())
                .algorithm(request.getAlgorithm() != null ? request.getAlgorithm() : "AES-256-GCM")
                .encryptionVersion(request.getEncryptionVersion() != null ? request.getEncryptionVersion() : 1)
                .timestamp(LocalDateTime.now())
                .read(false)
                .build();

        Message savedMessage = messageRepository.save(message);

        conversation.setUpdatedAt(LocalDateTime.now());
        conversationRepository.save(conversation);

        log.debug("Stored and relayed E2EE message: msgId={}, convId={}, senderId={}, algo={}",
                savedMessage.getId(), conversationId, currentUser.getId(), savedMessage.getAlgorithm());

        MessageResponse response = MessageResponse.fromEntity(savedMessage);

        try {
            messagingTemplate.convertAndSend("/topic/conversations/" + conversationId, response);
            messagingTemplate.convertAndSend("/topic/users/" + receiverId + "/messages", response);
            messagingTemplate.convertAndSend("/topic/users/" + currentUser.getId() + "/messages", response);
        } catch (Exception e) {
            log.warn("STOMP broadcast encountered issue: {}", e.getMessage());
        }

        return response;
    }

    public Map<String, Object> markMessagesAsRead(String conversationId) {
        User currentUser = userService.getAuthenticatedUser();
        verifyParticipant(conversationId, currentUser.getId());

        Query query = new Query(Criteria.where("conversationId").is(conversationId)
                .and("receiverId").is(currentUser.getId())
                .and("read").is(false));
        Update update = new Update().set("read", true);

        long updatedCount = mongoTemplate.updateMulti(query, update, Message.class).getModifiedCount();

        if (updatedCount > 0) {
            Conversation conversation = conversationRepository.findById(conversationId).orElse(null);
            if (conversation != null) {
                String peerId = conversation.getParticipantIds().stream()
                        .filter(id -> !id.equals(currentUser.getId()))
                        .findFirst()
                        .orElse(null);
                if (peerId != null) {
                    try {
                        Map<String, Object> readEvent = Map.of(
                                "conversationId", conversationId,
                                "readerId", currentUser.getId(),
                                "readAt", LocalDateTime.now().toString()
                        );
                        messagingTemplate.convertAndSend("/topic/users/" + peerId + "/read", readEvent);
                        messagingTemplate.convertAndSend("/topic/conversations/" + conversationId + "/read", readEvent);
                    } catch (Exception e) {
                        log.warn("Failed to broadcast read receipt: {}", e.getMessage());
                    }
                }
            }
        }

        return Map.of(
            "success", true,
            "conversationId", conversationId,
            "updatedCount", updatedCount
        );
    }

    public void verifyParticipant(String conversationId, String userId) {
        Conversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new ResourceNotFoundException("Conversation not found with ID: " + conversationId));

        boolean isParticipant = conversation.getParticipantIds().contains(userId)
                || participantRepository.existsByConversationIdAndUserId(conversationId, userId);

        if (!isParticipant) {
            throw new UnauthorizedException("You are not an authorized participant in this conversation");
        }
    }
}
