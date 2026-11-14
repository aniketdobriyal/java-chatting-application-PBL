package com.saferoute.chat.repository;

import com.saferoute.chat.entity.ConversationParticipant;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ConversationParticipantRepository extends MongoRepository<ConversationParticipant, String> {

    List<ConversationParticipant> findByConversationId(String conversationId);

    Optional<ConversationParticipant> findByConversationIdAndUserId(String conversationId, String userId);

    boolean existsByConversationIdAndUserId(String conversationId, String userId);

    void deleteByConversationId(String conversationId);
}
