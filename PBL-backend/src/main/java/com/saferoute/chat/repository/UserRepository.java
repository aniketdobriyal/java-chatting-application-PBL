package com.saferoute.chat.repository;

import com.saferoute.chat.entity.User;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends MongoRepository<User, String> {

    Optional<User> findByEmail(String email);

    Boolean existsByEmail(String email);

    @Query("{ 'id': { $ne: ?1 }, $or: [ { 'name': { $regex: ?0, $options: 'i' } }, { 'email': { $regex: ?0, $options: 'i' } } ] }")
    List<User> searchUsersExcludingSelf(String query, String currentUserId);

    @Query("{ 'id': { $ne: ?0 } }")
    List<User> findAllExcludingSelf(String currentUserId);
}
