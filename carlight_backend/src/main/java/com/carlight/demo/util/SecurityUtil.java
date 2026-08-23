package com.carlight.demo.util;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

public class SecurityUtil {

    private SecurityUtil() {}

    public static String currentUserPhone() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return auth.getName(); // phone
    }
}
