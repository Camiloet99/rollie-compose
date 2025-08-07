package com.rollie.mainservice.security;

import lombok.AllArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.web.server.authentication.ServerAuthenticationConverter;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.util.Collections;

@AllArgsConstructor
public class JwtAuthenticationConverter implements ServerAuthenticationConverter {

    private final JwtUtil jwtUtil;

    @Override
    public Mono<Authentication> convert(ServerWebExchange exchange) {
        return Mono.justOrEmpty(exchange.getRequest().getHeaders().getFirst(HttpHeaders.AUTHORIZATION))
                .filter(authHeader -> authHeader.startsWith("Bearer "))
                .flatMap(authHeader -> {
                    String authToken = authHeader.substring(7);
                    if (jwtUtil.validateToken(authToken)) {
                        String username = jwtUtil.getUsernameFromToken(authToken);
                        Authentication auth = new UsernamePasswordAuthenticationToken(username, null,
                                Collections.singletonList(new SimpleGrantedAuthority("ROLE_USER")));
                        return Mono.just(auth);
                    }
                    return Mono.empty();
                });
    }
}