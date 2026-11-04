# Multi-stage Dockerfile for Go POS Backend
FROM golang:1.22-alpine AS builder

WORKDIR /app

# Install build dependencies
RUN apk add --no-cache git

# Copy Go module files
COPY go.mod ./
COPY go.sum* ./
RUN go mod download || true

# Copy source code
COPY . .

# Build statically linked binary
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-w -s" -o pos-server .

# Production Runner Stage
FROM alpine:3.20

WORKDIR /app

# Install runtime dependencies
RUN apk add --no-cache ca-certificates tzdata
ENV TZ=Asia/Jakarta

# Create directory for persistent data
RUN mkdir -p /app/data

# Copy binary from builder
COPY --from=builder /app/pos-server /app/pos-server
COPY pos_store.json /app/pos_store.json

# Default environment variables
ENV PORT=8080
ENV DATA_PATH=/app/data/pos_store.json

EXPOSE 8080

CMD ["/app/pos-server"]
