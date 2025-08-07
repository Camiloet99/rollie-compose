package com.rollie.mainservice.controllers;

import com.rollie.mainservice.entities.DocumentUploadLog;
import com.rollie.mainservice.models.ResponseBody;
import com.rollie.mainservice.services.DocumentUploadService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.http.codec.multipart.FilePart;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;

import java.util.List;

@RestController
@RequestMapping("/admin/documents")
@RequiredArgsConstructor
public class AdminDocumentController {

    private final DocumentUploadService documentUploadService;

    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public Mono<ResponseEntity<ResponseBody<Object>>> uploadDocument(
            @RequestPart("file") FilePart file) {
        return documentUploadService.forwardFileToPythonBackend(file)
                .map(ControllerUtils::created);
    }

    @GetMapping(value = "/all")
    public Mono<ResponseEntity<ResponseBody<List<DocumentUploadLog>>>> getAllLogs() {
        return documentUploadService.getAllUploadLogs()
                .map(ControllerUtils::ok);
    }

}
