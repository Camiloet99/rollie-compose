package com.rollie.mainservice.exceptions;

import com.rollie.mainservice.models.ResponseBody;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseStatus;
import reactor.core.publisher.Mono;

@ControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(UserAlreadyExistsException.class)
    @ResponseStatus(HttpStatus.CONFLICT)
    public Mono<ResponseEntity<ResponseBody<String>>> handleUserAlreadyExists(UserAlreadyExistsException ex) {
        return Mono.just(buildResponse(ex.getMessage(), HttpStatus.CONFLICT));
    }

    @ExceptionHandler(Throwable.class)
    @ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
    public Mono<ResponseEntity<ResponseBody<String>>> handleThrowable(Throwable ex) {
        return Mono.just(buildResponse(ex.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR));
    }


    @ExceptionHandler(Exception.class)
    @ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
    public Mono<ResponseEntity<ResponseBody<String>>> handleServerError(Exception ex) {
        return Mono.just(buildResponse(ex.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR));
    }

    public static <T> ResponseEntity<ResponseBody<T>> buildResponse(T result, HttpStatus status) {
        String errorMsg = (result == null || String.valueOf(result).isBlank())
                ? status.getReasonPhrase()
                : String.valueOf(result);

        ResponseBody<T> orb = ResponseBody
                .<T>builder()
                .status(status.value())
                .error(errorMsg)
                .build();

        return ResponseEntity.status(status).body(orb);
    }

}
