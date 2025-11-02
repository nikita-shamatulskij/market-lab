package org.marketlab.marketlabbff.dto;

import lombok.Data;

@Data
public class RegisterRequest {
    public String firstName;
    public String middleName;
    public String lastName;
    public String email;
    public String password;
    public String phoneNumber;
}
