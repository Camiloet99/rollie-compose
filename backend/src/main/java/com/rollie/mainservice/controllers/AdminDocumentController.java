package com.rollie.mainservice.controllers;

import com.rollie.mainservice.entities.DocumentUploadLog;
import com.rollie.mainservice.models.ResponseBody;
import com.rollie.mainservice.services.DocumentUploadService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.http.codec.multipart.FilePart;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;

import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;

@RestController
@RequestMapping("/admin/documents")
@RequiredArgsConstructor
public class AdminDocumentController {

    private final DocumentUploadService documentUploadService;

    // Inyecta zona horaria con default America/Bogota para validar "hoy"
    @Value("${app.timezone:America/Bogota}")
    private String appTimezone;

    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public Mono<ResponseEntity<ResponseBody<Object>>> uploadDocument(
            @RequestPart("file") FilePart file,
            @RequestPart("asOfDate") String asOfDateStr
    ) {
        ZoneId zoneId = ZoneId.of(appTimezone);

        // Validación: asOfDate obligatorio, formato y no futuro
        LocalDate asOfDate = LocalDate.parse(asOfDateStr);
        LocalDate today = LocalDate.now(zoneId);
        if (asOfDate.isAfter(today)) {
            return Mono.error(new IllegalArgumentException("asOfDate cannot be in the future"));
        }

        return documentUploadService
                .forwardFileToPythonBackend(file, asOfDate, zoneId)
                .map(ControllerUtils::created);
    }

    @GetMapping(value = "/all")
    public Mono<ResponseEntity<ResponseBody<List<DocumentUploadLog>>>> getAllLogs() {
        return documentUploadService.getAllUploadLogs()
                .map(ControllerUtils::ok);
    }
}

