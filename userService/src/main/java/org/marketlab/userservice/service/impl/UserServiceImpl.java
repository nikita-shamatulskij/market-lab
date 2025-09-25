package org.marketlab.userservice.service.impl;


import lombok.RequiredArgsConstructor;
import org.marketlab.userservice.dto.UserDTO;
import org.marketlab.userservice.model.User;
import org.marketlab.userservice.repository.UserRepository;
import org.marketlab.userservice.service.UserService;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;

    public void register(UserDTO userDTO) {
        User user = new User();
        user.setFirstName(userDTO.firstName());
        user.setMiddleName(userDTO.middleName());
        user.setLastName(userDTO.lastName());
        user.setEmail(userDTO.email());
        user.setPassword(userDTO.password());
        user.setPhoneNumber(userDTO.phoneNumber());
        userRepository.save(user);
    }

    public User findByEmail(String email) {
        return userRepository.findByEmail(email).orElseThrow(null);
    }

}
