{{/* Generate basic labels */}}
{{- define "lingvis.labels" }}
branch: {{ required ".Values.Branch is required" .Values.Branch | quote }}
app: {{ required ".Values.Project is required" .Values.Project | quote }}
project: {{ required ".Values.Group is required" .Values.Group | quote }}
{{- end }}