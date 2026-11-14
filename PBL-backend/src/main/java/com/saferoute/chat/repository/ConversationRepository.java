package com.saferoute.chat.repository;

import com.saferoute.chat.entity.Conversation;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ConversationRepository extends MongoRepository<Conversation, String> {

    /**
     * Find existing one-to-one conversation containing both participants.
     */
    @Query("{ 'participantIds': { $all: [?0, ?1] } }")
    Optional<Conversation> findConversationBetweenUsers(String user1Id, String user2Id);

    /**
     * Find all conversations where the specified user is a participant, sorted by recent activity.
     */
    @Query(value = "{ 'participantIds': ?0 }", sort = "{ 'updatedAt': -1 }")
    List<Conversation> findAllByUserId(String userId);
}
