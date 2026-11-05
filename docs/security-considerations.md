# Security Considerations

## Overview

Skeptical Control is designed with security as a primary concern, particularly for isolating and executing untrusted user code. This document outlines the security model, threats, and mitigations.

## Threat Model

### Primary Threats

1. **Container Escape**: Malicious code escaping the isolated Docker environment
2. **Resource Exhaustion**: DoS attacks through resource consumption
3. **Path Traversal**: ZIP files attempting to access files outside the workspace
4. **ZIP Bombs**: Malicious ZIP files causing denial of service through extraction
5. **Credential Exposure**: Leaking secrets or sensitive data
6. **Supply Chain Attacks**: Compromised Docker images or dependencies

## Isolation Strategy

### Docker Container Isolation

**Implemented:**
- Each project runs in an isolated Docker Compose project
- Custom bridge networks separate projects from each other
- Resource limits (CPU, memory, PIDs) are enforced per container
- Time limits prevent long-running processes
- Non-privileged execution by default

**Limitations:**
- Containers share the host kernel
- Some system calls may have broader impact
- Network isolation is not complete (can be configured)

### Workspace Management

**Implemented:**
- Projects extracted to controlled workspace directories
- Original uploads remain immutable
- Automatic cleanup of temporary files
- Workspace directories are scoped by project ID

**Limitations:**
- File system isolation depends on Docker volume mounts
- Workspace cleanup may fail in error conditions

## Input Validation

### ZIP File Validation

**Implemented:**
- Maximum upload size: 100MB
- Maximum extracted size: 500MB
- Path traversal protection in extraction
- ZIP bomb detection
- Extension validation (ZIP only)

**Code Location:** `research-engine/src/services/inspector.py`

### Docker Compose Validation

**Implemented:**
- YAML parsing with error handling
- Image name validation
- Volume mount validation (prevents host path mounting)
- Network configuration validation

**Code Location:** `research-engine/src/services/inspector.py`

## Resource Limits

### Applied Limits

- **CPU**: 2 cores per service
- **Memory**: 2GB per service
- **Time**: 5 minutes for environment startup
- **PIDs**: Default Docker limits

**Configuration:**
```yaml
deploy:
  resources:
    limits:
      cpus: '2'
      memory: 2G
```

**Code Location:** `research-engine/src/services/orchestrator.py`

## Network Security

### Network Isolation

**Implemented:**
- Custom bridge networks per project
- No host network access by default
- Internal network for service communication
- No exposed ports to external network

**Configuration:**
```yaml
networks:
  app_network:
    driver: bridge
    internal: false  # Can be set to true for complete isolation
```

### Firewall Rules

**Not Implemented (Future):**
- Explicit firewall rules per project
- Rate limiting on network traffic
- Egress filtering

## Authentication & Authorization

### JWT Authentication

**Implemented:**
- JWT tokens for API authentication
- Token expiration (default 7 days)
- Password hashing with bcrypt (cost factor 10)
- Protected routes require valid token

**Code Location:** `backend/src/services/authService.ts`

### Authorization

**Implemented:**
- User-scoped project access
- Project ownership verification
- Token-based user identification

**Limitations:**
- No role-based access control (RBAC)
- No multi-tenant isolation beyond user scope

## Secrets Management

### Environment Variables

**Implemented:**
- Secrets stored in environment variables
- `.env.example` template for configuration
- No secrets in frontend code
- No secrets in Git repository

**Best Practices:**
- Use strong random strings for JWT_SECRET
- Change default secrets in production
- Use secret management service in production (e.g., HashiCorp Vault)

### Database Credentials

**Implemented:**
- Database credentials in environment variables
- No credential logging
- Encrypted connections recommended for production

## Docker Security

### Docker Socket Access

**Implemented:**
- Research engine has Docker socket access (required for orchestration)
- Uploaded containers do NOT have Docker socket access
- No volume mounts of Docker socket to user containers

**Risk:** Research engine compromise could affect host Docker daemon

**Mitigation:**
- Run research engine in dedicated container
- Limit research engine permissions
- Monitor research engine access

### Image Security

**Implemented:**
- No image pull restrictions (Phase 1 limitation)
- Images pulled from Docker Hub or configured registries

**Future:**
- Image allowlist/denylist
- Image scanning for vulnerabilities
- Private registry enforcement

## Logging & Monitoring

### Security Logging

**Implemented:**
- API request logging with Morgan
- Activity history in database
- Error logging with stack traces (development only)

**Future:**
- Security event aggregation
- Anomaly detection
- Real-time alerting

### Audit Trail

**Implemented:**
- Activity history table tracks:
  - User actions
  - Project operations
  - Environment lifecycle
  - Errors and failures

**Code Location:** Database schema `activity_history` table

## Known Limitations

### Phase 1 Limitations

1. **No Image Verification**: Users can pull any Docker image
2. **No Egress Filtering**: Containers can access external networks
3. **No Persistent Sandbox**: Environment cleanup may leave artifacts
4. **No Rate Limiting**: API endpoints have no rate limits
5. **No Input Sanitization**: Docker Compose content not fully sanitized
6. **No Resource Monitoring**: No real-time resource usage tracking

### Future Enhancements

1. **Image Scanning**: Integrate vulnerability scanners
2. **Firewall Rules**: Implement network policies
3. **Kubernetes Support**: Extend to Kubernetes isolation
4. **Role-Based Access Control**: Implement RBAC
5. **Audit Log Export**: Export security events
6. **Real-time Monitoring**: Resource usage alerts

## Recommendations for Production

1. **Run Behind Reverse Proxy**: Use Nginx or similar with TLS
2. **Use Secret Management**: HashiCorp Vault, AWS Secrets Manager
3. **Enable Image Scanning**: Trivy, Clair, or similar
4. **Implement Rate Limiting**: Redis-based rate limiting
5. **Network Policies**: Implement Kubernetes NetworkPolicies or similar
6. **Regular Security Audits**: Penetration testing and code reviews
7. **Monitor Docker Daemon**: Audit Docker API access
8. **Backup and Recovery**: Regular database backups
9. **Incident Response**: Documented security incident procedures
10. **Compliance**: Ensure compliance with relevant standards (SOC2, ISO27001)

## Reporting Security Issues

If you discover a security vulnerability, please:
1. Do not open a public issue
2. Email security@skeptical-control.com with details
3. Allow time for investigation and remediation
4. Coordinate disclosure timeline

## References

- [Docker Security Best Practices](https://docs.docker.com/engine/security/)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [CIS Docker Benchmark](https://www.cisecurity.org/benchmark/docker)
