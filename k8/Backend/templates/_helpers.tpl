{{/* Generate basic labels */}}
{{- define "lingvis.labels" }}
deploymentName: {{ .Release.Name | quote }}
{{- end }}