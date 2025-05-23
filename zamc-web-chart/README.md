
# ZAMC-Web Helm Chart

This Helm chart deploys the ZAMC-Web frontend application on a Kubernetes cluster.

## Prerequisites

- Kubernetes 1.19+
- Helm 3.2.0+
- An Ingress Controller (recommended: NGINX Ingress Controller)

## Installing the Chart

To install the chart with the release name `zamc-web`:

```bash
helm install zamc-web ./zamc-web-chart
```

## Values

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| nameOverride | string | `""` | Override the name of the chart |
| fullnameOverride | string | `""` | Override the full name of the chart |
| namespace.create | bool | `true` | Create the namespace |
| namespace.name | string | `"zamc-web"` | Namespace to deploy resources |
| image.repository | string | `"zamc-web"` | Image repository |
| image.tag | string | `"latest"` | Image tag |
| image.pullPolicy | string | `"Always"` | Image pull policy |
| replicaCount | int | `2` | Number of replicas |
| resources | object | `{}` | CPU/Memory resource requests/limits |
| service.type | string | `"ClusterIP"` | Service type |
| service.port | int | `80` | Service port |
| ingress.enabled | bool | `true` | Enable ingress |
| ingress.className | string | `"nginx"` | Ingress class name |
| ingress.hosts | list | `[]` | Ingress hosts |
| ingress.tls | list | `[]` | Ingress TLS configuration |
| env | list | `[]` | Environment variables |

## GitOps Integration

This chart is designed to work with GitOps tools like ArgoCD or Flux. To use it with these tools:

1. Store this chart in your Git repository
2. Configure your GitOps tool to sync the chart to your cluster
3. Create a values override file for each environment (dev, staging, prod)

Example ArgoCD Application:

```yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: zamc-web
  namespace: argocd
spec:
  project: default
  source:
    repoURL: git@github.com:your-org/your-gitops-repo.git
    path: zamc-web-chart
    targetRevision: HEAD
    helm:
      valueFiles:
        - values-prod.yaml
  destination:
    server: https://kubernetes.default.svc
    namespace: zamc-web
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
```
