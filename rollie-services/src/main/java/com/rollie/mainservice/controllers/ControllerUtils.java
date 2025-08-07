package com.rollie.mainservice.controllers;

import com.rollie.mainservice.models.ResponseBody;
import lombok.experimental.UtilityClass;
import org.springframework.http.ResponseEntity;

import static org.springframework.http.HttpStatus.*;

@UtilityClass
public class ControllerUtils {

    public static <T> ResponseEntity<ResponseBody<T>> ok(T result) {
        ResponseBody<T> orb = ResponseBody
                .<T>builder()
                .status(OK.value())
                .result(result)
                .build();

        return ResponseEntity.ok(orb);
    }

    public static <T> ResponseEntity<ResponseBody<T>> error(T result) {
        ResponseBody<T> orb = ResponseBody
                .<T>builder()
                .status(INTERNAL_SERVER_ERROR.value())
                .result(result)
                .build();

        return ResponseEntity.ok(orb);
    }

    public static <T> ResponseEntity<ResponseBody<T>> created(T result) {
        ResponseBody<T> orb = ResponseBody
                .<T>builder()
                .status(CREATED.value())
                .result(result)
                .build();

        return ResponseEntity.ok(orb);
    }
}