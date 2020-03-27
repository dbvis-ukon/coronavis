{{/* Generate basic labels */}}
{{- define "lingvis.labels" }}
deploymentName: {{ .Release.Name | quote }}
{{- end }}
{{- if eq .Values.urlProtocol "http" }}
traefik.ingress.kubernetes.io/frontend-entry-points: http
{{- else }}
traefik.ingress.kubernetes.io/frontend-entry-points: http,https
traefik.ingress.kubernetes.io/redirect-entry-point: https
traefik.ingress.kubernetes.io/redirect-permanent: "true"
{{- end }}