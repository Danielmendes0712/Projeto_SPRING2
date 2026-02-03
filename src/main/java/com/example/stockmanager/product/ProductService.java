package com.example.stockmanager.product;

import com.example.stockmanager.product.dto.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.List;

import static org.springframework.http.HttpStatus.*;

@Service
@RequiredArgsConstructor
public class ProductService {

    private final ProductRepository repo;

    public ProductResponse create(ProductCreateRequest req) {
        Product p = Product.builder()
                .description(req.description())
                .quantity(req.quantity())
                .deleted(false)
                .deletedAt(null)
                .build();

        return toResponse(repo.save(p));
    }

    public ProductResponse update(Long id, ProductUpdateRequest req) {
        Product p = repo.findById(id).orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Product not found"));
        p.setDescription(req.description());
        p.setQuantity(req.quantity());
        return toResponse(repo.save(p));
    }

    public ProductResponse get(Long id) {
        Product p = repo.findById(id).orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Product not found"));
        return toResponse(p);
    }

    public List<ProductResponse> list(String q, String status) {
        String st = (status == null || status.isBlank()) ? "ACTIVE" : status.toUpperCase();
        if (!st.equals("ACTIVE") && !st.equals("DELETED") && !st.equals("ALL")) {
            throw new ResponseStatusException(BAD_REQUEST, "status must be ACTIVE, DELETED or ALL");
        }
        return repo.search(q, st).stream().map(this::toResponse).toList();
    }

    @Transactional
    public void softDelete(Long id) {
        Product p = repo.findById(id).orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Product not found"));
        if (!p.isDeleted()) {
            p.setDeleted(true);
            p.setDeletedAt(Instant.now());
        }
    }

    @Transactional
    public void restore(Long id) {
        Product p = repo.findById(id).orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Product not found"));
        if (p.isDeleted()) {
            p.setDeleted(false);
            p.setDeletedAt(null);
        }
    }

    @Transactional
    public ProductResponse stockOut(Long id, StockMoveRequest req) {
        Product p = repo.findById(id).orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Product not found"));
        if (p.isDeleted()) throw new ResponseStatusException(CONFLICT, "Product is deleted");

        int newQty = p.getQuantity() - req.quantity();
        if (newQty < 0) throw new ResponseStatusException(CONFLICT, "Insufficient stock");
        p.setQuantity(newQty);
        return toResponse(p);
    }

    @Transactional
    public ProductResponse stockIn(Long id, StockMoveRequest req) {
        Product p = repo.findById(id).orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Product not found"));
        if (p.isDeleted()) throw new ResponseStatusException(CONFLICT, "Product is deleted");

        p.setQuantity(p.getQuantity() + req.quantity());
        return toResponse(p);
    }

    private ProductResponse toResponse(Product p) {
        return new ProductResponse(
                p.getId(), p.getDescription(), p.getQuantity(),
                p.isDeleted(), p.getDeletedAt(),
                p.getCreatedAt(), p.getUpdatedAt()
        );
    }
}
