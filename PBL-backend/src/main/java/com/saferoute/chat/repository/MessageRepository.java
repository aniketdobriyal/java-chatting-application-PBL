package com.saferoute.chat.repository;

import com.saferoute.chat.entity.Message;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MessageRepository extends MongoRepository<Message, String> {

    List<Message> findByConversationIdOrderByTimestampAsc(String conversationId);

    Page<Message> findByConversationIdOrderByTimestampAsc(String conversationId, Pageable pageable);

    Optional<Message> findFirstByConversationIdOrderByTimestampDesc(String conversationId);

    long countByConversationIdAndReceiverIdAndReadFalse(String conversationId, String receiverId);

    List<Message> findByConversationIdAndReceiverIdAndReadFalse(String conversationId, String receiverId);
}
