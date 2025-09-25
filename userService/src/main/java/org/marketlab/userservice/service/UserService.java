package org.marketlab.userservice.service;


import org.marketlab.userservice.dto.UserDTO;
import org.marketlab.userservice.model.User;

public interface UserService {

    void register(UserDTO userDTO);
    User findByEmail(String email);
}
