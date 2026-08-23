package com.carlight.demo.entity;


import jakarta.persistence.*;
import lombok.*;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.List;

@Entity
@Table(name = "users")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class User extends BaseEntity implements UserDetails {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable=false)
    private String name;

    // ✅ phone is username
    @Column(nullable=false, unique = true, length = 15)
    private String phoneNumber;

    // email optional
    @Column(unique = true)
    private String email;

    @Column(nullable=false)
    private String password;

    @Enumerated(EnumType.STRING)
    @Column(nullable=false)
    private Role role;

    @ManyToOne
    @JoinColumn(name = "outlet_id")
    private Outlet outlet;

    @Builder.Default
    @Column(nullable = false)
    private Boolean active = true;

    @PrePersist
    @PreUpdate
    private void normalize() {
        if (phoneNumber != null) phoneNumber = phoneNumber.trim();
        if (email != null) email = email.trim().toLowerCase();
        if (name != null) name = name.trim();
    }

    // ✅ Spring Security
    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of(new SimpleGrantedAuthority("ROLE_" + role.name()));
    }

    @Override
    public String getUsername() {
        return phoneNumber; // ✅ important
    }

    @Override public boolean isAccountNonExpired() { return true; }
    @Override public boolean isAccountNonLocked() { return true; }
    @Override public boolean isCredentialsNonExpired() { return true; }

    @Override
    public boolean isEnabled() {
        return active != null && active;
    }
}
