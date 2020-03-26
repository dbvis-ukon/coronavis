{{/* Generate basic labels */}}
{{- define "lingvis.labels" }}
deployment_name: {{ .Release.Name | quote }}
{{- end }}