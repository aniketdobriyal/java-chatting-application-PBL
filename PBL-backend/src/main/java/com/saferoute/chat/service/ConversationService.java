package com.saferoute.chat.service;

import com.saferoute.chat.dto.conversation.ConversationResponse;
import com.saferoute.chat.dto.conversation.CreateConversationRequest;
import com.saferoute.chat.dto.message.MessageResponse;
import com.saferoute.chat.dto.user.UserResponse;
import com.saferoute.chat.entity.Conversation;
import com.saferoute.chat.entity.ConversationParticipant;
import com.saferoute.chat.entity.Message;
import com.saferoute.chat.entity.User;
import com.saferoute.chat.exception.BadRequestException;
import com.saferoute.chat.exception.ResourceNotFoundException;
import com.saferoute.chat.repository.ConversationParticipantRepository;
import com.saferoute.chat.repository.ConversationRepository;
import com.saferoute.chat.repository.MessageRepository;
import com.saferoute.chat.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class ConversationService {

    private static final Logger log = LoggerFactory.getLogger(ConversationService.class);

    private final ConversationRepository conversationRepository;
    private final ConversationParticipantRepository participantRepository;
    private final MessageRepository messageRepository;
    private final UserRepository userRepository;
    private final UserService userService;

    public ConversationService(ConversationRepository conversationRepository,
                               ConversationParticipantRepository participantRepository,
                               MessageRepository messageRepository,
                               UserRepository userRepository,
                               UserService userService) {
        this.conversationRepository = conversationRepository;
        this.participantRepository = participantRepository;
        this.messageRepository = messageRepository;
        this.userRepository = userRepository;
        this.userService = userService;
    }

    public List<ConversationResponse> getUserConversations() {
        User currentUser = userService.getAuthenticatedUser();
        List<Conversation> conversations = conversationRepository.findAllByUserId(currentUser.getId());

        return conversations.stream()
                .map(conv -> buildConversationResponse(conv, currentUser.getId()))
                .collect(Collectors.toList());
    }

    public ConversationResponse getOrCreateConversation(CreateConversationRequest request) {
        User currentUser = userService.getAuthenticatedUser();
        String recipientId = request.getTargetUserId();

        if (recipientId == null || recipientId.isBlank()) {
            throw new BadRequestException("Target recipient user ID is required");
        }

        if (recipientId.equals(currentUser.getId())) {
            throw new BadRequestException("Cannot create a conversation with yourself");
        }

        User recipient = userRepository.findById(recipientId)
                .orElseThrow(() -> new ResourceNotFoundException("Recipient user not found with ID: " + recipientId));

        // Duplicate Conversation Prevention
        Optional<Conversation> existingConv = conversationRepository.findConversationBetweenUsers(currentUser.getId(), recipient.getId());
        if (existingConv.isPresent()) {
            return buildConversationResponse(existingConv.get(), currentUser.getId());
        }

        // Create new conversation document in MongoDB
        Conversation conversation = Conversation.builder()
                .participantIds(new ArrayList<>(List.of(currentUser.getId(), recipient.getId())))
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();
        Conversation savedConversation = conversationRepository.save(conversation);

        // Save ConversationParticipant documents
        ConversationParticipant participant1 = ConversationParticipant.builder()
                .conversationId(savedConversation.getId())
                .userId(currentUser.getId())
                .joinedAt(LocalDateTime.now())
                .build();

        ConversationParticipant participant2 = ConversationParticipant.builder()
                .conversationId(savedConversation.getId())
                .userId(recipient.getId())
                .joinedAt(LocalDateTime.now())
                .build();

        participantRepository.save(participant1);
        participantRepository.save(participant2);

        log.info("Conversation created: convId={}, participants=[{}, {}]",
                savedConversation.getId(), currentUser.getId(), recipient.getId());

        return buildConversationResponse(savedConversation, currentUser.getId());
    }

    public ConversationResponse buildConversationResponse(Conversation conversation, String currentUserId) {
        String peerId = conversation.getParticipantIds().stream()
                .filter(id -> !id.equals(currentUserId))
                .findFirst()
                .orElse(currentUserId);

        User peerUser = userRepository.findById(peerId).orElse(null);

        Optional<Message> lastMessageOpt = messageRepository.findFirstByConversationIdOrderByTimestampDesc(conversation.getId());
        MessageResponse lastMessage = lastMessageOpt.map(MessageResponse::fromEntity).orElse(null);

        long unreadCount = messageRepository.countByConversationIdAndReceiverIdAndReadFalse(conversation.getId(), currentUserId);

        return ConversationResponse.builder()
                .id(conversation.getId())
                .participant(peerUser != null ? UserResponse.fromEntity(peerUser) : null)
                .lastMessage(lastMessage)
                .unreadCount(unreadCount)
                .build();
    }
}
