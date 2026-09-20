// Package secrets reads AWS Secrets Manager values, the way every Pratirupa service does: the environment names a
// secret, the secret carries the credentials. Locally the AWS profile in .env.common signs the call; in ECS the task
// role does.
package secrets

import (
	"context"
	"sync"
	"time"

	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/secretsmanager"
	"github.com/rs/zerolog/log"
)

var (
	client *secretsmanager.Client
	cache  = make(map[string]string)
	mu     sync.RWMutex
	once   sync.Once
)

func initClient() {
	cfg, err := config.LoadDefaultConfig(context.Background())
	if err != nil {
		log.Warn().Err(err).Msg("Failed to load AWS config; secrets unavailable")
		return
	}
	client = secretsmanager.NewFromConfig(cfg)
}

// GetSecret returns a secret's string value, or "" when it cannot be fetched. Values are cached for the process.
func GetSecret(name string) string {
	once.Do(initClient)
	if client == nil {
		return ""
	}

	mu.RLock()
	if v, ok := cache[name]; ok {
		mu.RUnlock()
		return v
	}
	mu.RUnlock()

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	out, err := client.GetSecretValue(ctx, &secretsmanager.GetSecretValueInput{SecretId: &name})
	if err != nil {
		log.Warn().Err(err).Str("secret", name).Msg("Failed to get secret")
		return ""
	}
	if out.SecretString == nil {
		log.Warn().Str("secret", name).Msg("Secret has no string value")
		return ""
	}

	mu.Lock()
	cache[name] = *out.SecretString
	mu.Unlock()
	return *out.SecretString
}
