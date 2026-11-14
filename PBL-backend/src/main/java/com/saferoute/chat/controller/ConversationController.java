package com.saferoute.chat.controller;

import com.saferoute.chat.dto.conversation.ConversationResponse;
import com.saferoute.chat.dto.conversation.CreateConversationRequest;
import com.saferoute.chat.service.ConversationService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/conversations")
public class ConversationController {

    private final ConversationService conversationService;

    public ConversationController(ConversationService conversationService) {
        this.conversationService = conversationService;
    }

    @GetMapping
    public ResponseEntity<List<ConversationResponse>> getConversations() {
        return ResponseEntity.ok(conversationService.getUserConversations());
    }

    @PostMapping
    public ResponseEntity<ConversationResponse> createConversation(@Valid @RequestBody CreateConversationRequest request) {
        ConversationResponse response = conversationService.getOrCreateConversation(request);
        return ResponseEntity.status(HttpStatus.OK).body(response);
    }
}
