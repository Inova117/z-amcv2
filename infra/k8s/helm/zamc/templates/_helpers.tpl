{{/*
Expand the name of the chart.
*/}}
{{- define "zamc.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Create a default fully qualified app name.
We truncate at 63 chars because some Kubernetes name fields are limited to this (by the DNS naming spec).
If release name contains chart name it will be used as a full name.
*/}}
{{- define "zamc.fullname" -}}
{{- if .Values.fullnameOverride }}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- $name := default .Chart.Name .Values.nameOverride }}
{{- if contains $name .Release.Name }}
{{- .Release.Name | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" }}
{{- end }}
{{- end }}
{{- end }}

{{/*
Create chart name and version as used by the chart label.
*/}}
{{- define "zamc.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Common labels
*/}}
{{- define "zamc.labels" -}}
helm.sh/chart: {{ include "zamc.chart" . }}
{{ include "zamc.selectorLabels" . }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}

{{/*
Selector labels
*/}}
{{- define "zamc.selectorLabels" -}}
app.kubernetes.io/name: {{ include "zamc.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}

{{/*
Create the name of the service account to use
*/}}
{{- define "zamc.serviceAccountName" -}}
{{- if .Values.serviceAccount.create }}
{{- default (include "zamc.fullname" .) .Values.serviceAccount.name }}
{{- else }}
{{- default "default" .Values.serviceAccount.name }}
{{- end }}
{{- end }}

{{/*
Create the database URL
*/}}
{{- define "zamc.databaseUrl" -}}
{{- if .Values.postgresql.enabled }}
{{- printf "postgresql://%s:%s@%s-postgresql:5432/%s" .Values.postgresql.auth.username .Values.postgresql.auth.password (include "zamc.fullname" .) .Values.postgresql.auth.database }}
{{- else }}
{{- .Values.secrets.database.url }}
{{- end }}
{{- end }}

{{/*
Create the Redis URL
*/}}
{{- define "zamc.redisUrl" -}}
{{- if .Values.redis.enabled }}
{{- if .Values.redis.auth.enabled }}
{{- printf "redis://:%s@%s-redis-master:6379" .Values.redis.auth.password (include "zamc.fullname" .) }}
{{- else }}
{{- printf "redis://%s-redis-master:6379" (include "zamc.fullname" .) }}
{{- end }}
{{- else }}
{{- .Values.secrets.redis.url }}
{{- end }}
{{- end }}

{{/*
Create the NATS URL
*/}}
{{- define "zamc.natsUrl" -}}
{{- if .Values.nats.enabled }}
{{- printf "nats://%s-nats:4222" (include "zamc.fullname" .) }}
{{- else }}
{{- .Values.secrets.nats.url }}
{{- end }}
{{- end }}

{{/*
Create image pull policy
*/}}
{{- define "zamc.imagePullPolicy" -}}
{{- if .Values.global.imageRegistry }}
{{- "Always" }}
{{- else }}
{{- "IfNotPresent" }}
{{- end }}
{{- end }}

{{/*
Create image name
*/}}
{{- define "zamc.image" -}}
{{- $registry := .Values.global.imageRegistry -}}
{{- $repository := .repository -}}
{{- $tag := .tag | default $.Chart.AppVersion -}}
{{- if $registry }}
{{- printf "%s/%s:%s" $registry $repository $tag }}
{{- else }}
{{- printf "%s:%s" $repository $tag }}
{{- end }}
{{- end }} 