# Bài 2 – Dùng thư viện Nimbus thay JWT (jjwt) (Spring Boot 3 – Security 6, nimbus-jose-jwt 9.41.2)

Cùng chức năng với bài 1; chỉ thay phần JWT:
- `pom.xml`: bỏ jjwt, thêm `com.nimbusds:nimbus-jose-jwt`
- `services/JwtService.java`: dùng `SignedJWT`, `MACSigner`, `MACVerifier`
- `exceptions/`: 3 exception tự định nghĩa (hết hạn, sai chữ ký, sai định dạng) + `GlobalExceptionHandler`

## Chạy
JDK 17+, Maven, MySQL (mặc định root / 1234567@a$). `mvn spring-boot:run` → http://localhost:8005
(cùng port với bài 1, chạy một bài một lúc).

## Test: giống bài 1 (signup → login → /users/me với Bearer token; token sai/hết hạn trả 401).
