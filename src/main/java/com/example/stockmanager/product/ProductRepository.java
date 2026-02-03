package com.example.stockmanager.product;

import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ProductRepository extends JpaRepository<Product, Long> {

    @Query("""
    select p from Product p
    where (:q is null or :q = '' or lower(p.description) like lower(concat('%', :q, '%')))
      and (
        :status = 'ALL'
        or (:status = 'ACTIVE' and p.deleted = false)
        or (:status = 'DELETED' and p.deleted = true)
      )
    order by p.id desc
  """)
    List<Product> search(@Param("q") String q, @Param("status") String status);
}
