package com.example.stockmanager.product;

import com.example.stockmanager.product.dto.*;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/products")
@RequiredArgsConstructor
public class ProductController {

    private final ProductService service;

    @GetMapping
    public List<ProductResponse> list(
            @RequestParam(required = false) String q,
            @RequestParam(required = false, defaultValue = "ACTIVE") String status
    ) {
        return service.list(q, status);
    }

    @GetMapping("/{id}")
    public ProductResponse get(@PathVariable Long id) {
        return service.get(id);
    }

    @PostMapping
    public ProductResponse create(@RequestBody @Valid ProductCreateRequest req) {
        return service.create(req);
    }

    @PutMapping("/{id}")
    public ProductResponse update(@PathVariable Long id, @RequestBody @Valid ProductUpdateRequest req) {
        return service.update(id, req);
    }

    @DeleteMapping("/{id}")
    public void softDelete(@PathVariable Long id) {
        service.softDelete(id);
    }

    @PostMapping("/{id}/restore")
    public void restore(@PathVariable Long id) {
        service.restore(id);
    }

    @PostMapping("/{id}/stock-out")
    public ProductResponse stockOut(@PathVariable Long id, @RequestBody @Valid StockMoveRequest req) {
        return service.stockOut(id, req);
    }

    @PostMapping("/{id}/stock-in")
    public ProductResponse stockIn(@PathVariable Long id, @RequestBody @Valid StockMoveRequest req) {
        return service.stockIn(id, req);
    }
}
