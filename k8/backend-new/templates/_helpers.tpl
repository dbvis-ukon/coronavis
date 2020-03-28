{{/* Generate basic labels */}}
{{- define "lingvis.labels" }}
deploymentName: {{ .Release.Name | quote }}
{{- end }}
{{- define "nginx.annotations" }}
{{- if eq .Values.urlProtocol "http" }}
nginx.ingress.kubernetes.io/ssl-redirect: "false"
nginx.ingress.kubernetes.io/force-ssl-redirect: "false"
{{- else }}
cert-manager.io/cluster-issuer: letsencrypt-production
{{- end }}
{{- end }}