# $BUILDPLATFORM pins this stage to the build host's own architecture while TARGETARCH below selects what we
# emit. CGO is off, so Go cross-compiles natively and one runner produces both amd64 and arm64 for a multi-arch
# manifest (the service runs on Graviton).
FROM --platform=$BUILDPLATFORM golang:1.24-alpine AS builder

WORKDIR /app

COPY go.mod go.sum ./
RUN go mod download

COPY . .

ARG TARGETARCH
RUN CGO_ENABLED=0 GOOS=linux GOARCH=$TARGETARCH go build -o api-server ./cmd/server

FROM alpine:latest

RUN apk --no-cache add ca-certificates

# A dedicated non-root user; UID 10001 is outside the common system-user range.
RUN adduser -D -u 10001 app

WORKDIR /app

COPY --from=builder --chown=app:app /app/api-server .

USER app

EXPOSE 8000

CMD ["./api-server"]
