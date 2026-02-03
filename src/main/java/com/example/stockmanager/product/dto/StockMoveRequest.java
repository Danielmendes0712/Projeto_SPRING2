package com.example.stockmanager.product.dto;

import jakarta.validation.constraints.Min;

public record StockMoveRequest(@Min(1) int quantity) {}
