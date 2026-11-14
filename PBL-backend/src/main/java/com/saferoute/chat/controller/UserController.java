package com.saferoute.chat.controller;

import com.saferoute.chat.dto.user.UpdatePasswordRequest;
import com.saferoute.chat.dto.user.UpdateProfileRequest;
import com.saferoute.chat.dto.user.UpdatePublicKeyRequest;
import com.saferoute.chat.dto.user.UpdateStatusRequest;
import com.saferoute.chat.dto.user.UserResponse;
import com.saferoute.chat.service.UserService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping
    public ResponseEntity<List<UserResponse>> getUsers() {
        return ResponseEntity.ok(userService.getAllUsers());
    }

    @GetMapping("/me")
    public ResponseEntity<UserResponse> getCurrentUser() {
        return ResponseEntity.ok(userService.getCurrentUserProfile());
    }

    @GetMapping("/{id}")
    public ResponseEntity<UserResponse> getUserById(@PathVariable String id) {
        return ResponseEntity.ok(userService.getUserById(id));
    }

    @GetMapping("/search")
    public ResponseEntity<List<UserResponse>> searchUsers(@RequestParam(value = "q", required = false) String query) {
        return ResponseEntity.ok(userService.searchUsers(query));
    }

    @PutMapping("/me/profile")
    public ResponseEntity<UserResponse> updateProfile(@Valid @RequestBody UpdateProfileRequest request) {
        return ResponseEntity.ok(userService.updateProfile(request));
    }

    @PutMapping("/me/password")
    public ResponseEntity<Map<String, Object>> updatePassword(@Valid @RequestBody UpdatePasswordRequest request) {
        return ResponseEntity.ok(userService.updatePassword(request));
    }

    @PutMapping("/me/status")
    public ResponseEntity<UserResponse> updateStatus(@RequestBody UpdateStatusRequest request) {
        return ResponseEntity.ok(userService.updateStatus(request));
    }

    @PutMapping("/me/public-key")
    public ResponseEntity<UserResponse> updatePublicKey(@Valid @RequestBody UpdatePublicKeyRequest request) {
        return ResponseEntity.ok(userService.updatePublicKey(request.getPublicKey()));
    }
}
