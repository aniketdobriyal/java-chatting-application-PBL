package com.saferoute.chat.controller;

import com.saferoute.chat.dto.message.MessageResponse;
import com.saferoute.chat.dto.message.SendMessageRequest;
import com.saferoute.chat.service.MessageService;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.stereotype.Controller;

@Controller
public class WebSocketChatController {

    private final MessageService messageService;

    public WebSocketChatController(MessageService messageService) {
        this.messageService = messageService;
    }

    @MessageMapping("/chat.sendMessage/{conversationId}")
    public MessageResponse sendMessage(
            @DestinationVariable String conversationId,
            @Payload SendMessageRequest request
    ) {
        return messageService.sendMessage(conversationId, request);
    }
}
