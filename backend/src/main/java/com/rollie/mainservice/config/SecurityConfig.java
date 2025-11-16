package com.rollie.mainservice.config;

import com.rollie.mainservice.security.JwtAuthenticationConverter;
import com.rollie.mainservice.security.JwtAuthenticationFilter;
import com.rollie.mainservice.security.JwtUtil;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpStatus;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.reactive.EnableWebFluxSecurity;
import org.springframework.security.config.web.server.SecurityWebFiltersOrder;
import org.springframework.security.config.web.server.ServerHttpSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.server.SecurityWebFilterChain;
import org.springframework.security.web.server.context.NoOpServerSecurityContextRepository;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.reactive.CorsConfigurationSource;
import org.springframework.web.cors.reactive.UrlBasedCorsConfigurationSource;
import reactor.core.publisher.Mono;

import java.util.Arrays;
import java.util.List;

@Configuration
@EnableWebFluxSecurity
public class SecurityConfig {

    @Bean
    public SecurityWebFilterChain securityWebFilterChain(ServerHttpSecurity http,
                                                         JwtAuthenticationFilter jwtAuthenticationFilter) {
        http
                .csrf().disable()
                .cors(Customizer.withDefaults())
                .authorizeExchange(exchanges -> exchanges
                        .pathMatchers("/auth/**").permitAll()
                        .pathMatchers("/health/**").permitAll()
                        .pathMatchers("/open/**").permitAll()
                        .anyExchange().authenticated()
                )
                .httpBasic().disable()
                .formLogin().disable()
                .securityContextRepository(NoOpServerSecurityContextRepository.getInstance())
                .exceptionHandling(exceptionHandlingSpec -> exceptionHandlingSpec
                        .authenticationEntryPoint((swe, e) -> Mono.fromRunnable(() ->
                                swe.getResponse().setStatusCode(HttpStatus.UNAUTHORIZED)))
                        .accessDeniedHandler((swe, e) -> Mono.fromRunnable(() ->
                                swe.getResponse().setStatusCode(HttpStatus.FORBIDDEN)))
                )
                .addFilterAt(jwtAuthenticationFilter, SecurityWebFiltersOrder.AUTHENTICATION);

        return http.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public JwtAuthenticationFilter jwtAuthenticationFilter(JwtAuthenticationConverter jwtAuthenticationConverter) {
        return new JwtAuthenticationFilter(jwtAuthenticationConverter);
    }

    @Bean
    public JwtAuthenticationConverter jwtAuthenticationConverter(JwtUtil jwtUtil) {
        return new JwtAuthenticationConverter(jwtUtil);
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(Arrays.asList("http://3.95.20.193", "https://3.95.20.193", "http://localhost:3000",
                "http://ec2-3-95-20-193.compute-1.amazonaws.com/", "https://ec2-3-95-20-193.compute-1.amazonaws.com/"));
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"));
        configuration.setAllowedHeaders(Arrays.asList("*"));
        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}