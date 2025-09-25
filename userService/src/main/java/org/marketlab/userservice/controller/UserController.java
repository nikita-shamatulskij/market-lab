package org.marketlab.userservice.controller;

import lombok.RequiredArgsConstructor;
import org.marketlab.userservice.dto.UserDTO;
import org.marketlab.userservice.model.User;
import org.marketlab.userservice.repository.UserRepository;
import org.marketlab.userservice.service.UserService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;
    private final UserRepository userRepository;

    @PostMapping("/register")
    public ResponseEntity<Void> register(@RequestBody UserDTO userDto) {
        userService.register(userDto);
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }

    @GetMapping("/by-email")
    public ResponseEntity<UserDTO> getByEmail(@RequestParam String email) {
        return userRepository.findByEmail(email)
                .map(user -> ResponseEntity.ok(new UserDTO(
                        user.getFirstName(),
                        user.getMiddleName(),
                        user.getLastName(),
                        user.getEmail(),
                        user.getPassword(),
                        user.getPhoneNumber()
                )))
                .orElse(ResponseEntity.notFound().build());
    }
}

