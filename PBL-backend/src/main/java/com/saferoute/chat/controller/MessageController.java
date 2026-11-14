package com.saferoute.chat.controller;

import com.saferoute.chat.dto.message.MessageResponse;
import com.saferoute.chat.dto.message.SendMessageRequest;
import com.saferoute.chat.service.MessageService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/conversations/{conversationId}")
public class MessageController {

    private final MessageService messageService;

    public MessageController(MessageService messageService) {
        this.messageService = messageService;
    }

    @GetMapping("/messages")
    public ResponseEntity<List<MessageResponse>> getMessages(
            @PathVariable String conversationId,
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "100") int size
    ) {
        return ResponseEntity.ok(messageService.getConversationMessages(conversationId, page, size));
    }

    @PostMapping("/messages")
    public ResponseEntity<MessageResponse> sendMessage(
            @PathVariable String conversationId,
            @Valid @RequestBody SendMessageRequest request
    ) {
        MessageResponse response = messageService.sendMessage(conversationId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PatchMapping("/read")
    public ResponseEntity<Map<String, Object>> markAsRead(@PathVariable String conversationId) {
        return ResponseEntity.ok(messageService.markMessagesAsRead(conversationId));
    }
}
